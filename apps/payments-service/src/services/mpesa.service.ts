import Redis from 'ioredis';
import { MpesaError } from '@mobiwave/shared';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const MPESA_BASE_URL = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/v1/webhooks/mpesa/callback';
const MPESA_B2C_CALLBACK_URL = process.env.MPESA_B2C_CALLBACK_URL || 'https://yourdomain.com/v1/webhooks/mpesa/b2c-callback';
const MPESA_INITIATOR_NAME = process.env.MPESA_INITIATOR_NAME || 'testapi';
const MPESA_SECURITY_CREDENTIAL = process.env.MPESA_SECURITY_CREDENTIAL || '';

const TOKEN_CACHE_KEY = 'mpesa:oauth_token';
const TOKEN_CACHE_TTL = 3500;

interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface TransactionStatusResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

interface B2CResponse {
  OriginatorConversationID: string;
  ConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export class MpesaService {
  private async getAccessToken(): Promise<string> {
    const cached = await redis.get(TOKEN_CACHE_KEY);
    if (cached) return cached;

    const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

    const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new MpesaError(`Failed to get M-Pesa access token: ${response.status}`, undefined, { error });
    }

    const data = await response.json() as { access_token: string; expires_in: string };
    await redis.setex(TOKEN_CACHE_KEY, TOKEN_CACHE_TTL, data.access_token);
    return data.access_token;
  }

  private generatePassword(): string {
    const timestamp = new Date().toISOString().replace(/[-T:Z.]/g, '').substring(0, 14);
    const data = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  private getTimestamp(): string {
    return new Date().toISOString().replace(/[-T:Z.]/g, '').substring(0, 14);
  }

  async initiateStkPush(data: {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
  }): Promise<StkPushResponse> {
    const accessToken = await this.getAccessToken();
    const password = this.generatePassword();
    const timestamp = this.getTimestamp();

    const formattedPhone = data.phoneNumber.replace(/^\+/, '');
    const SafaricomPhone = formattedPhone.startsWith('254') ? formattedPhone : `254${formattedPhone.replace(/^0/, '')}`;

    const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(data.amount),
        PartyA: SafaricomPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: SafaricomPhone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: data.accountReference,
        TransactionDesc: data.transactionDesc,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new MpesaError(`STK Push failed: ${response.status}`, undefined, { error });
    }

    return response.json() as Promise<StkPushResponse>;
  }

  async queryTransactionStatus(checkoutRequestId: string): Promise<TransactionStatusResponse> {
    const accessToken = await this.getAccessToken();
    const password = this.generatePassword();
    const timestamp = this.getTimestamp();

    const response = await fetch(`${MPESA_BASE_URL}/mpesa/transactionstatus/v1/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
        OriginatorConversationID: `serviceops-${checkoutRequestId}`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new MpesaError(`Transaction query failed: ${response.status}`, undefined, { error });
    }

    return response.json() as Promise<TransactionStatusResponse>;
  }

  async initiateB2C(data: {
    destinationPhone: string;
    amount: number;
    occasion?: string;
    remarks?: string;
  }): Promise<B2CResponse> {
    const accessToken = await this.getAccessToken();

    const formattedPhone = data.destinationPhone.replace(/^\+/, '');
    const SafaricomPhone = formattedPhone.startsWith('254') ? formattedPhone : `254${formattedPhone.replace(/^0/, '')}`;

    const response = await fetch(`${MPESA_BASE_URL}/mpesa/b2c/v1/paymentrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        InitiatorName: MPESA_INITIATOR_NAME,
        SecurityCredential: MPESA_SECURITY_CREDENTIAL,
        CommandID: 'BusinessPayment',
        Amount: Math.round(data.amount),
        PartyA: MPESA_SHORTCODE,
        PartyB: SafaricomPhone,
        Remarks: data.remarks || 'ServiceOps Payment',
        QueueTimeOutURL: MPESA_B2C_CALLBACK_URL,
        ResultURL: MPESA_B2C_CALLBACK_URL,
        Occasion: data.occasion || 'Service Payment',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new MpesaError(`B2C payment failed: ${response.status}`, undefined, { error });
    }

    return response.json() as Promise<B2CResponse>;
  }

  parseCallbackMetadata(items: Array<{ Name: string; Value: unknown }>): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};
    for (const item of items) {
      metadata[item.Name] = item.Value;
    }
    return metadata;
  }
}

export const mpesaService = new MpesaService();
