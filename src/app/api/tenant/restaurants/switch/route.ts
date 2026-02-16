import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tenant/restaurants/switch - Switch the active restaurant
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { restaurantId } = await request.json();
    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    // Verify ownership
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, name, slug')
      .eq('id', restaurantId)
      .eq('owner_user_id', user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante no encontrado o sin permisos' }, { status: 403 });
    }

    // Update default restaurant
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ default_restaurant_id: restaurantId })
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, restaurant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
