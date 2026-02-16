import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/audit - Fetch audit log entries
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('restaurant_id', tenant.restaurantId)
      .order('created_at', { ascending: false });

    if (action) query = query.eq('action', action);
    if (entityType) query = query.eq('entity_type', entityType);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      entries: data ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
