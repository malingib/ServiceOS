import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError, logger } from '@mobiwave/shared';

const PROVIDER_CONFIGS: Record<string, { baseUrl: string; defaultModel: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4' },
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-pro' },
};

interface AiRequestOptions {
  provider?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AiService {
  async chat(data: {
    tenantId: string;
    userId?: string;
    messages: Array<{ role: string; content: string }>;
    options?: AiRequestOptions;
  }) {
    const startTime = Date.now();
    const provider = data.options?.provider || 'openai';
    const model = data.options?.model || PROVIDER_CONFIGS[provider]?.defaultModel || 'gpt-4';
    const maxTokens = data.options?.maxTokens || 500;

    const promptTemplate = await prisma.prompt.findFirst({
      where: { tenantId: data.tenantId, name: 'chat' },
    });

    const response = await this.callAiProvider(provider, model, {
      messages: data.messages,
      maxTokens,
      temperature: data.options?.temperature ?? 0.7,
    });

    const durationMs = Date.now() - startTime;
    await this.logUsage({
      tenantId: data.tenantId,
      userId: data.userId,
      provider,
      model,
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      endpoint: 'chat',
      durationMs,
    });

    return {
      id: uuidv4(),
      model,
      provider,
      choices: response.choices,
      usage: response.usage,
      durationMs,
    };
  }

  async summarize(data: {
    tenantId: string;
    userId?: string;
    text: string;
    options?: AiRequestOptions;
  }) {
    const startTime = Date.now();
    const provider = data.options?.provider || 'openai';
    const model = data.options?.model || PROVIDER_CONFIGS[provider]?.defaultModel || 'gpt-4';

    const messages = [
      { role: 'system', content: 'You are a professional summarizer. Provide a concise summary of the following text.' },
      { role: 'user', content: data.text },
    ];

    const response = await this.callAiProvider(provider, model, {
      messages,
      maxTokens: data.options?.maxTokens || 300,
      temperature: 0.3,
    });

    const durationMs = Date.now() - startTime;
    await this.logUsage({
      tenantId: data.tenantId,
      userId: data.userId,
      provider,
      model,
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      endpoint: 'summarize',
      durationMs,
    });

    return {
      id: uuidv4(),
      model,
      provider,
      summary: response.choices?.[0]?.message?.content || '',
      usage: response.usage,
      durationMs,
    };
  }

  async classify(data: {
    tenantId: string;
    userId?: string;
    text: string;
    categories: string[];
    options?: AiRequestOptions;
  }) {
    const startTime = Date.now();
    const provider = data.options?.provider || 'openai';
    const model = data.options?.model || PROVIDER_CONFIGS[provider]?.defaultModel || 'gpt-4';

    const messages = [
      {
        role: 'system',
        content: `Classify the following text into one of these categories: ${data.categories.join(', ')}. Respond with ONLY the category name.`,
      },
      { role: 'user', content: data.text },
    ];

    const response = await this.callAiProvider(provider, model, {
      messages,
      maxTokens: data.options?.maxTokens || 50,
      temperature: 0.1,
    });

    const durationMs = Date.now() - startTime;
    const label = response.choices?.[0]?.message?.content?.trim() || 'unknown';

    await this.logUsage({
      tenantId: data.tenantId,
      userId: data.userId,
      provider,
      model,
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      endpoint: 'classify',
      durationMs,
    });

    return {
      id: uuidv4(),
      model,
      provider,
      label,
      confidence: 1.0,
      usage: response.usage,
      durationMs,
    };
  }

  async getUsage(tenantId: string, query: {
    userId?: string;
    provider?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (query.userId) where.userId = query.userId;
    if (query.provider) where.provider = query.provider;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [logs, total, totals] = await Promise.all([
      prisma.aiUsage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiUsage.count({ where }),
      prisma.aiUsage.aggregate({
        where,
        _sum: { promptTokens: true, completionTokens: true, totalTokens: true, costUsd: true },
      }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totals: {
        totalTokens: Number(totals._sum.totalTokens || 0),
        promptTokens: Number(totals._sum.promptTokens || 0),
        completionTokens: Number(totals._sum.completionTokens || 0),
        totalCost: Number(totals._sum.costUsd || 0),
      },
    };
  }

  private async callAiProvider(provider: string, model: string, params: {
    messages: Array<{ role: string; content: string }>;
    maxTokens: number;
    temperature: number;
  }): Promise<{ choices: Array<{ message: { content: string } }>; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
    const config = PROVIDER_CONFIGS[provider];
    if (!config) throw new ValidationError(`Unsupported AI provider: ${provider}`);

    const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];

    if (!apiKey) {
      logger.warn({ provider }, `No API key configured for ${provider}, returning mock response`);
      return {
        choices: [{ message: { content: `[Mock ${provider} response for: ${params.messages[params.messages.length - 1]?.content?.slice(0, 50)}...]` } }],
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      };
    }

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: params.messages,
          max_tokens: params.maxTokens,
          temperature: params.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI provider responded with ${response.status}: ${await response.text()}`);
      }

      const json = await response.json();
      return {
        choices: json.choices || [{ message: { content: '' } }],
        usage: json.usage ? {
          promptTokens: json.usage.prompt_tokens || 0,
          completionTokens: json.usage.completion_tokens || 0,
          totalTokens: json.usage.total_tokens || 0,
        } : undefined,
      };
    } catch (error: any) {
      logger.error({ provider, model, error: error.message }, 'AI provider call failed');
      throw error;
    }
  }

  private async logUsage(data: {
    tenantId: string;
    userId?: string;
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    endpoint: string;
    durationMs: number;
  }) {
    const costPerToken: Record<string, number> = {
      'gpt-4': 0.00003,
      'gpt-3.5-turbo': 0.000002,
      'gemini-pro': 0.000001,
    };

    const rate = costPerToken[data.model] || 0.00001;
    const costUsd = data.totalTokens * rate;

    await prisma.aiUsage.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        userId: data.userId,
        provider: data.provider,
        model: data.model,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        costUsd,
        endpoint: data.endpoint,
        durationMs: data.durationMs,
      },
    });

    await prisma.outbox.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        topic: 'ai.usage.logged',
        key: `${data.provider}:${data.model}`,
        payload: { ...data, costUsd } as any,
        headers: { eventType: 'ai.usage.logged' } as any,
        status: 'PENDING',
      },
    });
  }
}

export const aiService = new AiService();
