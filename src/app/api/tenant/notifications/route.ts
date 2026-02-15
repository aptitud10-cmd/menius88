import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';
import { notifyCustomerOrderReady, notifyOwnerNewOrder } from '@/lib/notifications/whatsapp-service';

/**
 * POST /api/tenant/notifications/test - Send a test WhatsApp notification
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const body = await request.json();
    const { type, phone } = body;

    if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

    const supabase = createClient();
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', tenant.restaurantId)
      .single();

    const restaurantName = restaurant?.name ?? 'Mi Restaurante';
    let success = false;

    switch (type) {
      case 'new_order':
        success = await notifyOwnerNewOrder(phone, 'TEST-001', '$150.00', restaurantName);
        break;
      case 'order_ready':
        success = await notifyCustomerOrderReady(phone, 'TEST-001', restaurantName);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success, configured: !!process.env.WHATSAPP_TOKEN });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
