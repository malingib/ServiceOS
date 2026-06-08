import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError, logger } from '@mobiwave/shared';

const CHANNEL_HANDLERS: Record<string, (recipient: string, body: string, subject?: string) => Promise<{ success: boolean; messageId?: string; error?: string }>> = {
  SMS: async (recipient, body) => {
    logger.info({ recipient, body }, 'SMS sent (mock)');
    return { success: true, messageId: uuidv4() };
  },
  WHATSAPP: async (recipient, body) => {
    logger.info({ recipient, body }, 'WhatsApp sent (mock)');
    return { success: true, messageId: uuidv4() };
  },
  EMAIL: async (recipient, body, subject) => {
    logger.info({ recipient, subject, body }, 'Email sent (mock)');
    return { success: true, messageId: uuidv4() };
  },
  PUSH: async (recipient, body) => {
    logger.info({ recipient, body }, 'Push sent (mock)');
    return { success: true, messageId: uuidv4() };
  },
};

export class MessagingService {
  async send(data: {
    tenantId: string;
    userId?: string;
    channel: string;
    recipient: string;
    subject?: string;
    body: string;
    templateId?: string;
    data?: Record<string, unknown>;
  }) {
    const logId = uuidv4();

    let resolvedBody = data.body;
    let resolvedSubject = data.subject;

    if (data.templateId) {
      const template = await prisma.notificationTemplate.findFirst({
        where: { id: data.templateId, tenantId: data.tenantId, isActive: true },
      });
      if (!template) throw new NotFoundError('NotificationTemplate', data.templateId);
      resolvedBody = this.renderTemplate(template.body, data.data || {});
      resolvedSubject = template.subject ? this.renderTemplate(template.subject, data.data || {}) : undefined;
    }

    const handler = CHANNEL_HANDLERS[data.channel];
    if (!handler) throw new ValidationError(`Unsupported channel: ${data.channel}`);

    await prisma.notificationLog.create({
      data: {
        id: logId,
        tenantId: data.tenantId,
        userId: data.userId,
        templateId: data.templateId,
        channel: data.channel as any,
        recipient: data.recipient,
        subject: resolvedSubject,
        body: resolvedBody,
        status: 'PENDING',
      },
    });

    const result = await handler(data.recipient, resolvedBody, resolvedSubject);
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

    await prisma.outbox.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        topic: 'notification.sent',
        key: logId,
        payload: {
          notificationLogId: logId,
          channel: data.channel,
          recipient: data.recipient,
          status,
          userId: data.userId,
        } as any,
        headers: { eventType: 'notification.sent' } as any,
        status: 'PENDING',
      },
    });

    return { notificationLogId: logId, status, error: result.error };
  }

  async bulk(tenantId: string, messages: Array<{
    userId?: string;
    channel: string;
    recipient: string;
    subject?: string;
    body: string;
    templateId?: string;
    data?: Record<string, unknown>;
  }>) {
    const results = [];
    for (const msg of messages) {
      try {
        const result = await this.send({ ...msg, tenantId });
        results.push({ ...result, recipient: msg.recipient });
      } catch (error: any) {
        results.push({ recipient: msg.recipient, status: 'FAILED', error: error.message });
      }
    }
    return { total: messages.length, succeeded: results.filter(r => r.status === 'SENT').length, failed: results.filter(r => r.status === 'FAILED').length, results };
  }

  async getStatus(logId: string, tenantId: string) {
    const log = await prisma.notificationLog.findFirst({
      where: { id: logId, tenantId },
    });
    if (!log) throw new NotFoundError('NotificationLog', logId);
    return {
      id: log.id,
      status: log.status,
      channel: log.channel,
      recipient: log.recipient,
      subject: log.subject,
      sentAt: log.sentAt,
      deliveredAt: log.deliveredAt,
      error: log.error,
    };
  }

  async createTemplate(data: {
    tenantId: string;
    name: string;
    channel: string;
    subject?: string;
    body: string;
    variables?: string[];
  }) {
    return prisma.notificationTemplate.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        name: data.name,
        channel: data.channel as any,
        subject: data.subject,
        body: data.body,
        variables: data.variables || [],
        isActive: true,
      },
    });
  }

  async listTemplates(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [templates, total] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificationTemplate.count({ where: { tenantId } }),
    ]);
    return { templates, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateTemplate(id: string, tenantId: string, data: {
    name?: string;
    channel?: string;
    subject?: string;
    body?: string;
    variables?: string[];
    isActive?: boolean;
  }) {
    const existing = await prisma.notificationTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundError('NotificationTemplate', id);
    return prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.channel !== undefined && { channel: data.channel as any }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.variables !== undefined && { variables: data.variables }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  private renderTemplate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
    });
  }
}

export const messagingService = new MessagingService();
