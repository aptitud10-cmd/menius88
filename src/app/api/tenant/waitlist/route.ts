import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/waitlist - List active waitlist
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data: entries, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('restaurant_id', tenant.restaurantId)
      .in('status', ['waiting', 'notified'])
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const waiting = (entries ?? []).filter(e => e.status === 'waiting');
    const notified = (entries ?? []).filter(e => e.status === 'notified');
    const totalGuests = (entries ?? []).reduce((s, e) => s + e.party_size, 0);

    return NextResponse.json({
      entries: entries ?? [],
      stats: { waiting: waiting.length, notified: notified.length, totalGuests },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/tenant/waitlist - Add to waitlist
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    // Count current waiting to estimate wait time
    const { data: current } = await supabase
      .from('waitlist')
      .select('id')
      .eq('restaurant_id', tenant.restaurantId)
      .in('status', ['waiting', 'notified']);

    const position = (current?.length ?? 0) + 1;
    const estimatedWait = position * 10;

    const { data: entry, error } = await supabase
      .from('waitlist')
      .insert({
        restaurant_id: tenant.restaurantId,
        customer_name: body.customer_name ?? 'Sin nombre',
        customer_phone: body.customer_phone ?? '',
        party_size: body.party_size ?? 2,
        estimated_wait: estimatedWait,
        notes: body.notes ?? '',
        status: 'waiting',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entry, position });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/waitlist - Update waitlist entry status
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { id, status } = await request.json();

    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

    const updateData: Record<string, any> = { status };
    if (status === 'notified') updateData.notified_at = new Date().toISOString();
    if (status === 'seated') updateData.seated_at = new Date().toISOString();

    await supabase
      .from('waitlist')
      .update(updateData)
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * DELETE /api/tenant/waitlist - Remove entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { id } = await request.json();

    await supabase
      .from('waitlist')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
