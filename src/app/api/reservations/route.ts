import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/reservations - Public endpoint for customers to create reservations
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { restaurant_id, customer_name, customer_phone, party_size, date, time_slot, notes } = body;

    if (!restaurant_id || !customer_name || !customer_phone || !date || !time_slot) {
      return NextResponse.json({ error: 'Campos requeridos: nombre, teléfono, fecha, hora' }, { status: 400 });
    }

    // Verify restaurant exists and reservations are enabled
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id, reservation_config')
      .eq('id', restaurant_id)
      .single();

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 });
    }

    const config = restaurant.reservation_config ?? {};
    if (!config.enabled) {
      return NextResponse.json({ error: 'Las reservaciones no están habilitadas' }, { status: 400 });
    }

    // Validate party size
    if (party_size > (config.maxPartySize ?? 12)) {
      return NextResponse.json({ error: `Tamaño máximo del grupo: ${config.maxPartySize ?? 12}` }, { status: 400 });
    }

    // Validate date is not in the past and within advance days
    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) {
      return NextResponse.json({ error: 'La fecha no puede ser en el pasado' }, { status: 400 });
    }
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (config.advanceDays ?? 30));
    if (reservationDate > maxDate) {
      return NextResponse.json({ error: `Solo se puede reservar hasta ${config.advanceDays ?? 30} días anticipados` }, { status: 400 });
    }

    // Check slot availability — count existing active reservations at same slot
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('restaurant_id', restaurant_id)
      .eq('date', date)
      .eq('time_slot', time_slot)
      .not('status', 'in', '("cancelled","no_show")');

    // Get total tables to determine capacity
    const { data: tables } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurant_id)
      .eq('is_active', true);

    const maxSlotCapacity = (tables?.length ?? 10);
    if ((existing?.length ?? 0) >= maxSlotCapacity) {
      return NextResponse.json({ error: 'Horario no disponible, intenta otro horario' }, { status: 400 });
    }

    const status = config.autoConfirm ? 'confirmed' : 'pending';

    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        restaurant_id,
        customer_name,
        customer_phone,
        customer_email: body.customer_email ?? '',
        party_size: party_size ?? 2,
        date,
        time_slot,
        duration_minutes: config.slotDuration ?? 90,
        status,
        notes: notes ?? '',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      reservation,
      message: status === 'confirmed'
        ? 'Reservación confirmada automáticamente'
        : 'Reservación recibida, pendiente de confirmación',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/reservations?restaurant_id=...&date=... - Public: get available slots
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id');
    const date = searchParams.get('date');

    if (!restaurantId || !date) {
      return NextResponse.json({ error: 'restaurant_id and date required' }, { status: 400 });
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('reservation_config')
      .eq('id', restaurantId)
      .single();

    const config = restaurant?.reservation_config ?? {};
    const allSlots: string[] = config.timeSlots ?? [];

    // Get existing reservations for that date
    const { data: existing } = await supabase
      .from('reservations')
      .select('time_slot')
      .eq('restaurant_id', restaurantId)
      .eq('date', date)
      .not('status', 'in', '("cancelled","no_show")');

    const { data: tables } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true);

    const maxPerSlot = tables?.length ?? 10;
    const slotCounts: Record<string, number> = {};
    for (const r of existing ?? []) {
      slotCounts[r.time_slot] = (slotCounts[r.time_slot] ?? 0) + 1;
    }

    const availableSlots = allSlots.map(slot => ({
      time: slot,
      available: (slotCounts[slot] ?? 0) < maxPerSlot,
      remaining: maxPerSlot - (slotCounts[slot] ?? 0),
    }));

    return NextResponse.json({
      slots: availableSlots,
      maxPartySize: config.maxPartySize ?? 12,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
