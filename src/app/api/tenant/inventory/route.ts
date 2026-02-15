import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/inventory - Get all products with inventory status
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, image_url, is_active, track_inventory, stock_quantity, low_stock_threshold, category_id')
      .eq('restaurant_id', tenant.restaurantId)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const tracked = (products ?? []).filter(p => p.track_inventory);
    const lowStock = tracked.filter(p => p.stock_quantity <= p.low_stock_threshold);
    const outOfStock = tracked.filter(p => p.stock_quantity <= 0);

    return NextResponse.json({
      products: products ?? [],
      stats: {
        total: products?.length ?? 0,
        tracked: tracked.length,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/inventory - Update inventory for a product
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();
    const { product_id, action, quantity, track_inventory, low_stock_threshold } = body;

    if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

    // Verify ownership
    const { data: product } = await supabase
      .from('products')
      .select('id, stock_quantity, track_inventory')
      .eq('id', product_id)
      .eq('restaurant_id', tenant.restaurantId)
      .single();

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Toggle tracking
    if (track_inventory !== undefined) {
      await supabase
        .from('products')
        .update({ track_inventory })
        .eq('id', product_id);

      return NextResponse.json({ success: true });
    }

    // Update threshold
    if (low_stock_threshold !== undefined) {
      await supabase
        .from('products')
        .update({ low_stock_threshold })
        .eq('id', product_id);

      return NextResponse.json({ success: true });
    }

    // Inventory actions: restock, adjustment
    if (action && quantity != null) {
      let newQty = product.stock_quantity;

      if (action === 'restock') {
        newQty = product.stock_quantity + quantity;
      } else if (action === 'adjustment') {
        newQty = quantity; // Set absolute
      } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      // Update product stock
      await supabase
        .from('products')
        .update({
          stock_quantity: Math.max(0, newQty),
          is_active: newQty > 0 ? true : undefined, // Don't deactivate if just low
        })
        .eq('id', product_id);

      // Log the change
      await supabase
        .from('inventory_log')
        .insert({
          product_id,
          restaurant_id: tenant.restaurantId,
          change_type: action,
          quantity_change: action === 'restock' ? quantity : (newQty - product.stock_quantity),
          quantity_after: Math.max(0, newQty),
          created_by: tenant.userId,
        });

      return NextResponse.json({ success: true, new_quantity: Math.max(0, newQty) });
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
