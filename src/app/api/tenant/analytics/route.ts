import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/analytics - Advanced analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') ?? '30');

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    const prevSince = new Date();
    prevSince.setDate(prevSince.getDate() - (days * 2));
    const prevSinceStr = prevSince.toISOString();

    // Current period orders
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('id, total, status, order_type, tip_amount, created_at, customer_phone, delivery_fee, discount_amount')
      .eq('restaurant_id', tenant.restaurantId)
      .gte('created_at', sinceStr)
      .order('created_at', { ascending: false });

    // Previous period orders for comparison
    const { data: prevOrders } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('restaurant_id', tenant.restaurantId)
      .gte('created_at', prevSinceStr)
      .lt('created_at', sinceStr);

    // Top products
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, qty, line_total, product:products(name)')
      .eq('products.restaurant_id', tenant.restaurantId)
      .gte('created_at', sinceStr);

    // Reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, created_at')
      .eq('restaurant_id', tenant.restaurantId)
      .gte('created_at', sinceStr);

    const orders = currentOrders ?? [];
    const prev = prevOrders ?? [];
    const completed = orders.filter(o => o.status !== 'cancelled');
    const prevCompleted = prev.filter(o => o.status !== 'cancelled');

    // Revenue
    const revenue = completed.reduce((s, o) => s + Number(o.total), 0);
    const prevRevenue = prevCompleted.reduce((s, o) => s + Number(o.total), 0);

    // Tips
    const tips = completed.reduce((s, o) => s + Number(o.tip_amount ?? 0), 0);

    // Order type distribution
    const orderTypes: Record<string, number> = {};
    completed.forEach(o => { orderTypes[o.order_type ?? 'dine_in'] = (orderTypes[o.order_type ?? 'dine_in'] ?? 0) + 1; });

    // Daily revenue chart
    const dailyData: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = { revenue: 0, orders: 0 };
    }
    completed.forEach(o => {
      const key = o.created_at.split('T')[0];
      if (dailyData[key]) {
        dailyData[key].revenue += Number(o.total);
        dailyData[key].orders += 1;
      }
    });

    // Peak hours
    const hourly: Record<number, number> = {};
    completed.forEach(o => {
      const hour = new Date(o.created_at).getHours();
      hourly[hour] = (hourly[hour] ?? 0) + 1;
    });

    // Unique customers
    const uniquePhones = new Set(completed.filter(o => o.customer_phone).map(o => o.customer_phone));
    const returningCustomers = new Map<string, number>();
    completed.forEach(o => {
      if (o.customer_phone) {
        returningCustomers.set(o.customer_phone, (returningCustomers.get(o.customer_phone) ?? 0) + 1);
      }
    });
    const returning = Array.from(returningCustomers.values()).filter(v => v > 1).length;

    // Top products aggregation
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    (orderItems ?? []).forEach((item: any) => {
      const pid = item.product_id;
      const existing = productMap.get(pid) ?? { name: item.product?.name ?? 'Producto', qty: 0, revenue: 0 };
      existing.qty += item.qty;
      existing.revenue += Number(item.line_total);
      productMap.set(pid, existing);
    });
    const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Average rating
    const avgRating = (reviews ?? []).length > 0
      ? (reviews ?? []).reduce((s, r) => s + r.rating, 0) / (reviews ?? []).length
      : 0;

    return NextResponse.json({
      period: { days, from: sinceStr, to: new Date().toISOString() },
      kpis: {
        revenue,
        prevRevenue,
        revenueChange: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
        totalOrders: completed.length,
        prevOrders: prevCompleted.length,
        avgTicket: completed.length > 0 ? revenue / completed.length : 0,
        tips,
        cancelRate: orders.length > 0 ? (orders.filter(o => o.status === 'cancelled').length / orders.length) * 100 : 0,
        uniqueCustomers: uniquePhones.size,
        returningCustomers: returning,
        retentionRate: uniquePhones.size > 0 ? (returning / uniquePhones.size) * 100 : 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: (reviews ?? []).length,
      },
      charts: {
        daily: Object.entries(dailyData).sort(([a], [b]) => a.localeCompare(b)).map(([date, data]) => ({ date, ...data })),
        hourly: Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: hourly[h] ?? 0 })),
        orderTypes,
        topProducts,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
