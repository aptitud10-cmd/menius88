import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/tenant/restaurants - List all restaurants owned by the current user
 */
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('default_restaurant_id')
      .eq('user_id', user.id)
      .single();

    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name, slug, logo_url, subscription_plan, is_active, created_at')
      .eq('owner_user_id', user.id)
      .order('created_at');

    return NextResponse.json({
      restaurants: restaurants ?? [],
      activeId: profile?.default_restaurant_id ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
