import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextResponse } from 'next/server';

/**
 * GET /api/tenant/menu/export - Export full menu as CSV
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const [{ data: categories }, { data: products }] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', tenant.restaurantId).order('sort_order'),
      supabase.from('products').select('*').eq('restaurant_id', tenant.restaurantId).order('sort_order'),
    ]);

    const catMap = new Map((categories ?? []).map(c => [c.id, c.name]));

    // Build CSV
    const headers = [
      'tipo', 'categoria', 'nombre', 'descripcion', 'precio',
      'activo', 'imagen_url', 'alergenos', 'tags_dieteticos',
      'tiempo_preparacion', 'calorias', 'orden',
    ];

    const rows: string[][] = [];

    // Categories
    for (const cat of (categories ?? [])) {
      rows.push([
        'categoria', '', cat.name, '', '',
        cat.is_active ? 'si' : 'no', '', '', '',
        '', '', String(cat.sort_order),
      ]);
    }

    // Products
    for (const p of (products ?? [])) {
      rows.push([
        'producto',
        catMap.get(p.category_id) ?? '',
        p.name,
        p.description ?? '',
        String(p.price),
        p.is_active ? 'si' : 'no',
        p.image_url ?? '',
        (p.allergens ?? []).join(';'),
        (p.dietary_tags ?? []).join(';'),
        String(p.prep_time_minutes ?? ''),
        String(p.calories ?? ''),
        String(p.sort_order),
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="menu-export.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
