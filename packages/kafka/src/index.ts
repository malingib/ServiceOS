import { Kafka, Producer, Consumer, ConsumerConfig, EachMessagePayload, Partitioners, logLevel } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

export type TopicDefinition = {
  topic: string;
  numPartitions: number;
  replicationFactor: number;
  config?: Record<string, string>;
};

export type OutboxRow = {
  id: string;
  tenantId: string;
  topic: string;
  key?: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
};

export type DQLMessage = {
  originalTopic: string;
  originalKey?: string;
  payload: Record<string, unknown>;
  error: string;
  failedAt: string;
  retryCount: number;
};

let kafkaInstance: Kafka | null = null;

function getBrokers(): string[] {
  const brokers = process.env.KAFKA_BROKERS || 'localhost:9092';
  return brokers.split(',').map((b) => b.trim());
}

function getClientId(): string {
  return process.env.KAFKA_CLIENT_ID || 'mobiwave-core';
}

export function getKafka(): Kafka {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: getClientId(),
      brokers: getBrokers(),
      logLevel: process.env.LOG_LEVEL === 'debug' ? logLevel.DEBUG : logLevel.INFO,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }
  return kafkaInstance;
}

let producerInstance: Producer | null = null;

export async function getProducer(): Promise<Producer> {
  if (!producerInstance) {
    producerInstance = getKafka().producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: false,
      transactionTimeout: 30000,
    });
    await producerInstance.connect();
  }
  return producerInstance;
}

export async function disconnectProducer(): Promise<void> {
  if (producerInstance) {
    await producerInstance.disconnect();
    producerInstance = null;
  }
}

export async function publish(topic: string, payload: Record<string, unknown>, key?: string): Promise<void> {
  const producer = await getProducer();
  await producer.send({
    topic,
    messages: [
      {
        key: key || uuidv4(),
        value: JSON.stringify(payload),
        headers: {
          'content-type': 'application/json',
          'id': uuidv4(),
          'time': new Date().toISOString(),
        },
      },
    ],
  });
}

export async function publishBatch(
  messages: Array<{ topic: string; payload: Record<string, unknown>; key?: string }>,
): Promise<void> {
  const producer = await getProducer();
  const ops = messages.map((m) => ({
    topic: m.topic,
    messages: [
      {
        key: m.key || uuidv4(),
        value: JSON.stringify(m.payload),
        headers: {
          'content-type': 'application/json',
          'id': uuidv4(),
          'time': new Date().toISOString(),
        },
      },
    ],
  }));
  await producer.sendBatch({ topicMessages: ops });
}

export class ConsumerGroup {
  private consumer: Consumer;
  private handlers: Map<string, (payload: EachMessagePayload) => Promise<void>> = new Map();
  private running = false;

  constructor(groupId: string, config?: Partial<ConsumerConfig>) {
    this.consumer = getKafka().consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      rebalanceTimeout: 60000,
      ...config,
    });
  }

  subscribe(topics: string | string[], fromBeginning = false): void {
    const topicList = Array.isArray(topics) ? topics : [topics];
    topicList.forEach((t) => {
      this.consumer.subscribe({ topic: t, fromBeginning });
    });
  }

  on(topic: string, handler: (payload: EachMessagePayload) => Promise<void>): void {
    this.handlers.set(topic, handler);
  }

  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;

    await this.consumer.run({
      eachMessage: async (payload) => {
        const handler = this.handlers.get(payload.topic);
        if (handler) {
          try {
            await handler(payload);
          } catch (err) {
            console.error(`[ConsumerGroup] Error processing message from ${payload.topic}:`, err);
            throw err;
          }
        }
      },
    });
  }

  async disconnect(): Promise<void> {
    this.running = false;
    await this.consumer.disconnect();
  }

  async pause(topics: string[]): Promise<void> {
    this.consumer.pause(topics.map((t) => ({ topic: t })));
  }

  async resume(topics: string[]): Promise<void> {
    this.consumer.resume(topics.map((t) => ({ topic: t })));
  }
}

export class TopicRegistry {
  private topics: Map<string, TopicDefinition> = new Map();

  register(def: TopicDefinition): void {
    this.topics.set(def.topic, def);
  }

  get(topic: string): TopicDefinition | undefined {
    return this.topics.get(topic);
  }

  getAll(): TopicDefinition[] {
    return Array.from(this.topics.values());
  }
}

export const defaultTopics: TopicDefinition[] = [
  { topic: 'events.bookings', numPartitions: 3, replicationFactor: 1 },
  { topic: 'events.payments', numPartitions: 3, replicationFactor: 1 },
  { topic: 'events.dispatch', numPartitions: 3, replicationFactor: 1 },
  { topic: 'events.identity', numPartitions: 3, replicationFactor: 1 },
  { topic: 'events.messaging', numPartitions: 2, replicationFactor: 1 },
  { topic: 'events.rewards', numPartitions: 2, replicationFactor: 1 },
  { topic: 'events.ai', numPartitions: 2, replicationFactor: 1 },
  { topic: 'dlq.events', numPartitions: 1, replicationFactor: 1 },
];

export function createDefaultTopicRegistry(): TopicRegistry {
  const registry = new TopicRegistry();
  defaultTopics.forEach((t) => registry.register(t));
  return registry;
}

export class OutboxPublisher {
  private pollIntervalMs: number;

  constructor(pollIntervalMs = 5000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  async pollAndPublish(pollFn: (limit: number) => Promise<OutboxRow[]>, markSentFn: (id: string) => Promise<void>): Promise<number> {
    const rows = await pollFn(100);
    if (rows.length === 0) return 0;

    const producer = await getProducer();
    const batches = rows.map((row) => ({
      topic: row.topic,
      messages: [
        {
          key: row.key || row.id,
          value: JSON.stringify(row.payload),
          headers: {
            'content-type': 'application/json',
            'id': row.id,
            'tenant-id': row.tenantId,
            'time': new Date().toISOString(),
            ...(row.headers || {}),
          },
        },
      ],
    }));

    await producer.sendBatch({ topicMessages: batches });
    await Promise.all(rows.map((r) => markSentFn(r.id)));
    return rows.length;
  }

  start(
    pollFn: (limit: number) => Promise<OutboxRow[]>,
    markSentFn: (id: string) => Promise<void>,
    onError?: (err: Error) => void,
  ): ReturnType<typeof setInterval> {
    return setInterval(async () => {
      try {
        await this.pollAndPublish(pollFn, markSentFn);
      } catch (err) {
        if (onError) onError(err as Error);
        else console.error('[OutboxPublisher] Error:', err);
      }
    }, this.pollIntervalMs);
  }
}

export class DQLHandler {
  private consumer: ConsumerGroup;
  private dlqTopic: string;

  constructor(groupId = 'dlq-consumer', dlqTopic = 'dlq.events') {
    this.consumer = new ConsumerGroup(groupId);
    this.dlqTopic = dlqTopic;
    this.consumer.subscribe(dlqTopic);
  }

  async publishToDLQ(originalTopic: string, payload: Record<string, unknown>, error: string, retryCount: number): Promise<void> {
    const dlqMessage: DQLMessage = {
      originalTopic,
      originalKey: uuidv4(),
      payload,
      error,
      failedAt: new Date().toISOString(),
      retryCount,
    };
    await publish(this.dlqTopic, dlqMessage as unknown as Record<string, unknown>, dlqMessage.originalKey);
    console.warn(`[DLQ] Message from ${originalTopic} routed to DLQ (retry #${retryCount})`);
  }

  onMessage(handler: (message: DQLMessage) => Promise<void>): void {
    this.consumer.on(this.dlqTopic, async (payload) => {
      if (!payload.message.value) return;
      const parsed: DQLMessage = JSON.parse(payload.message.value.toString());
      await handler(parsed);
    });
  }

  async start(): Promise<void> {
    await this.consumer.run();
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}
