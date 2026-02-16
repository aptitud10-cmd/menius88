import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/tenant/staff/permissions - Update staff member permissions
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { staffId, permissions } = await request.json();

    if (!staffId || !permissions) {
      return NextResponse.json({ error: 'staffId and permissions required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('restaurant_staff')
      .update({ permissions })
      .eq('id', staffId)
      .eq('restaurant_id', tenant.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    logAudit({
      restaurantId: tenant.restaurantId,
      userId: tenant.userId,
      userEmail: tenant.userEmail,
      action: 'config_change',
      entityType: 'staff',
      entityId: staffId,
      details: { permissions },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
