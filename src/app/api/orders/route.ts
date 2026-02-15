/**
 * Public Order Creation API
 * 
 * This endpoint handles order creation from the public menu pages.
 * It validates the order data, verifies the restaurant exists,
 * and ensures all products belong to the specified restaurant.
 * 
 * Security: This is a PUBLIC endpoint (no auth required) but with
 * strict validation to prevent abuse.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { publicOrderSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting is handled by middleware
    
    const body = await request.json();
    const { restaurant_id, ...orderData } = body;

    // Validate restaurant_id is provided
    if (!restaurant_id || typeof restaurant_id !== 'string') {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Validate order data with Zod schema
    const parsed = publicOrderSchema.safeParse(orderData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try { cookieStore.set({ name, value, ...options }); } catch { /* ignore */ }
          },
          remove(name: string, options: CookieOptions) {
            try { cookieStore.set({ name, value: '', ...options }); } catch { /* ignore */ }
          },
        },
      }
    );

    // Verify restaurant exists
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Validate ALL products belong to this restaurant
    const productIds = parsed.data.items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, restaurant_id, is_active')
      .in('id', productIds);

    if (productsError || !products) {
      return NextResponse.json(
        { error: 'Could not verify products' },
        { status: 500 }
      );
    }

    // Check every product belongs to the restaurant and is active
    for (const productId of productIds) {
      const product = products.find(p => p.id === productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${productId} not found` },
          { status: 400 }
        );
      }
      if (product.restaurant_id !== restaurant_id) {
        // CRITICAL: This is a cross-tenant attack attempt!
        console.error(
          `[SECURITY] Cross-tenant order attempt: product ${productId} ` +
          `belongs to restaurant ${product.restaurant_id}, ` +
          `but order targets restaurant ${restaurant_id}`
        );
        return NextResponse.json(
          { error: 'Invalid product for this restaurant' },
          { status: 403 }
        );
      }
      if (!product.is_active) {
        return NextResponse.json(
          { error: `Product ${productId} is not available` },
          { status: 400 }
        );
      }
    }

    // Generate order number
    const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Calculate total from items (server-side, don't trust client total)
    let serverTotal = 0;
    for (const item of parsed.data.items) {
      serverTotal += item.line_total;
    }

    // Handle discount: increment promo usage if a promo was used
    let discountAmount = 0;
    if (parsed.data.promotion_id && parsed.data.discount_amount) {
      discountAmount = parsed.data.discount_amount;
      // Increment usage count directly
      const { data: promo } = await supabase
        .from('promotions')
        .select('current_uses')
        .eq('id', parsed.data.promotion_id)
        .single();
      if (promo) {
        await supabase
          .from('promotions')
          .update({ current_uses: (promo.current_uses || 0) + 1 })
          .eq('id', parsed.data.promotion_id);
      }
    }

    // Calculate delivery fee if applicable
    const orderType = parsed.data.order_type ?? 'dine_in';
    let deliveryFee = 0;
    if (orderType === 'delivery') {
      const { data: restConfig } = await supabase
        .from('restaurants')
        .select('order_config')
        .eq('id', restaurant_id)
        .single();
      deliveryFee = restConfig?.order_config?.deliveryFee ?? 0;
    }

    const tipAmount = parsed.data.tip_amount ?? 0;
    const finalTotal = serverTotal - discountAmount + deliveryFee + tipAmount;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant_id,
        order_number: orderNum,
        customer_name: parsed.data.customer_name,
        customer_phone: parsed.data.customer_phone || null,
        notes: parsed.data.notes,
        order_type: orderType,
        table_id: parsed.data.table_id || null,
        delivery_address: parsed.data.delivery_address || null,
        delivery_fee: deliveryFee,
        discount_code: parsed.data.discount_code || null,
        discount_amount: discountAmount,
        promotion_id: parsed.data.promotion_id || null,
        tip_amount: tipAmount,
        is_scheduled: parsed.data.is_scheduled || false,
        scheduled_for: parsed.data.scheduled_for || null,
        subtotal: serverTotal,
        total: finalTotal,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[ORDER] Failed to create order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Insert order items
    for (const item of parsed.data.items) {
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          qty: item.qty,
          unit_price: item.unit_price,
          line_total: item.line_total,
          notes: item.notes,
        })
        .select()
        .single();

      if (itemError) {
        console.error('[ORDER] Failed to insert order item:', itemError);
        continue;
      }

      // Insert extras for this item
      if (orderItem && item.extras.length > 0) {
        const { error: extrasError } = await supabase
          .from('order_item_extras')
          .insert(
            item.extras.map(ex => ({
              order_item_id: orderItem.id,
              extra_id: ex.extra_id,
              price: ex.price,
            }))
          );

        if (extrasError) {
          console.error('[ORDER] Failed to insert extras:', extrasError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        total: order.total,
        status: order.status,
      },
    });

  } catch (error) {
    console.error('[ORDER] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
