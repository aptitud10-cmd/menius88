/**
 * Email Notification Service — Powered by Resend
 *
 * Sends real transactional emails when RESEND_API_KEY is set.
 * Falls back to console.log in development when no key is configured.
 */

import { Resend } from 'resend';

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

const FROM_EMAIL = 'MENIUS <noreply@menius.app>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://menius.vercel.app';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL-DEV] To: ${payload.to} | Subject: ${payload.subject}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    if (error) {
      console.error('[EMAIL] Send failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[EMAIL] Exception:', err);
    return false;
  }
}

// ---- Shared email wrapper ----

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
      ${content}
    </div>
    <p style="text-align:center;color:#999;font-size:11px;margin-top:16px">
      MENIUS — Plataforma de menús digitales premium
    </p>
  </div>
</body>
</html>`;
}

function primaryButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;padding:12px 28px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;margin-top:8px">${text}</a>`;
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
    html: emailWrapper(`
      <div style="padding:24px">
        <h2 style="color:#1a1a1a;margin:0 0 8px">¡Pedido confirmado!</h2>
        <p style="color:#666;margin:0 0 16px">Hola ${data.customerName},</p>
        <p style="color:#444;margin:0 0 4px">Tu pedido <strong>${data.orderNumber}</strong> en <strong>${data.restaurantName}</strong> ha sido confirmado.</p>
        <p style="font-size:28px;font-weight:bold;color:#1a1a1a;margin:16px 0">$${data.total.toFixed(2)}</p>
        ${primaryButton('Seguir mi pedido', data.trackingUrl)}
      </div>
    `),
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
    html: emailWrapper(`
      <div style="background:#ecfdf5;padding:24px;text-align:center">
        <div style="font-size:48px;margin-bottom:8px">✅</div>
        <h2 style="color:#065f46;margin:0 0 8px">¡Tu pedido está listo!</h2>
        <p style="color:#047857;margin:0">Hola ${data.customerName}, tu pedido <strong>${data.orderNumber}</strong> en <strong>${data.restaurantName}</strong> está listo para recoger.</p>
      </div>
    `),
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
    html: emailWrapper(`
      <div style="padding:24px">
        <h2 style="color:#1a1a1a;margin:0 0 8px">Actualización de pedido</h2>
        <p style="color:#666;margin:0 0 16px">Hola ${data.customerName},</p>
        <p style="color:#444;margin:0">Tu pedido <strong>${data.orderNumber}</strong> ahora está: <strong>${data.statusLabel}</strong></p>
      </div>
    `),
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
    html: emailWrapper(`
      <div style="background:#eff6ff;padding:24px">
        <h2 style="color:#1e40af;margin:0 0 12px">Nueva orden recibida</h2>
        <p style="color:#1e3a5f;margin:0 0 16px">Hola ${data.ownerName},</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:6px 0;color:#666;font-size:14px">Orden</td><td style="padding:6px 0;font-weight:600;text-align:right">${data.orderNumber}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px">Cliente</td><td style="padding:6px 0;font-weight:600;text-align:right">${data.customerName}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px">Items</td><td style="padding:6px 0;font-weight:600;text-align:right">${data.itemCount}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:14px;border-top:1px solid #ddd">Total</td><td style="padding:6px 0;font-weight:bold;font-size:20px;text-align:right;border-top:1px solid #ddd">$${data.total.toFixed(2)}</td></tr>
        </table>
        ${primaryButton('Ver en Dashboard', `${APP_URL}/app/orders`)}
      </div>
    `),
  });
}

// ---- Staff Invitation ----

export async function sendStaffInvitation(data: {
  to: string;
  restaurantName: string;
  role: string;
  invitedBy: string;
}) {
  const roleLabel = data.role === 'manager' ? 'Gerente' : 'Staff';
  return sendEmail({
    to: data.to,
    subject: `Te invitaron a ${data.restaurantName} como ${roleLabel} — MENIUS`,
    html: emailWrapper(`
      <div style="padding:24px;text-align:center">
        <div style="font-size:48px;margin-bottom:8px">🎉</div>
        <h2 style="color:#1a1a1a;margin:0 0 8px">¡Te han invitado!</h2>
        <p style="color:#666;margin:0 0 4px"><strong>${data.invitedBy}</strong> te invita a unirte a</p>
        <p style="font-size:20px;font-weight:bold;color:#1a1a1a;margin:8px 0">${data.restaurantName}</p>
        <p style="color:#666;margin:0 0 16px">Rol: <strong>${roleLabel}</strong></p>
        ${primaryButton('Crear cuenta y unirme', `${APP_URL}/signup?invite=${encodeURIComponent(data.to)}`)}
        <p style="color:#999;font-size:12px;margin-top:16px">Si ya tienes cuenta, inicia sesión con este email para aceptar la invitación.</p>
      </div>
    `),
  });
}
