import prisma from '@mobiwave/prisma';
import { NotFoundError } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class WorkerService {
  async create(data: {
    userId: string;
    tenantId: string;
    idNumber?: string;
    skills?: string[];
    hourlyRate?: number;
    workingHours?: Record<string, unknown>;
  }) {
    const existing = await prisma.workerProfile.findUnique({
      where: { userId: data.userId },
    });
    if (existing) {
      return existing;
    }

    return prisma.workerProfile.create({
      data: {
        id: uuidv4(),
        userId: data.userId,
        tenantId: data.tenantId,
        idNumber: data.idNumber,
        kycStatus: 'PENDING',
        skills: data.skills || [],
        hourlyRate: data.hourlyRate,
        reliabilityScore: 5.0,
        isAvailable: true,
        workingHours: data.workingHours ? JSON.parse(JSON.stringify(data.workingHours)) : undefined,
      },
      include: { user: true },
    });
  }

  async getById(userId: string, tenantId: string) {
    const profile = await prisma.workerProfile.findFirst({
      where: { userId, tenantId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundError('Worker profile');
    return profile;
  }

  async update(userId: string, tenantId: string, data: {
    skills?: string[];
    hourlyRate?: number;
    isAvailable?: boolean;
    workingHours?: Record<string, unknown>;
    currentLocation?: { lat: number; lng: number };
  }) {
    const profile = await prisma.workerProfile.findFirst({
      where: { userId, tenantId },
    });
    if (!profile) throw new NotFoundError('Worker profile');

    return prisma.workerProfile.update({
      where: { id: profile.id },
      data: {
        skills: data.skills,
        hourlyRate: data.hourlyRate,
        isAvailable: data.isAvailable,
        workingHours: data.workingHours ? JSON.parse(JSON.stringify(data.workingHours)) : undefined,
        currentLocation: data.currentLocation ? JSON.parse(JSON.stringify(data.currentLocation)) : undefined,
      },
      include: { user: true },
    });
  }

  async submitKyc(userId: string, tenantId: string, data: { idNumber: string; documentUrls: string[] }) {
    const profile = await prisma.workerProfile.findFirst({
      where: { userId, tenantId },
    });
    if (!profile) throw new NotFoundError('Worker profile');

    return prisma.workerProfile.update({
      where: { id: profile.id },
      data: {
        idNumber: data.idNumber,
        kycStatus: 'IN_REVIEW',
        kycData: JSON.parse(JSON.stringify({ documentUrls: data.documentUrls })),
      },
    });
  }

  async list(tenantId: string, page = 1, limit = 20, availableOnly = false) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (availableOnly) where.isAvailable = true;

    const [workers, total] = await Promise.all([
      prisma.workerProfile.findMany({
        where,
        include: { user: true },
        skip,
        take: limit,
        orderBy: { reliabilityScore: 'desc' },
      }),
      prisma.workerProfile.count({ where }),
    ]);
    return { workers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateLocation(userId: string, tenantId: string, location: { lat: number; lng: number }) {
    const profile = await prisma.workerProfile.findFirst({
      where: { userId, tenantId },
    });
    if (!profile) throw new NotFoundError('Worker profile');

    return prisma.workerProfile.update({
      where: { id: profile.id },
      data: { currentLocation: JSON.parse(JSON.stringify(location)) },
    });
  }
}

export const workerService = new WorkerService();
