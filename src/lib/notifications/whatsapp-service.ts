/**
 * WhatsApp Notification Service
 *
 * Supports two modes:
 * 1. WhatsApp Business API (official) — requires WHATSAPP_TOKEN env var
 * 2. Direct wa.me links — fallback for owner-side notifications
 *
 * For production: configure WHATSAPP_API_URL, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';

interface WhatsAppMessage {
  to: string;          // Phone number with country code (e.g., +521234567890)
  template?: string;   // Template name (for Business API)
  text?: string;       // Freeform text (for testing)
  params?: string[];   // Template parameters
}

/**
 * Send a WhatsApp message via Business API
 */
export async function sendWhatsAppMessage(msg: WhatsAppMessage): Promise<boolean> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log('[WHATSAPP] Not configured. Message would be sent to:', msg.to);
    console.log('[WHATSAPP] Text:', msg.text);
    return false;
  }

  try {
    const payload = msg.template
      ? {
          messaging_product: 'whatsapp',
          to: msg.to.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: msg.template,
            language: { code: 'es' },
            components: msg.params?.length
              ? [{
                  type: 'body',
                  parameters: msg.params.map(p => ({ type: 'text', text: p })),
                }]
              : [],
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: msg.to.replace(/\D/g, ''),
          type: 'text',
          text: { body: msg.text ?? '' },
        };

    const res = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('[WHATSAPP] API error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[WHATSAPP] Send error:', err);
    return false;
  }
}

/**
 * Generate a wa.me URL for direct WhatsApp link (fallback)
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// ---- Notification Templates ----

export async function notifyOwnerNewOrder(ownerPhone: string, orderNumber: string, total: string, restaurantName: string) {
  return sendWhatsAppMessage({
    to: ownerPhone,
    text: `🔔 *Nueva orden en ${restaurantName}*\n\nOrden: *${orderNumber}*\nTotal: *${total}*\n\nRevisa tu panel: menius.app/app/orders`,
  });
}

export async function notifyCustomerOrderReady(customerPhone: string, orderNumber: string, restaurantName: string) {
  return sendWhatsAppMessage({
    to: customerPhone,
    text: `✅ *¡Tu pedido está listo!*\n\n${restaurantName}\nOrden: *${orderNumber}*\n\n¡Pasa a recogerlo! 🎉`,
  });
}

export async function notifyCustomerOrderConfirmed(customerPhone: string, orderNumber: string, restaurantName: string) {
  return sendWhatsAppMessage({
    to: customerPhone,
    text: `👨‍🍳 *Tu pedido fue confirmado*\n\n${restaurantName}\nOrden: *${orderNumber}*\n\nEstamos preparando tu orden. Te avisaremos cuando esté lista.`,
  });
}

export async function notifyCustomerDeliveryOnWay(customerPhone: string, orderNumber: string, restaurantName: string) {
  return sendWhatsAppMessage({
    to: customerPhone,
    text: `🛵 *Tu pedido va en camino*\n\n${restaurantName}\nOrden: *${orderNumber}*\n\n¡Pronto estará contigo!`,
  });
}
