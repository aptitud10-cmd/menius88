import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/gift-cards - Check balance or redeem a gift card (public)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { restaurant_id, code, action, amount, order_id } = body;

  if (!restaurant_id || !code) {
    return NextResponse.json({ error: 'restaurant_id and code required' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: card, error } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .eq('code', code.toUpperCase().replace(/\s/g, ''))
    .maybeSingle();

  if (error || !card) {
    return NextResponse.json({ valid: false, error: 'Tarjeta no encontrada' });
  }

  if (card.status !== 'active') {
    return NextResponse.json({ valid: false, error: 'Tarjeta inactiva o cancelada' });
  }

  if (card.expires_at && new Date(card.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Tarjeta expirada' });
  }

  if (card.remaining_amount <= 0) {
    return NextResponse.json({ valid: false, error: 'Saldo agotado' });
  }

  // Check balance only
  if (action === 'check' || !action) {
    return NextResponse.json({
      valid: true,
      balance: parseFloat(card.remaining_amount),
      code: card.code,
      recipient_name: card.recipient_name,
    });
  }

  // Redeem
  if (action === 'redeem') {
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount required' }, { status: 400 });
    }

    const redeemAmount = Math.min(amount, parseFloat(card.remaining_amount));
    const newBalance = parseFloat(card.remaining_amount) - redeemAmount;

    await supabase
      .from('gift_cards')
      .update({
        remaining_amount: newBalance,
        status: newBalance <= 0 ? 'used' : 'active',
      })
      .eq('id', card.id);

    await supabase.from('gift_card_transactions').insert({
      gift_card_id: card.id,
      order_id: order_id || null,
      amount: redeemAmount,
      type: 'redeem',
    });

    return NextResponse.json({
      success: true,
      redeemed: redeemAmount,
      remaining: newBalance,
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
