import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/orders/receipt?order_id=... - Generate HTML receipt (printable/PDF)
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const orderId = new URL(request.url).searchParams.get('order_id');

    if (!orderId) return NextResponse.json({ error: 'order_id required' }, { status: 400 });

    // Fetch order with items
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(name, image_url))')
      .eq('id', orderId)
      .eq('restaurant_id', tenant.restaurantId)
      .single();

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Fetch restaurant info
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name, address, phone, email, logo_url, currency')
      .eq('id', tenant.restaurantId)
      .single();

    const curr = restaurant?.currency ?? 'MXN';
    const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: curr }).format(n);

    const orderDate = new Date(order.created_at).toLocaleString('es-MX', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const orderTypeLabel: Record<string, string> = {
      dine_in: 'Para comer aquí',
      pickup: 'Para llevar',
      delivery: 'Entrega a domicilio',
    };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo #${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; max-width: 380px; margin: 0 auto; padding: 24px 16px; }
    .header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed #e5e5e5; }
    .header h1 { font-size: 20px; font-weight: 700; }
    .header p { font-size: 11px; color: #666; margin-top: 2px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; color: #444; }
    .meta-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 99px; background: #f3f4f6; color: #374151; }
    .items { border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; padding: 12px 0; margin-bottom: 12px; }
    .item { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .item-name { flex: 1; }
    .item-qty { width: 30px; text-align: center; color: #666; font-weight: 600; }
    .item-price { width: 70px; text-align: right; font-weight: 600; }
    .totals { margin-bottom: 16px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .total-row.grand { font-size: 18px; font-weight: 700; border-top: 2px solid #1a1a1a; padding-top: 8px; margin-top: 4px; }
    .footer { text-align: center; padding-top: 16px; border-top: 2px dashed #e5e5e5; font-size: 11px; color: #999; }
    .footer p { margin: 2px 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${restaurant?.name ?? 'Restaurante'}</h1>
    ${restaurant?.address ? `<p>${restaurant.address}</p>` : ''}
    ${restaurant?.phone ? `<p>Tel: ${restaurant.phone}</p>` : ''}
  </div>

  <div class="meta">
    <div>
      <div class="meta-row"><strong>Pedido:</strong>&nbsp;#${order.order_number}</div>
      <div class="meta-row"><strong>Fecha:</strong>&nbsp;${orderDate}</div>
      <div class="meta-row"><strong>Cliente:</strong>&nbsp;${order.customer_name}</div>
      ${order.customer_phone ? `<div class="meta-row"><strong>Tel:</strong>&nbsp;${order.customer_phone}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <span class="badge">${orderTypeLabel[order.order_type] ?? 'Pedido'}</span>
    </div>
  </div>

  ${order.delivery_address ? `<div style="font-size: 12px; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 8px;"><strong>Dirección:</strong> ${order.delivery_address}</div>` : ''}

  <div class="items">
    <div class="item" style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
      <span class="item-qty">Qty</span>
      <span class="item-name">Producto</span>
      <span class="item-price">Precio</span>
    </div>
    ${(order.items ?? []).map((item: any) => `
    <div class="item">
      <span class="item-qty">${item.qty}x</span>
      <span class="item-name">${item.product?.name ?? 'Producto'}</span>
      <span class="item-price">${fmt(item.line_total)}</span>
    </div>
    ${item.notes ? `<div style="font-size: 10px; color: #888; padding-left: 30px; margin-top: -2px;">📝 ${item.notes}</div>` : ''}
    `).join('')}
  </div>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${fmt(order.subtotal ?? order.total)}</span></div>
    ${order.discount_amount > 0 ? `<div class="total-row" style="color: #059669;"><span>Descuento</span><span>-${fmt(order.discount_amount)}</span></div>` : ''}
    ${order.delivery_fee > 0 ? `<div class="total-row"><span>Envío</span><span>${fmt(order.delivery_fee)}</span></div>` : ''}
    ${order.tip_amount > 0 ? `<div class="total-row" style="color: #059669;"><span>Propina</span><span>${fmt(order.tip_amount)}</span></div>` : ''}
    <div class="total-row grand"><span>Total</span><span>${fmt(order.total)}</span></div>
  </div>

  ${order.notes ? `<div style="font-size: 11px; padding: 8px; background: #fffbeb; border-radius: 8px; margin-bottom: 12px;"><strong>Notas:</strong> ${order.notes}</div>` : ''}

  <div class="footer">
    <p>¡Gracias por tu pedido!</p>
    <p>Powered by Menius</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
