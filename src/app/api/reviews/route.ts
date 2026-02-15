import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/reviews?restaurant_id=xxx - Get public reviews for a restaurant
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurant_id');

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurant_id required' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, created_at, owner_response, responded_at')
    .eq('restaurant_id', restaurantId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate aggregate stats
  const total = reviews?.length ?? 0;
  const avg = total > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / total
    : 0;

  return NextResponse.json({
    reviews: reviews ?? [],
    stats: {
      total,
      average: Math.round(avg * 10) / 10,
    },
  });
}

/**
 * POST /api/reviews - Submit a public review
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { restaurant_id, order_id, customer_name, rating, comment } = body;

  if (!restaurant_id || !customer_name || !rating) {
    return NextResponse.json({ error: 'restaurant_id, customer_name, and rating are required' }, { status: 400 });
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
  }

  const supabase = createClient();

  // Verify restaurant exists
  const { data: rest } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurant_id)
    .single();

  if (!rest) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  // If order_id provided, verify it belongs to this restaurant
  if (order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('id', order_id)
      .eq('restaurant_id', restaurant_id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if a review already exists for this order
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Ya dejaste una reseña para este pedido' }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      restaurant_id,
      order_id: order_id || null,
      customer_name: customer_name.trim(),
      rating,
      comment: (comment ?? '').trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}
