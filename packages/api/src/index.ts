import ky, { KyInstance, Options, HTTPError } from 'ky';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode: number, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

let authToken: string | null = null;
let refreshTokenFn: (() => Promise<string>) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setRefreshTokenHandler(fn: () => Promise<string>): void {
  refreshTokenFn = fn;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '/api/v1';
}

async function handleError(error: HTTPError): Promise<never> {
  try {
    const body = await error.response.json<ApiResponse>();
    const apiError = body.error || { code: 'UNKNOWN', message: error.message };
    throw new ApiError(
      apiError.message,
      error.response.status,
      apiError.code,
      apiError.details,
    );
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(error.message, error.response.status, 'HTTP_ERROR');
  }
}

export function createApiClient(baseUrl?: string): KyInstance {
  const prefixUrl = baseUrl || getBaseUrl();

  const instance = ky.create({
    prefixUrl,
    timeout: 30000,
    retry: {
      limit: 2,
      methods: ['get', 'put', 'patch', 'delete'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
      backoffLimit: 1000,
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    hooks: {
      beforeRequest: [
        (request) => {
          if (authToken) {
            request.headers.set('Authorization', `Bearer ${authToken}`);
          }
          const correlationId = crypto.randomUUID();
          request.headers.set('x-correlation-id', correlationId);
          request.headers.set('x-request-id', correlationId);
        },
      ],
      afterResponse: [
        async (_request, _options, response) => {
          if (response.status === 401 && refreshTokenFn) {
            try {
              const newToken = await refreshTokenFn();
              setAuthToken(newToken);
            } catch {
              throw new ApiError('Session expired', 401, 'AUTH_EXPIRED');
            }
          }
        },
      ],
    },
  });

  return instance;
}

function getClient(): KyInstance {
  const clientKey = '__api_client__';
  const global = globalThis as Record<string, KyInstance | undefined>;
  if (!global[clientKey]) {
    global[clientKey] = createApiClient();
  }
  return global[clientKey]!;
}

export async function get<T>(path: string, options?: Options): Promise<ApiResponse<T>> {
  try {
    const client = getClient();
    const response = await client.get(path, options);
    const body = await response.json<ApiResponse<T>>();
    return body;
  } catch (error) {
    if (error instanceof HTTPError) return handleError(error);
    throw error;
  }
}

export async function post<T>(path: string, body?: unknown, options?: Options): Promise<ApiResponse<T>> {
  try {
    const client = getClient();
    const response = await client.post(path, { json: body, ...options });
    return await response.json<ApiResponse<T>>();
  } catch (error) {
    if (error instanceof HTTPError) return handleError(error);
    throw error;
  }
}

export async function put<T>(path: string, body?: unknown, options?: Options): Promise<ApiResponse<T>> {
  try {
    const client = getClient();
    const response = await client.put(path, { json: body, ...options });
    return await response.json<ApiResponse<T>>();
  } catch (error) {
    if (error instanceof HTTPError) return handleError(error);
    throw error;
  }
}

export async function del<T>(path: string, options?: Options): Promise<ApiResponse<T>> {
  try {
    const client = getClient();
    const response = await client.delete(path, options);
    return await response.json<ApiResponse<T>>();
  } catch (error) {
    if (error instanceof HTTPError) return handleError(error);
    throw error;
  }
}

export async function patch<T>(path: string, body?: unknown, options?: Options): Promise<ApiResponse<T>> {
  try {
    const client = getClient();
    const response = await client.patch(path, { json: body, ...options });
    return await response.json<ApiResponse<T>>();
  } catch (error) {
    if (error instanceof HTTPError) return handleError(error);
    throw error;
  }
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private handlers: Map<string, (data: unknown) => void> = new Map();
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;

  constructor(path: string, baseUrl?: string) {
    this.url = `${baseUrl || getBaseUrl()}${path}`;
  }

  connect(): void {
    const urlWithToken = authToken ? `${this.url}?token=${authToken}` : this.url;
    this.eventSource = new EventSource(urlWithToken);

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), delay);
      }
    };

    for (const [event, handler] of this.handlers) {
      this.eventSource.addEventListener(event, (e) => {
        try {
          const data = JSON.parse(e.data);
          handler(data);
        } catch {
          handler(e.data);
        }
      });
    }
  }

  on(event: string, handler: (data: unknown) => void): void {
    this.handlers.set(event, handler);
    if (this.eventSource) {
      this.eventSource.addEventListener(event, (e) => {
        try {
          const data = JSON.parse(e.data);
          handler(data);
        } catch {
          handler(e.data);
        }
      });
    }
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }
}

export async function uploadFile(
  file: File | Blob,
  presignedUrl: string,
  onProgress?: (percent: number) => void,
): Promise<Response> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Upload failed with status ${response.status}`,
      response.status,
      'UPLOAD_FAILED',
    );
  }

  return response;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  downloadUrl: string;
  fileKey: string;
  expiresAt: string;
}

export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string,
  category?: string,
): Promise<PresignedUrlResponse> {
  const response = await post<PresignedUrlResponse>('/documents/upload-url', {
    fileName,
    mimeType,
    category: category || 'OTHER',
  });
  if (!response.data) throw new ApiError('Failed to get upload URL', 500, 'UPLOAD_URL_FAILED');
  return response.data;
}

export async function uploadWithPresignedUrl(
  file: File | Blob,
  fileName: string,
  mimeType: string,
  category?: string,
): Promise<string> {
  const { uploadUrl, downloadUrl } = await getPresignedUploadUrl(fileName, mimeType, category);
  await uploadFile(file, uploadUrl);
  return downloadUrl;
}
