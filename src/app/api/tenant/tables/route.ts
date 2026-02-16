import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/tables - List all tables with status and current orders
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data: tables } = await supabase
      .from('tables')
      .select('*, current_order:orders(id, order_number, customer_name, total, status, created_at)')
      .eq('restaurant_id', tenant.restaurantId)
      .order('name');

    // Count stats
    const all = tables ?? [];
    const stats = {
      total: all.length,
      available: all.filter(t => (t.status ?? 'available') === 'available').length,
      occupied: all.filter(t => t.status === 'occupied').length,
      reserved: all.filter(t => t.status === 'reserved').length,
    };

    return NextResponse.json({ tables: all, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/tables - Update table status
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    const { id, status, assigned_server, current_order_id } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const updates: Record<string, any> = { status_changed_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (assigned_server !== undefined) updates.assigned_server = assigned_server;
    if (current_order_id !== undefined) updates.current_order_id = current_order_id;

    // If marking available, clear order and server
    if (status === 'available') {
      updates.current_order_id = null;
      updates.assigned_server = '';
    }

    const { error } = await supabase
      .from('tables')
      .update(updates)
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
