const WABA_API_URL = process.env.WABA_API_URL || 'https://graph.facebook.com/v17.0';
const WABA_PHONE_NUMBER_ID = process.env.WABA_PHONE_NUMBER_ID || '';
const WABA_ACCESS_TOKEN = process.env.WABA_ACCESS_TOKEN || '';

export class WhatsAppService {
  async sendMessage(
    phone: string,
    templateName: string,
    languageCode: string,
    variables?: string[],
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const templateParams = variables?.map((v) => ({ type: 'text', text: v }));

      const response = await fetch(`${WABA_API_URL}/${WABA_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WABA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace(/^\+/, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components: templateParams
              ? [{ type: 'body', parameters: templateParams }]
              : undefined,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: { message: string } };
        return { success: false, error: errorData.error?.message || `WABA API error: ${response.status}` };
      }

      const data = await response.json() as { messages?: Array<{ id: string }> };
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async sendText(phone: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${WABA_API_URL}/${WABA_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WABA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace(/^\+/, ''),
          type: 'text',
          text: { body: text },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: { message: string } };
        return { success: false, error: errorData.error?.message || `WABA API error: ${response.status}` };
      }

      const data = await response.json() as { messages?: Array<{ id: string }> };
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const whatsappService = new WhatsAppService();
