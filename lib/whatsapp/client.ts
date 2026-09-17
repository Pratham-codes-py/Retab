/**
 * Retab — Meta WhatsApp Cloud API wrapper
 *
 * Wraps the Meta Graph API v19.0 Messages endpoint.
 * All functions run server-side only (used in app/api/whatsapp/send/route.ts).
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 */

const GRAPH_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'url' | 'quick_reply';
  index?: number;
  parameters: TemplateParameter[];
}

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
}

export interface SendTemplateOptions {
  /** E.164 phone number of the recipient, e.g. "+919876543210" */
  to: string;
  /** WhatsApp template name as registered in Meta Business Manager */
  templateName: string;
  /** BCP 47 language code, e.g. "en_US" or "en" */
  languageCode?: string;
  /** Template component parameter overrides */
  components?: TemplateComponent[];
}

export interface WhatsAppMessageResponse {
  messaging_product: 'whatsapp';
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

/**
 * Sends a WhatsApp template message via the Meta Cloud API.
 *
 * @throws Error if the API returns a non-2xx status
 */
export async function sendTemplateMessage(
  options: SendTemplateOptions
): Promise<WhatsAppMessageResponse> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      'Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN environment variables.'
    );
  }

  const body = {
    messaging_product: 'whatsapp',
    to: options.to,
    type: 'template',
    template: {
      name: options.templateName,
      language: { code: options.languageCode ?? 'en' },
      ...(options.components ? { components: options.components } : {}),
    },
  };

  const response = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `WhatsApp API error ${response.status}: ${errorText}`
    );
  }

  return response.json() as Promise<WhatsAppMessageResponse>;
}

// ---------------------------------------------------------------------------
// Convenience: bill + review-request template
// ---------------------------------------------------------------------------

/**
 * Sends the combined "bill and review request" template to a customer.
 *
 * @param to              - Customer phone in E.164 format
 * @param billTotal       - Formatted bill total string, e.g. "₹245.00"
 * @param cafeName        - Cafe name shown in the template
 * @param googleReviewUrl - Deep link to the Google review form
 */
export async function sendBillAndReviewTemplate(
  to: string,
  billTotal: string,
  cafeName: string,
  googleReviewUrl: string
): Promise<WhatsAppMessageResponse> {
  return sendTemplateMessage({
    to,
    templateName: 'retab_bill_review', // register this template in Meta Business Manager
    languageCode: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: cafeName },
          { type: 'text', text: billTotal },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: googleReviewUrl }],
      },
    ],
  });
}
