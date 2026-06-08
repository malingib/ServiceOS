import prisma from '@mobiwave/prisma';
import { logger } from '@mobiwave/shared';
import { publishEvent, disconnectProducer } from './kafka-publisher';

const POLL_INTERVAL_MS = 5000;
const BATCH_SIZE = 50;
const MAX_RETRIES = 5;

let isRunning = false;
let pollTimer: NodeJS.Timeout | null = null;

export async function startOutboxPoller(): Promise<void> {
  if (isRunning) {
    logger.warn('Outbox poller already running');
    return;
  }

  isRunning = true;
  logger.info('Outbox poller started');

  while (isRunning) {
    try {
      await pollOutbox();
    } catch (error) {
      logger.error({ err: error }, 'Outbox poller error');
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

export async function stopOutboxPoller(): Promise<void> {
  isRunning = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  await disconnectProducer();
  logger.info('Outbox poller stopped');
}

async function pollOutbox(): Promise<void> {
  const events = await prisma.outbox.findMany({
    where: {
      status: 'PENDING',
      retryCount: { lt: MAX_RETRIES },
    },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  });

  if (events.length === 0) return;

  logger.info({ count: events.length }, 'Processing outbox events');

  for (const event of events) {
    try {
      const success = await publishEvent({
        topic: event.topic,
        key: event.key || undefined,
        value: event.payload as Record<string, unknown>,
        headers: (event.headers as Record<string, string>) || {},
      });

      if (success) {
        await prisma.outbox.update({
          where: { id: event.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });
      } else {
        await prisma.outbox.update({
          where: { id: event.id },
          data: {
            retryCount: event.retryCount + 1,
            lastError: 'Publish failed',
          },
        });

        if (event.retryCount + 1 >= MAX_RETRIES) {
          await prisma.outbox.update({
            where: { id: event.id },
            data: { status: 'FAILED' },
          });
          logger.error({ eventId: event.id, topic: event.topic }, 'Event moved to DLQ');
        }
      }
    } catch (error) {
      logger.error({ err: error, eventId: event.id }, 'Failed to process outbox event');

      await prisma.outbox.update({
        where: { id: event.id },
        data: {
          retryCount: event.retryCount + 1,
          lastError: (error as Error).message,
          status: event.retryCount + 1 >= MAX_RETRIES ? 'FAILED' : 'PENDING',
        },
      });
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
