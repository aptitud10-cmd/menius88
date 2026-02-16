import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * GET /api/tenant/gift-cards - List all gift cards
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data: cards } = await supabase
      .from('gift_cards')
      .select('*, gift_card_transactions(*)')
      .eq('restaurant_id', tenant.restaurantId)
      .order('created_at', { ascending: false });

    const total = cards?.reduce((s, c) => s + parseFloat(c.initial_amount), 0) ?? 0;
    const remaining = cards?.reduce((s, c) => s + parseFloat(c.remaining_amount), 0) ?? 0;
    const active = cards?.filter(c => c.status === 'active').length ?? 0;

    return NextResponse.json({
      cards: cards ?? [],
      stats: { total: cards?.length ?? 0, active, totalValue: total, remainingValue: remaining },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/tenant/gift-cards - Create a new gift card
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    const { amount, buyer_name, buyer_email, recipient_name, recipient_email, message, expires_days } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Monto requerido' }, { status: 400 });
    }

    const code = generateCode();
    const expiresAt = expires_days
      ? new Date(Date.now() + expires_days * 86400000).toISOString()
      : null;

    const { data: card, error } = await supabase
      .from('gift_cards')
      .insert({
        restaurant_id: tenant.restaurantId,
        code,
        initial_amount: amount,
        remaining_amount: amount,
        buyer_name: buyer_name ?? '',
        buyer_email: buyer_email ?? '',
        recipient_name: recipient_name ?? '',
        recipient_email: recipient_email ?? '',
        message: message ?? '',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log purchase transaction
    await supabase.from('gift_card_transactions').insert({
      gift_card_id: card.id,
      amount,
      type: 'purchase',
    });

    logAudit({
      restaurantId: tenant.restaurantId,
      userId: tenant.userId,
      userEmail: tenant.userEmail,
      action: 'create',
      entityType: 'payment_link',
      entityId: card.id,
      details: { code, amount },
    });

    return NextResponse.json({ card });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * DELETE /api/tenant/gift-cards?id=xxx - Cancel a gift card
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabase
      .from('gift_cards')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
