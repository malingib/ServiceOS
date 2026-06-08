import { ExternalServiceError } from '@mobiwave/shared';

const NOVU_API_URL = process.env.NOVU_API_URL || 'https://api.novu.co';
const NOVU_API_KEY = process.env.NOVU_API_KEY || '';

export class EmailService {
  async send(data: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${NOVU_API_URL}/v1/emails/send`, {
        method: 'POST',
        headers: {
          Authorization: `ApiKey ${NOVU_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.to,
          subject: data.subject,
          html: data.html,
          from: data.from || 'noreply@serviceops.co.ke',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        return { success: false, error: errorData.message || `Novu API error: ${response.status}` };
      }

      const result = await response.json() as { data?: { messageId: string } };
      return { success: true, messageId: result.data?.messageId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const emailService = new EmailService();
