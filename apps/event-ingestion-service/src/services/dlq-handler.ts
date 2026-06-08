import prisma from '@mobiwave/prisma';
import { logger } from '@mobiwave/shared';
import { publishEvent } from './kafka-publisher';

const DLQ_CHECK_INTERVAL_MS = 60000;
const MAX_MANUAL_RETRIES = 3;

let isRunning = false;

export async function startDlqHandler(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  logger.info('DLQ handler started');

  while (isRunning) {
    try {
      await processFailedEvents();
    } catch (error) {
      logger.error({ err: error }, 'DLQ handler error');
    }
    await sleep(DLQ_CHECK_INTERVAL_MS);
  }
}

export function stopDlqHandler(): void {
  isRunning = false;
  logger.info('DLQ handler stopped');
}

async function processFailedEvents(): Promise<void> {
  const failedEvents = await prisma.outbox.findMany({
    where: {
      status: 'FAILED',
      retryCount: { gte: 5 },
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  if (failedEvents.length === 0) return;

  logger.info({ count: failedEvents.length }, 'Processing DLQ events');

  for (const event of failedEvents) {
    try {
      const success = await publishEvent({
        topic: event.topic,
        key: event.key || undefined,
        value: event.payload as Record<string, unknown>,
        headers: {
          ...(event.headers as Record<string, string>) || {},
          'x-dlq-retry': 'true',
          'x-original-event-id': event.id,
        },
      });

      if (success) {
        await prisma.outbox.update({
          where: { id: event.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        logger.info({ eventId: event.id }, 'DLQ event successfully re-published');
      }
    } catch (error) {
      logger.error({ err: error, eventId: event.id }, 'DLQ event re-publish failed');
    }
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
