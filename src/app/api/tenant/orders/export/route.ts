import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/orders/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status=delivered
 * Export orders as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');

    const supabase = createClient();

    let query = supabase
      .from('orders')
      .select('order_number, status, customer_name, notes, total, created_at, order_items(qty, unit_price, line_total, product:products(name))')
      .eq('restaurant_id', tenant.restaurantId)
      .order('created_at', { ascending: false });

    if (from) query = query.gte('created_at', `${from}T00:00:00`);
    if (to) query = query.lte('created_at', `${to}T23:59:59`);
    if (status) query = query.eq('status', status);

    const { data: orders, error } = await query.limit(1000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build CSV
    const header = 'Numero,Estado,Cliente,Total,Items,Notas,Fecha';
    const rows = (orders ?? []).map(o => {
      const items = (o.order_items ?? [])
        .map((i: any) => `${i.qty}x ${i.product?.name ?? '?'}`)
        .join(' | ');
      const date = new Date(o.created_at).toLocaleString('es-MX');
      const notes = (o.notes ?? '').replace(/"/g, '""');
      return `${o.order_number},${o.status},"${o.customer_name ?? ''}",${o.total},"${items}","${notes}","${date}"`;
    });

    const csv = [header, ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ordenes-menius-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
