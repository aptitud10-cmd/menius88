import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/staff - List staff members and pending invitations
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const [{ data: staff }, { data: invitations }] = await Promise.all([
      supabase
        .from('restaurant_staff')
        .select('*, user:profiles(full_name, user_id)')
        .eq('restaurant_id', tenant.restaurantId)
        .order('created_at'),
      supabase
        .from('staff_invitations')
        .select('*')
        .eq('restaurant_id', tenant.restaurantId)
        .in('status', ['pending'])
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      staff: staff ?? [],
      invitations: invitations ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/tenant/staff - Send staff invitation
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    const { email, role } = body;
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }
    if (!['staff', 'manager'].includes(role ?? 'staff')) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from('staff_invitations')
      .select('id')
      .eq('restaurant_id', tenant.restaurantId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Ya existe una invitación pendiente para este email' }, { status: 409 });
    }

    // Check if already staff
    const { data: existingStaff } = await supabase
      .from('restaurant_staff')
      .select('id, user:profiles!inner(user_id)')
      .eq('restaurant_id', tenant.restaurantId)
      .maybeSingle();

    const { data: invitation, error } = await supabase
      .from('staff_invitations')
      .insert({
        restaurant_id: tenant.restaurantId,
        email: email.toLowerCase(),
        role: role ?? 'staff',
        invited_by: tenant.userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: Send invitation email using notification service
    // await sendStaffInvitation({ to: email, token: invitation.token, ... });

    return NextResponse.json({ invitation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * DELETE /api/tenant/staff - Remove staff member or revoke invitation
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staff_id');
    const invitationId = searchParams.get('invitation_id');

    if (staffId) {
      const { error } = await supabase
        .from('restaurant_staff')
        .delete()
        .eq('id', staffId)
        .eq('restaurant_id', tenant.restaurantId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (invitationId) {
      const { error } = await supabase
        .from('staff_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)
        .eq('restaurant_id', tenant.restaurantId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'staff_id or invitation_id required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
