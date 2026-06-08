import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import { smsService } from './sms.service';
import { whatsappService } from './whatsapp.service';
import { emailService } from './email.service';
import { logger } from '@mobiwave/shared';

export class NotificationService {
  async send(data: {
    tenantId: string;
    userId?: string;
    channel: string;
    recipient: string;
    subject?: string;
    body: string;
    template?: string;
    data?: Record<string, unknown>;
  }): Promise<{ notificationLogId: string; status: string; error?: string }> {
    const logId = uuidv4();

    await prisma.notificationLog.create({
      data: {
        id: logId,
        tenantId: data.tenantId,
        userId: data.userId,
        channel: data.channel as any,
        recipient: data.recipient,
        subject: data.subject,
        body: data.body,
        status: 'SENT',
      },
    });

    let result: { success: boolean; error?: string; messageId?: string };

    switch (data.channel) {
      case 'SMS':
        result = await smsService.send(data.recipient, data.body);
        break;
      case 'WHATSAPP':
        if (data.template) {
          result = await whatsappService.sendMessage(data.recipient, data.template, 'en', [data.body]);
        } else {
          result = await whatsappService.sendText(data.recipient, data.body);
        }
        break;
      case 'EMAIL':
        result = await emailService.send({
          to: data.recipient,
          subject: data.subject || 'ServiceOps Notification',
          html: data.body,
        });
        break;
      default:
        result = { success: false, error: `Unsupported channel: ${data.channel}` };
    }

    const status = result.success ? 'SENT' : 'FAILED';
    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        status: status as any,
        externalId: result.messageId,
        error: result.error,
        sentAt: result.success ? new Date() : undefined,
      },
    });

    if (!result.success) {
      logger.error({ logId, channel: data.channel, error: result.error }, 'Notification send failed');
    }

    return { notificationLogId: logId, status, error: result.error };
  }

  async getStatus(logId: string, tenantId: string) {
    const log = await prisma.notificationLog.findFirst({
      where: { id: logId, tenantId },
    });
    if (!log) return null;
    return {
      id: log.id,
      status: log.status,
      channel: log.channel,
      recipient: log.recipient,
      sentAt: log.sentAt,
      deliveredAt: log.deliveredAt,
      error: log.error,
    };
  }

  async listByUser(userId: string, tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where: { userId, tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificationLog.count({ where: { userId, tenantId } }),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const notificationService = new NotificationService();
