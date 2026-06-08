import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError } from '@mobiwave/shared';
import crypto from 'crypto';

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_BUCKET = process.env.S3_BUCKET || 'serviceos-documents';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const URL_EXPIRY = parseInt(process.env.S3_URL_EXPIRY || '3600', 10);

export class DocumentsService {
  async generateUploadUrl(data: {
    tenantId: string;
    userId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    category: string;
  }) {
    if (data.fileSize > 100 * 1024 * 1024) {
      throw new ValidationError('File size exceeds 100MB limit');
    }

    const fileKey = `${data.tenantId}/${data.userId}/${uuidv4()}-${data.fileName}`;
    const documentId = uuidv4();
    const uploadLogId = uuidv4();

    await prisma.uploadLog.create({
      data: {
        id: uploadLogId,
        tenantId: data.tenantId,
        userId: data.userId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: 'INITIATED',
      },
    });

    const uploadUrl = this.generatePresignedUrl('PUT', fileKey, data.mimeType);
    const publicUrl = `${S3_ENDPOINT}/${S3_BUCKET}/${fileKey}`;

    return {
      documentId,
      uploadUrl,
      publicUrl,
      fileKey,
      uploadLogId,
      expiresIn: URL_EXPIRY,
    };
  }

  async confirmUpload(documentId: string, tenantId: string, fileKey: string, userId: string, data: {
    fileName: string;
    mimeType: string;
    fileSize: number;
    category: string;
  }) {
    const document = await prisma.document.create({
      data: {
        id: documentId,
        tenantId,
        userId,
        fileName: data.fileName,
        fileKey,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        category: data.category as any,
        status: 'ACTIVE',
      },
    });

    await prisma.uploadLog.updateMany({
      where: { tenantId, userId, fileName: data.fileName, status: 'INITIATED' },
      data: { status: 'COMPLETED', documentId },
    });

    await prisma.outbox.create({
      data: {
        id: uuidv4(),
        tenantId,
        channel: 'documents',
        eventType: 'document.uploaded',
        eventKey: documentId,
        payload: { documentId, fileKey, category: data.category, userId } as any,
        headers: {} as any,
        status: 'PENDING',
      },
    });

    return document;
  }

  async getDownloadUrl(id: string, tenantId: string) {
    const doc = await prisma.document.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!doc) throw new NotFoundError('Document', id);

    return {
      downloadUrl: this.generatePresignedUrl('GET', doc.fileKey),
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      expiresIn: URL_EXPIRY,
    };
  }

  async deleteDocument(id: string, tenantId: string) {
    const doc = await prisma.document.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!doc) throw new NotFoundError('Document', id);

    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });

    await prisma.outbox.create({
      data: {
        id: uuidv4(),
        tenantId,
        channel: 'documents',
        eventType: 'document.deleted',
        eventKey: id,
        payload: { documentId: id, fileKey: doc.fileKey } as any,
        headers: {} as any,
        status: 'PENDING',
      },
    });

    return { deleted: true };
  }

  async listDocuments(tenantId: string, query: {
    userId?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };
    if (query.userId) where.userId = query.userId;
    if (query.category) where.category = query.category;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return { documents, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private generatePresignedUrl(method: 'PUT' | 'GET', fileKey: string, contentType?: string): string {
    const expires = Math.floor(Date.now() / 1000) + URL_EXPIRY;
    const objectKey = `/${S3_BUCKET}/${fileKey}`;

    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const policy = {
      expiration: new Date(expires * 1000).toISOString(),
      conditions: [
        { bucket: S3_BUCKET },
        { key: fileKey },
        { 'x-amz-algorithm': 'AWS4-HMAC-SHA256' },
        { 'x-amz-credential': `${S3_ACCESS_KEY}/${dateStamp}/${S3_REGION}/s3/aws4_request` },
        { 'x-amz-date': amzDate },
        ...(contentType ? [{ 'Content-Type': contentType }] : []),
      ],
    };

    const encodedPolicy = Buffer.from(JSON.stringify(policy)).toString('base64');
    const signature = crypto
      .createHmac('sha256', S3_SECRET_KEY)
      .update(encodedPolicy)
      .digest('hex');

    const queryParams = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${S3_ACCESS_KEY}/${dateStamp}/${S3_REGION}/s3/aws4_request`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(URL_EXPIRY),
      'X-Amz-Signature': signature,
      ...(contentType ? { 'Content-Type': contentType } : {}),
    });

    return `${S3_ENDPOINT}${objectKey}?${queryParams.toString()}`;
  }
}

export const documentsService = new DocumentsService();
