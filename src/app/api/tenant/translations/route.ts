import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/translations?language=en
 * Get all translations for a specific language
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('language') ?? 'en';

    // Get product translations
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description')
      .eq('restaurant_id', tenant.restaurantId);

    const productIds = (products ?? []).map(p => p.id);

    const { data: productTranslations } = productIds.length > 0
      ? await supabase
          .from('product_translations')
          .select('*')
          .in('product_id', productIds)
          .eq('language', lang)
      : { data: [] };

    // Get category translations
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', tenant.restaurantId);

    const categoryIds = (categories ?? []).map(c => c.id);

    const { data: categoryTranslations } = categoryIds.length > 0
      ? await supabase
          .from('category_translations')
          .select('*')
          .in('category_id', categoryIds)
          .eq('language', lang)
      : { data: [] };

    // Get restaurant language config
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('default_language, supported_languages')
      .eq('id', tenant.restaurantId)
      .single();

    return NextResponse.json({
      language: lang,
      default_language: restaurant?.default_language ?? 'es',
      supported_languages: restaurant?.supported_languages ?? ['es'],
      products: products ?? [],
      product_translations: productTranslations ?? [],
      categories: categories ?? [],
      category_translations: categoryTranslations ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/tenant/translations - Save translations for a language
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();
    const { language, product_translations, category_translations, supported_languages } = body;

    if (!language) return NextResponse.json({ error: 'language required' }, { status: 400 });

    // Update supported_languages on restaurant
    if (supported_languages) {
      await supabase
        .from('restaurants')
        .update({ supported_languages })
        .eq('id', tenant.restaurantId);
    }

    // Upsert product translations
    if (product_translations?.length > 0) {
      for (const t of product_translations) {
        await supabase
          .from('product_translations')
          .upsert({
            product_id: t.product_id,
            language,
            name: t.name,
            description: t.description ?? '',
          }, { onConflict: 'product_id,language' });
      }
    }

    // Upsert category translations
    if (category_translations?.length > 0) {
      for (const t of category_translations) {
        await supabase
          .from('category_translations')
          .upsert({
            category_id: t.category_id,
            language,
            name: t.name,
          }, { onConflict: 'category_id,language' });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
