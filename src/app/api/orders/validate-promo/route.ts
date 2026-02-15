import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/orders/validate-promo
 * Public endpoint for customers to validate a promo code before checkout
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { restaurant_id, code, subtotal } = body;

  if (!restaurant_id || !code) {
    return NextResponse.json({ error: 'restaurant_id and code required' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: promo, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !promo) {
    return NextResponse.json({ valid: false, error: 'Código no válido' });
  }

  // Check expiration
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Código expirado' });
  }

  // Check max uses
  if (promo.max_uses && promo.current_uses >= promo.max_uses) {
    return NextResponse.json({ valid: false, error: 'Código agotado' });
  }

  // Check min order
  if (subtotal && promo.min_order_amount > 0 && subtotal < promo.min_order_amount) {
    return NextResponse.json({
      valid: false,
      error: `Pedido mínimo de $${promo.min_order_amount} para usar este código`,
    });
  }

  // Calculate discount
  let discount = 0;
  if (promo.discount_type === 'percentage') {
    discount = subtotal ? (subtotal * promo.discount_value / 100) : 0;
  } else {
    discount = promo.discount_value;
  }

  return NextResponse.json({
    valid: true,
    promotion_id: promo.id,
    code: promo.code,
    description: promo.description,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount_amount: Math.round(discount * 100) / 100,
  });
}
