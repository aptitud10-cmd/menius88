/**
 * Email Notification Service
 *
 * This service provides a structured interface for sending transactional emails.
 * Currently uses console.log as a placeholder — replace with actual provider
 * (Resend, SendGrid, AWS SES) when ready.
 *
 * Usage:
 *   import { sendOrderConfirmation } from '@/lib/notifications/email-service';
 *   await sendOrderConfirmation({ to: 'customer@email.com', orderNumber: 'ORD-001', ... });
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

// Replace this with actual email provider (Resend, SendGrid, etc.)
async function sendEmail(payload: EmailPayload): Promise<boolean> {
  console.log(`[EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
  // TODO: Implement actual email sending
  // Example with Resend:
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ from: 'noreply@menius.app', ...payload });
  return true;
}

// ---- Order Notifications ----

export async function sendOrderConfirmation(data: {
  to: string;
  customerName: string;
  orderNumber: string;
  restaurantName: string;
  total: number;
  trackingUrl: string;
}) {
  return sendEmail({
    to: data.to,
    subject: `Pedido ${data.orderNumber} confirmado — ${data.restaurantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <h2 style="color:#1a1a1a">¡Pedido confirmado!</h2>
        <p>Hola ${data.customerName},</p>
        <p>Tu pedido <strong>${data.orderNumber}</strong> en <strong>${data.restaurantName}</strong> ha sido confirmado.</p>
        <p style="font-size:24px;font-weight:bold;color:#1a1a1a">Total: $${data.total.toFixed(2)}</p>
        <a href="${data.trackingUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:12px;font-weight:600;margin-top:10px">
          Seguir mi pedido
        </a>
        <p style="color:#999;font-size:12px;margin-top:20px">MENIUS — Menús digitales premium</p>
      </div>
    `,
  });
}

export async function sendOrderReady(data: {
  to: string;
  customerName: string;
  orderNumber: string;
  restaurantName: string;
}) {
  return sendEmail({
    to: data.to,
    subject: `¡Tu pedido ${data.orderNumber} está listo! — ${data.restaurantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <h2 style="color:#1a1a1a">¡Tu pedido está listo!</h2>
        <p>Hola ${data.customerName},</p>
        <p>Tu pedido <strong>${data.orderNumber}</strong> en <strong>${data.restaurantName}</strong> está listo para recoger.</p>
        <p style="color:#999;font-size:12px;margin-top:20px">MENIUS — Menús digitales premium</p>
      </div>
    `,
  });
}

export async function sendOrderStatusUpdate(data: {
  to: string;
  customerName: string;
  orderNumber: string;
  restaurantName: string;
  status: string;
  statusLabel: string;
}) {
  return sendEmail({
    to: data.to,
    subject: `Pedido ${data.orderNumber}: ${data.statusLabel} — ${data.restaurantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <h2 style="color:#1a1a1a">Actualización de pedido</h2>
        <p>Hola ${data.customerName},</p>
        <p>Tu pedido <strong>${data.orderNumber}</strong> ahora está: <strong>${data.statusLabel}</strong></p>
        <p style="color:#999;font-size:12px;margin-top:20px">MENIUS — Menús digitales premium</p>
      </div>
    `,
  });
}

// ---- Restaurant Owner Notifications ----

export async function sendNewOrderAlert(data: {
  to: string;
  ownerName: string;
  orderNumber: string;
  customerName: string;
  total: number;
  itemCount: number;
}) {
  return sendEmail({
    to: data.to,
    subject: `Nueva orden ${data.orderNumber} — ${data.customerName} ($${data.total.toFixed(2)})`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <h2 style="color:#1a1a1a">Nueva orden recibida</h2>
        <p>Hola ${data.ownerName},</p>
        <p>Tienes una nueva orden:</p>
        <ul>
          <li><strong>Orden:</strong> ${data.orderNumber}</li>
          <li><strong>Cliente:</strong> ${data.customerName}</li>
          <li><strong>Items:</strong> ${data.itemCount}</li>
          <li><strong>Total:</strong> $${data.total.toFixed(2)}</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://menius.vercel.app'}/app/orders" style="display:inline-block;padding:12px 24px;background:#1a1a1a;color:white;text-decoration:none;border-radius:12px;font-weight:600;margin-top:10px">
          Ver en Dashboard
        </a>
        <p style="color:#999;font-size:12px;margin-top:20px">MENIUS — Menús digitales premium</p>
      </div>
    `,
  });
}
