/**
 * Weekly Report Generator
 * Generates an HTML report digest for restaurant owners
 */

interface WeeklyMetrics {
  totalOrders: number;
  totalRevenue: number;
  avgTicket: number;
  newCustomers: number;
  topProducts: { name: string; count: number }[];
  ordersByDay: { day: string; count: number; revenue: number }[];
  reviewsCount: number;
  avgRating: number;
  cancelRate: number;
  tipsTotal: number;
}

export function generateWeeklyReportHTML(
  restaurantName: string,
  metrics: WeeklyMetrics,
  weekStart: string,
  weekEnd: string,
): string {
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  const topProductsRows = metrics.topProducts
    .slice(0, 5)
    .map((p, i) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">${i + 1}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #1f2937; font-size: 13px;">${p.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #374151; font-size: 13px;">${p.count} vendidos</td>
      </tr>
    `)
    .join('');

  const dailyRows = metrics.ordersByDay
    .map(d => `
      <tr>
        <td style="padding: 6px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 13px;">${d.day}</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #374151; font-size: 13px;">${d.count}</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #059669; font-size: 13px;">${fmt(d.revenue)}</td>
      </tr>
    `)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669, #0d9488); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
      <h1 style="color: white; margin: 0 0 4px 0; font-size: 22px;">Reporte Semanal</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 14px;">${restaurantName}</p>
      <p style="color: rgba(255,255,255,0.65); margin: 8px 0 0 0; font-size: 12px;">${weekStart} — ${weekEnd}</p>
    </div>

    <!-- KPIs -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <div style="flex: 1; background: white; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">${fmt(metrics.totalRevenue)}</p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Ingresos</p>
      </div>
      <div style="flex: 1; background: white; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #2563eb;">${metrics.totalOrders}</p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Órdenes</p>
      </div>
      <div style="flex: 1; background: white; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #7c3aed;">${fmt(metrics.avgTicket)}</p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Ticket Promedio</p>
      </div>
    </div>

    <!-- Secondary metrics -->
    <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Clientes nuevos</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600; text-align: right; color: #1f2937;">${metrics.newCustomers}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Reseñas recibidas</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600; text-align: right; color: #1f2937;">${metrics.reviewsCount} (${metrics.avgRating > 0 ? metrics.avgRating.toFixed(1) + ' ⭐' : 'N/A'})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Propinas totales</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600; text-align: right; color: #059669;">${fmt(metrics.tipsTotal)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Tasa de cancelación</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 600; text-align: right; color: ${metrics.cancelRate > 0.1 ? '#dc2626' : '#059669'};">${pct(metrics.cancelRate)}</td>
        </tr>
      </table>
    </div>

    <!-- Top Products -->
    ${metrics.topProducts.length > 0 ? `
    <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: #374151;">Top 5 Productos</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${topProductsRows}
      </table>
    </div>
    ` : ''}

    <!-- Daily breakdown -->
    ${metrics.ordersByDay.length > 0 ? `
    <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: #374151;">Desglose Diario</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 6px 12px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase;">Día</th>
            <th style="padding: 6px 12px; text-align: center; font-size: 11px; color: #9ca3af; text-transform: uppercase;">Órdenes</th>
            <th style="padding: 6px 12px; text-align: right; font-size: 11px; color: #9ca3af; text-transform: uppercase;">Ingresos</th>
          </tr>
        </thead>
        <tbody>
          ${dailyRows}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="text-align: center; padding: 16px 0;">
      <p style="margin: 0; font-size: 11px; color: #9ca3af;">
        Reporte generado por <strong style="color: #059669;">MENIUS</strong>
      </p>
      <p style="margin: 4px 0 0; font-size: 10px; color: #d1d5db;">
        Puedes desactivar estos reportes desde Configuración &gt; Reportes
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
