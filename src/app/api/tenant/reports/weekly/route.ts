import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { generateWeeklyReportHTML } from '@/lib/reports/weekly-report';
import { NextResponse } from 'next/server';

/**
 * GET /api/tenant/reports/weekly - Generate and return weekly report
 * Can be called manually from dashboard or triggered by cron
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', tenant.restaurantId)
      .single();

    // Calculate date range (last 7 days)
    const now = new Date();
    const weekEnd = now.toISOString().split('T')[0];
    const weekStartDate = new Date(now);
    weekStartDate.setDate(weekStartDate.getDate() - 7);
    const weekStart = weekStartDate.toISOString().split('T')[0];

    // Fetch orders for the period
    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*, product:products(name))')
      .eq('restaurant_id', tenant.restaurantId)
      .gte('created_at', weekStartDate.toISOString())
      .lte('created_at', now.toISOString());

    const allOrders = orders ?? [];
    const completedOrders = allOrders.filter(o => ['delivered', 'ready', 'completed'].includes(o.status));
    const cancelledOrders = allOrders.filter(o => o.status === 'cancelled');

    const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
    const tipsTotal = completedOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.tip_amount) || 0), 0);
    const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Top products
    const productCounts = new Map<string, number>();
    for (const order of completedOrders) {
      for (const item of (order.order_items ?? [])) {
        const name = item.product?.name ?? 'Desconocido';
        productCounts.set(name, (productCounts.get(name) ?? 0) + item.qty);
      }
    }
    const topProducts = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Daily breakdown
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const ordersByDay: { day: string; count: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOrders = completedOrders.filter(o => o.created_at.startsWith(dateStr));
      ordersByDay.push({
        day: `${dayNames[d.getDay()]} ${d.getDate()}`,
        count: dayOrders.length,
        revenue: dayOrders.reduce((s: number, o: any) => s + (parseFloat(o.total) || 0), 0),
      });
    }

    // Reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('restaurant_id', tenant.restaurantId)
      .gte('created_at', weekStartDate.toISOString());

    const reviewsList = reviews ?? [];
    const avgRating = reviewsList.length > 0
      ? reviewsList.reduce((s, r) => s + r.rating, 0) / reviewsList.length
      : 0;

    // Unique customers (by phone)
    const uniquePhones = new Set(
      allOrders
        .filter(o => o.customer_phone)
        .map(o => o.customer_phone)
    );

    const metrics = {
      totalOrders: completedOrders.length,
      totalRevenue,
      avgTicket,
      newCustomers: uniquePhones.size,
      topProducts,
      ordersByDay,
      reviewsCount: reviewsList.length,
      avgRating,
      cancelRate: allOrders.length > 0 ? cancelledOrders.length / allOrders.length : 0,
      tipsTotal,
    };

    const html = generateWeeklyReportHTML(
      restaurant?.name ?? 'Mi Restaurante',
      metrics,
      weekStart,
      weekEnd,
    );

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
