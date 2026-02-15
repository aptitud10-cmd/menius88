import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tenant/menu/import - Import menu from CSV
 * Expects CSV with headers: tipo, categoria, nombre, descripcion, precio, activo, imagen_url, alergenos, tags_dieteticos, tiempo_preparacion, calorias, orden
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();
    const { csvData, mode } = body;

    if (!csvData) {
      return NextResponse.json({ error: 'csvData required' }, { status: 400 });
    }

    // Parse CSV
    const lines = csvData.split('\n').map((l: string) => l.trim()).filter((l: string) => l);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV vacío o sin datos' }, { status: 400 });
    }

    const headers = parseCsvLine(lines[0]);
    const tipoIdx = headers.indexOf('tipo');
    const catIdx = headers.indexOf('categoria');
    const nameIdx = headers.indexOf('nombre');
    const descIdx = headers.indexOf('descripcion');
    const priceIdx = headers.indexOf('precio');
    const activeIdx = headers.indexOf('activo');
    const imgIdx = headers.indexOf('imagen_url');
    const allergenIdx = headers.indexOf('alergenos');
    const dietaryIdx = headers.indexOf('tags_dieteticos');
    const prepIdx = headers.indexOf('tiempo_preparacion');
    const calIdx = headers.indexOf('calorias');

    if (nameIdx === -1) {
      return NextResponse.json({ error: 'Columna "nombre" requerida' }, { status: 400 });
    }

    // Track created categories
    const categoryMap = new Map<string, string>();
    let catOrder = 0;
    let prodOrder = 0;
    let categoriesCreated = 0;
    let productsCreated = 0;

    // Get existing categories
    const { data: existingCats } = await supabase
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', tenant.restaurantId);

    for (const cat of (existingCats ?? [])) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      const tipo = tipoIdx >= 0 ? cells[tipoIdx]?.trim() : '';
      const nombre = nameIdx >= 0 ? cells[nameIdx]?.trim() : '';

      if (!nombre) continue;

      if (tipo === 'categoria') {
        if (!categoryMap.has(nombre.toLowerCase())) {
          const { data: newCat } = await supabase
            .from('categories')
            .insert({
              restaurant_id: tenant.restaurantId,
              name: nombre,
              sort_order: catOrder++,
              is_active: activeIdx >= 0 ? cells[activeIdx]?.trim().toLowerCase() !== 'no' : true,
            })
            .select('id')
            .single();

          if (newCat) {
            categoryMap.set(nombre.toLowerCase(), newCat.id);
            categoriesCreated++;
          }
        }
      } else {
        // Product
        const catName = catIdx >= 0 ? cells[catIdx]?.trim() : '';
        let categoryId = categoryMap.get(catName.toLowerCase());

        // Auto-create category if needed
        if (!categoryId && catName) {
          const { data: newCat } = await supabase
            .from('categories')
            .insert({
              restaurant_id: tenant.restaurantId,
              name: catName,
              sort_order: catOrder++,
              is_active: true,
            })
            .select('id')
            .single();

          if (newCat) {
            categoryId = newCat.id;
            categoryMap.set(catName.toLowerCase(), newCat.id);
            categoriesCreated++;
          }
        }

        if (!categoryId) {
          // Use first category or create "General"
          if (categoryMap.size === 0) {
            const { data: gen } = await supabase
              .from('categories')
              .insert({ restaurant_id: tenant.restaurantId, name: 'General', sort_order: 0, is_active: true })
              .select('id')
              .single();
            if (gen) {
              categoryId = gen.id;
              categoryMap.set('general', gen.id);
              categoriesCreated++;
            }
          } else {
            categoryId = Array.from(categoryMap.values())[0];
          }
        }

        if (!categoryId) continue;

        const allergens = allergenIdx >= 0 ? cells[allergenIdx]?.split(';').map(a => a.trim()).filter(Boolean) : [];
        const dietaryTags = dietaryIdx >= 0 ? cells[dietaryIdx]?.split(';').map(d => d.trim()).filter(Boolean) : [];

        await supabase
          .from('products')
          .insert({
            restaurant_id: tenant.restaurantId,
            category_id: categoryId,
            name: nombre,
            description: descIdx >= 0 ? cells[descIdx]?.trim() ?? '' : '',
            price: priceIdx >= 0 ? parseFloat(cells[priceIdx]) || 0 : 0,
            is_active: activeIdx >= 0 ? cells[activeIdx]?.trim().toLowerCase() !== 'no' : true,
            image_url: imgIdx >= 0 ? cells[imgIdx]?.trim() ?? '' : '',
            allergens: allergens.length > 0 ? allergens : null,
            dietary_tags: dietaryTags.length > 0 ? dietaryTags : null,
            prep_time_minutes: prepIdx >= 0 ? parseInt(cells[prepIdx]) || null : null,
            calories: calIdx >= 0 ? parseInt(cells[calIdx]) || null : null,
            sort_order: prodOrder++,
          });

        productsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      categoriesCreated,
      productsCreated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
