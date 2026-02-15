import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/reservations - List reservations with optional date filter
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let query = supabase
      .from('reservations')
      .select('*, table:tables(name, capacity)')
      .eq('restaurant_id', tenant.restaurantId)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (date) query = query.eq('date', date);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data: reservations, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get config
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('reservation_config')
      .eq('id', tenant.restaurantId)
      .single();

    // Get tables for assignment
    const { data: tables } = await supabase
      .from('tables')
      .select('id, name, capacity, is_active')
      .eq('restaurant_id', tenant.restaurantId)
      .eq('is_active', true)
      .order('name');

    // Stats for today
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = (reservations ?? []).filter(r => r.date === today);

    return NextResponse.json({
      reservations: reservations ?? [],
      tables: tables ?? [],
      config: restaurant?.reservation_config ?? {},
      stats: {
        today: todayReservations.length,
        todayGuests: todayReservations.reduce((s, r) => s + r.party_size, 0),
        pending: todayReservations.filter(r => r.status === 'pending').length,
        confirmed: todayReservations.filter(r => r.status === 'confirmed').length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/reservations - Update reservation status or assign table
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { id, status, table_id } = await request.json();

    if (!id) return NextResponse.json({ error: 'Reservation ID required' }, { status: 400 });

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (table_id !== undefined) updateData.table_id = table_id;

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reservation: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * DELETE /api/tenant/reservations - Delete a reservation
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { id } = await request.json();

    await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
