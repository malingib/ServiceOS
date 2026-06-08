import { v4 as uuidv4 } from 'uuid';

export class MpesaError extends Error {
  public readonly code: string;
  public readonly resultCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code = 'MPESA_ERROR', resultCode?: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'MpesaError';
    this.code = code;
    this.resultCode = resultCode;
    this.details = details;
  }
}

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortCode: string;
  environment: 'sandbox' | 'production';
  stkCallbackUrl?: string;
  b2cCallbackUrl?: string;
  b2cQueueTimeoutUrl?: string;
  b2cResultUrl?: string;
  initiatorName?: string;
  securityCredential?: string;
}

export interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc?: string;
  partyA?: string;
  partyB?: string;
  callbackUrl?: string;
  transactionType?: string;
  idempotencyKey?: string;
}

export interface StkPushResponse {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export interface TransactionStatusRequest {
  checkoutRequestId: string;
  merchantRequestId?: string;
}

export interface TransactionStatusResponse {
  responseCode: string;
  responseDescription: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
}

export interface B2CRequest {
  recipientPhone: string;
  amount: number;
  reference: string;
  remarks?: string;
  occasion?: string;
  commandId?: string;
  idempotencyKey?: string;
}

export interface B2CResponse {
  conversationId: string;
  originatorConversationId: string;
  responseCode: string;
  responseDescription: string;
}

export interface MpesaCallback {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  callbackMetadata?: Record<string, unknown>;
  rawBody: Record<string, unknown>;
}

export interface B2CCallback {
  resultCode: number;
  resultDesc: string;
  transactionId: string;
  transactionReceipt: string;
  transactionAmount: number;
  b2cRecipientIsRegistered: string;
  b2cChargesPaidByBeneficiary: number;
  b2cReceiverPartyRegisteredName: string;
  b2cUtilityAccountBalance: number;
  b2cWorkingAccountBalance: string;
  rawBody: Record<string, unknown>;
}

const SANDBOX_HOST = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_HOST = 'https://api.safaricom.co.ke';

function getBaseUrl(env: 'sandbox' | 'production'): string {
  return env === 'sandbox' ? SANDBOX_HOST : PRODUCTION_HOST;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) return '254' + cleaned.slice(1);
  if (cleaned.startsWith('+')) return cleaned.slice(1);
  if (cleaned.startsWith('254')) return cleaned;
  return '254' + cleaned;
}

export class MpesaClient {
  private config: MpesaConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: MpesaConfig) {
    this.config = config;
  }

  private async request(endpoint: string, body: Record<string, unknown>, method = 'POST'): Promise<Record<string, unknown>> {
    const token = await this.getAccessToken();
    const baseUrl = getBaseUrl(this.config.environment);
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new MpesaError(
        `HTTP ${response.status}: ${text}`,
        'MPESA_HTTP_ERROR',
        response.status,
      );
    }

    const data = await response.json() as Record<string, unknown>;
    if (data.ResponseCode && data.ResponseCode !== '0') {
      throw new MpesaError(
        (data.ResponseDescription as string) || 'M-Pesa request failed',
        'MPESA_API_ERROR',
        Number(data.ResponseCode),
        data,
      );
    }

    return data;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const baseUrl = getBaseUrl(this.config.environment);
    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new MpesaError('Failed to obtain M-Pesa OAuth token', 'MPESA_AUTH_ERROR');
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken!;
  }

  async initiateStkPush(request: StkPushRequest): Promise<StkPushResponse> {
    const timestamp = this.generateTimestamp();
    const password = Buffer.from(
      `${this.config.shortCode}${this.config.passkey}${timestamp}`,
    ).toString('base64');

    const body = {
      BusinessShortCode: this.config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: request.transactionType || 'CustomerPayBillOnline',
      Amount: Math.round(request.amount).toString(),
      PartyA: request.partyA || formatPhone(request.phoneNumber),
      PartyB: request.partyB || this.config.shortCode,
      PhoneNumber: formatPhone(request.phoneNumber),
      CallBackURL: request.callbackUrl || this.config.stkCallbackUrl || '',
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc || 'Payment',
    };

    const data = await this.request('/mpesa/stkpush/v1/processrequest', body);

    return {
      merchantRequestId: data.MerchantRequestID as string,
      checkoutRequestId: data.CheckoutRequestID as string,
      responseCode: data.ResponseCode as string,
      responseDescription: data.ResponseDescription as string,
      customerMessage: data.CustomerMessage as string,
    };
  }

  async queryTransaction(request: TransactionStatusRequest): Promise<TransactionStatusResponse> {
    const timestamp = this.generateTimestamp();
    const password = Buffer.from(
      `${this.config.shortCode}${this.config.passkey}${timestamp}`,
    ).toString('base64');

    const body = {
      BusinessShortCode: this.config.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: request.checkoutRequestId,
    };

    const data = await this.request('/mpesa/stkpushquery/v1/query', body);

    return {
      responseCode: data.ResponseCode as string,
      responseDescription: data.ResponseDescription as string,
      merchantRequestId: data.MerchantRequestID as string,
      checkoutRequestId: data.CheckoutRequestID as string,
      resultCode: Number(data.ResultCode),
      resultDesc: data.ResultDesc as string,
    };
  }

  async initiateB2C(request: B2CRequest): Promise<B2CResponse> {
    const body = {
      InitiatorName: this.config.initiatorName || 'testapi',
      SecurityCredential: this.config.securityCredential || '',
      CommandID: request.commandId || 'BusinessPayment',
      Amount: Math.round(request.amount).toString(),
      PartyA: this.config.shortCode,
      PartyB: formatPhone(request.recipientPhone),
      Remarks: request.remarks || request.reference,
      QueueTimeOutURL: this.config.b2cQueueTimeoutUrl || '',
      ResultURL: this.config.b2cResultUrl || '',
      Occasion: request.occasion || '',
    };

    const data = await this.request('/mpesa/b2c/v1/paymentrequest', body);

    return {
      conversationId: data.ConversationID as string,
      originatorConversationId: data.OriginatorConversationID as string,
      responseCode: data.ResponseCode as string,
      responseDescription: data.ResponseDescription as string,
    };
  }

  parseStkCallback(rawBody: Record<string, unknown>): MpesaCallback {
    const body = rawBody.Body as Record<string, unknown> | undefined;
    const stkCallback = body?.stkCallback as Record<string, unknown> | undefined;

    if (!stkCallback) {
      throw new MpesaError('Invalid M-Pesa callback body - missing stkCallback', 'MPESA_CALLBACK_PARSE_ERROR');
    }

    const metadata = stkCallback.CallbackMetadata as Record<string, unknown> | undefined;
    const parsedMetadata: Record<string, unknown> = {};
    if (metadata?.Item && Array.isArray(metadata.Item)) {
      for (const item of metadata.Item) {
        const i = item as { Name: string; Value: unknown };
        parsedMetadata[i.Name] = i.Value;
      }
    }

    return {
      merchantRequestId: stkCallback.MerchantRequestID as string,
      checkoutRequestId: stkCallback.CheckoutRequestID as string,
      resultCode: Number(stkCallback.ResultCode),
      resultDesc: stkCallback.ResultDesc as string,
      callbackMetadata: parsedMetadata,
      rawBody,
    };
  }

  parseB2CCallback(rawBody: Record<string, unknown>): B2CCallback {
    const result = rawBody.Result as Record<string, unknown> | undefined;

    if (!result) {
      throw new MpesaError('Invalid B2C callback body - missing Result', 'MPESA_CALLBACK_PARSE_ERROR');
    }

    return {
      resultCode: Number(result.ResultCode),
      resultDesc: result.ResultDesc as string,
      transactionId: result.TransactionID as string,
      transactionReceipt: result.TransactionReceipt as string,
      transactionAmount: Number(result.TransactionAmount),
      b2cRecipientIsRegistered: result.B2CRecipientIsRegisteredCustomer as string,
      b2cChargesPaidByBeneficiary: Number(result.B2CChargesPaidByBeneficiary),
      b2cReceiverPartyRegisteredName: result.B2CReceiverPartyRegisteredName as string,
      b2cUtilityAccountBalance: Number(result.B2CUtilityAccountBalance),
      b2cWorkingAccountBalance: result.B2CWorkingAccountFunds as string || '',
      rawBody,
    };
  }

  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

export class IdempotencyHelper {
  private store: Map<string, { result: unknown; expiresAt: number }> = new Map();

  constructor(private ttlMs = 86400000) {}

  setKey(key: string, result: unknown): void {
    this.store.set(key, { result, expiresAt: Date.now() + this.ttlMs });
  }

  getResult<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.result as T;
  }

  exists(key: string): boolean {
    return this.getResult(key) !== null;
  }

  generateKey(phoneNumber: string, amount: number, accountRef: string): string {
    return `mpesa:${formatPhone(phoneNumber)}:${amount}:${accountRef}:${uuidv4().slice(0, 8)}`;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
