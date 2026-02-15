import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/expenses - List expenses with P&L summary
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM format
    const category = searchParams.get('category');

    let query = supabase
      .from('expenses')
      .select('*')
      .eq('restaurant_id', tenant.restaurantId)
      .order('date', { ascending: false });

    if (month) {
      query = query.gte('date', `${month}-01`).lt('date', `${month}-32`);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: expenses, error } = await query.limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Calculate monthly revenue from orders
    const currentMonth = month ?? new Date().toISOString().slice(0, 7);
    const { data: orders } = await supabase
      .from('orders')
      .select('total, status, tip_amount')
      .eq('restaurant_id', tenant.restaurantId)
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${currentMonth}-32`)
      .neq('status', 'cancelled');

    const revenue = (orders ?? []).reduce((s, o) => s + Number(o.total), 0);
    const tips = (orders ?? []).reduce((s, o) => s + Number(o.tip_amount ?? 0), 0);
    const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
    const profit = revenue - totalExpenses;

    // Category breakdown
    const byCategory: Record<string, number> = {};
    (expenses ?? []).forEach(e => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
    });

    return NextResponse.json({
      expenses: expenses ?? [],
      summary: {
        revenue,
        tips,
        totalExpenses,
        profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0,
        byCategory,
        month: currentMonth,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/tenant/expenses - Create expense
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        restaurant_id: tenant.restaurantId,
        category: body.category ?? 'other',
        description: body.description ?? '',
        amount: body.amount ?? 0,
        date: body.date ?? new Date().toISOString().split('T')[0],
        is_recurring: body.is_recurring ?? false,
        recurring_frequency: body.recurring_frequency ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ expense });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * DELETE /api/tenant/expenses - Delete expense
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { id } = await request.json();

    await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
