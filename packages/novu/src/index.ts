export class NovuError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(message: string, code = 'NOVU_ERROR', statusCode?: number) {
    super(message);
    this.name = 'NovuError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface NovuConfig {
  apiKey: string;
  apiUrl?: string;
}

export interface TriggerNotificationRequest {
  workflowId: string;
  to: string;
  payload: Record<string, unknown>;
  overrides?: Record<string, unknown>;
  transactionId?: string;
}

export interface TriggerNotificationResponse {
  acknowledged: boolean;
  status: string;
  transactionId: string;
}

export interface SubscriberData {
  subscriberId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  locale?: string;
  data?: Record<string, unknown>;
}

export interface TemplateData {
  name: string;
  description?: string;
  tags?: string[];
  critical?: boolean;
  data?: Record<string, unknown>;
}

export interface EventTrackingRequest {
  name: string;
  to: string;
  payload: Record<string, unknown>;
  transactionId?: string;
}

function getBaseUrl(apiUrl?: string): string {
  return apiUrl || process.env.NOVU_API_URL || 'https://api.novu.co';
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `ApiKey ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export class NovuClient {
  private config: NovuConfig;

  constructor(config: NovuConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return getBaseUrl(this.config.apiUrl);
  }

  private get headers(): Record<string, string> {
    return buildHeaders(this.config.apiKey);
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>, method = 'POST'): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new NovuError(
        `HTTP ${response.status}: ${text}`,
        'NOVU_HTTP_ERROR',
        response.status,
      );
    }

    return response.json() as Promise<T>;
  }

  private async getRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new NovuError(
        `HTTP ${response.status}: ${text}`,
        'NOVU_HTTP_ERROR',
        response.status,
      );
    }

    return response.json() as Promise<T>;
  }

  async triggerNotification(request: TriggerNotificationRequest): Promise<TriggerNotificationResponse> {
    interface NovuTriggerResponse {
      acknowledged: boolean;
      status?: string;
      transactionId?: string;
    }

    const data = await this.request<NovuTriggerResponse>('/v1/events/trigger', {
      name: request.workflowId,
      to: { subscriberId: request.to },
      payload: request.payload,
      overrides: request.overrides,
      transactionId: request.transactionId,
    });

    return {
      acknowledged: data.acknowledged,
      status: data.status || 'unknown',
      transactionId: data.transactionId || '',
    };
  }

  async triggerBulk(triggers: TriggerNotificationRequest[]): Promise<void> {
    await this.request('/v1/events/trigger/bulk', {
      events: triggers.map((t) => ({
        name: t.workflowId,
        to: { subscriberId: t.to },
        payload: t.payload,
        overrides: t.overrides,
        transactionId: t.transactionId,
      })),
    });
  }

  async getTemplate(templateId: string): Promise<TemplateData> {
    interface NovuTemplateResponse {
      data?: TemplateData;
    }
    const result = await this.getRequest<NovuTemplateResponse>(`/v1/workflow-templates/${templateId}`);
    return result.data || {} as TemplateData;
  }

  async listTemplates(page = 0, limit = 10): Promise<{ templates: TemplateData[]; total: number; page: number; pageSize: number }> {
    interface NovuListResponse {
      data?: { results: TemplateData[]; totalCount: number };
    }
    const result = await this.getRequest<NovuListResponse>(`/v1/templates?page=${page}&limit=${limit}`);
    const data = result.data;

    return {
      templates: data?.results || [],
      total: data?.totalCount || 0,
      page,
      pageSize: limit,
    };
  }

  async createTemplate(template: TemplateData): Promise<TemplateData> {
    interface NovuCreateResponse {
      data?: TemplateData;
    }
    const result = await this.request<NovuCreateResponse>('/v1/templates', template as unknown as Record<string, unknown>);
    return result.data || template;
  }

  async updateTemplate(templateId: string, template: Partial<TemplateData>): Promise<TemplateData> {
    interface NovuUpdateResponse {
      data?: TemplateData;
    }
    const result = await this.request<NovuUpdateResponse>(`/v1/templates/${templateId}`, template as unknown as Record<string, unknown>, 'PUT');
    return result.data || {} as TemplateData;
  }

  async createSubscriber(subscriber: SubscriberData): Promise<SubscriberData> {
    interface NovuSubscriberResponse {
      data?: SubscriberData;
    }
    const result = await this.request<NovuSubscriberResponse>('/v1/subscribers', subscriber as unknown as Record<string, unknown>);
    return result.data || subscriber;
  }

  async getSubscriber(subscriberId: string): Promise<SubscriberData | null> {
    interface NovuSubscriberResponse {
      data?: SubscriberData;
    }
    try {
      const result = await this.getRequest<NovuSubscriberResponse>(`/v1/subscribers/${subscriberId}`);
      return result.data || null;
    } catch {
      return null;
    }
  }

  async updateSubscriber(subscriberId: string, updates: Partial<SubscriberData>): Promise<SubscriberData> {
    interface NovuUpdateResponse {
      data?: SubscriberData;
    }
    const result = await this.request<NovuUpdateResponse>(
      `/v1/subscribers/${subscriberId}`,
      updates as unknown as Record<string, unknown>,
      'PUT',
    );
    return result.data || {} as SubscriberData;
  }

  async deleteSubscriber(subscriberId: string): Promise<void> {
    const url = `${this.baseUrl}/v1/subscribers/${subscriberId}`;
    const response = await fetch(url, { method: 'DELETE', headers: this.headers });
    if (!response.ok) {
      throw new NovuError(`Failed to delete subscriber: ${response.statusText}`, 'NOVU_DELETE_ERROR');
    }
  }

  async trackEvent(request: EventTrackingRequest): Promise<void> {
    await this.request('/v1/events/trigger', {
      name: request.name,
      to: { subscriberId: request.to },
      payload: request.payload,
      transactionId: request.transactionId,
    });
  }
}
