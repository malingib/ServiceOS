import { ExternalServiceError } from '@mobiwave/shared';

const AT_API_URL = process.env.AT_API_URL || 'https://api.africastalking.com/version1';
const AT_API_KEY = process.env.AT_API_KEY || '';
const AT_USERNAME = process.env.AT_USERNAME || 'sandbox';
const AT_SENDER_ID = process.env.AT_SENDER_ID || '';

export class SmsService {
  async send(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${AT_API_URL}/messaging`, {
        method: 'POST',
        headers: {
          apiKey: AT_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          username: AT_USERNAME,
          to: phone,
          message,
          from: AT_SENDER_ID,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `AT API error: ${response.status} - ${errorText}` };
      }

      const data = await response.json() as { SMSMessageData?: { Recipients?: Array<{ messageId: string }> } };
      const messageId = data.SMSMessageData?.Recipients?.[0]?.messageId;
      return { success: true, messageId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async sendBulk(phones: string[], message: string): Promise<{ success: boolean; results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> }> {
    const results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];

    for (const phone of phones) {
      const result = await this.send(phone, message);
      results.push({ phone, ...result });
    }

    return {
      success: results.every((r) => r.success),
      results,
    };
  }
}

export const smsService = new SmsService();
