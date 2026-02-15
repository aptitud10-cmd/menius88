import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tenant/upload
 * Upload a product image to Supabase Storage (tenant-scoped)
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP or GIF.' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    const supabase = createClient();

    // Generate unique path: restaurant_id/timestamp-filename
    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${tenant.restaurantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      // If bucket doesn't exist, try 'products' bucket as fallback
      const { data: data2, error: error2 } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error2) {
        return NextResponse.json({ error: `Upload failed: ${error2.message}` }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(data2.path);
      return NextResponse.json({ url: urlData.publicUrl });
    }

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    return NextResponse.json({ url: urlData.publicUrl });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 });
  }
}
