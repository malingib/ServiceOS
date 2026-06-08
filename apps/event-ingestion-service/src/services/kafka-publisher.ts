import { Kafka, Producer, ProducerRecord, Message } from 'kafkajs';
import { logger } from '@mobiwave/shared';

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'event-ingestion-service';
const KAFKA_USERNAME = process.env.KAFKA_USERNAME;
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD;

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
  ssl: process.env.KAFKA_SSL === 'true',
  sasl:
    KAFKA_USERNAME && KAFKA_PASSWORD
      ? {
          mechanism: 'plain' as const,
          username: KAFKA_USERNAME,
          password: KAFKA_PASSWORD,
        }
      : undefined,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
  },
});

let producer: Producer | null = null;

async function getProducer(): Promise<Producer> {
  if (producer) return producer;

  producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  });

  await producer.connect();
  logger.info('Kafka producer connected');
  return producer;
}

export interface KafkaEvent {
  topic: string;
  key?: string;
  value: Record<string, unknown>;
  headers?: Record<string, string>;
}

export async function publishEvent(event: KafkaEvent): Promise<boolean> {
  try {
    const p = await getProducer();
    const message: Message = {
      key: event.key || undefined,
      value: JSON.stringify(event.value),
      headers: {
        'content-type': 'application/json',
        'event-type': (event.value.type as string) || 'unknown',
        'event-source': (event.value.source as string) || 'unknown',
        ...event.headers,
      },
    };

    await p.send({
      topic: event.topic,
      messages: [message],
    });

    logger.debug({ topic: event.topic, key: event.key }, 'Event published');
    return true;
  } catch (error) {
    logger.error({ err: error, topic: event.topic, key: event.key }, 'Failed to publish event');
    return false;
  }
}

export async function publishBatch(events: KafkaEvent[]): Promise<{ published: number; failed: number }> {
  let published = 0;
  let failed = 0;

  try {
    const p = await getProducer();
    const messagesByTopic = new Map<string, Message[]>();

    for (const event of events) {
      if (!messagesByTopic.has(event.topic)) {
        messagesByTopic.set(event.topic, []);
      }
      messagesByTopic.get(event.topic)!.push({
        key: event.key || undefined,
        value: JSON.stringify(event.value),
        headers: {
          'content-type': 'application/json',
          'event-type': (event.value.type as string) || 'unknown',
          'event-source': (event.value.source as string) || 'unknown',
          ...event.headers,
        },
      });
    }

    const records: ProducerRecord[] = [];
    for (const [topic, messages] of messagesByTopic) {
      records.push({ topic, messages });
    }

    await p.sendBatch({ topicMessages: records });
    published = events.length;
  } catch (error) {
    logger.error({ err: error }, 'Failed to publish batch');
    failed = events.length;
  }

  return { published, failed };
}

export async function disconnectProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
    logger.info('Kafka producer disconnected');
  }
}
