// app/api/products/route.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CreateProductRequest, ApiResponse } from '@/lib/types/api';
import { Product } from '@/lib/types/database';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import type { SupabaseClient } from '@supabase/supabase-js';

// زيادة حجم الطلب مؤقتاً (حل مؤقت)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/[^\x00-\x7F]/g, (char) => {
      const arabicToEnglish: Record<string, string> = {
        'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g', 'ح': 'h',
        'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's',
        'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
        'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
        'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'h', 'ى': 'a',
      };
      return arabicToEnglish[char] || '-';
    })
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(
  supabase: SupabaseClient,
  name: string,
  preferredSlug?: string
) {
  const baseSlug = preferredSlug || generateSlugFromName(name) || 'product';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

// GET /api/products - Fetch all products with pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const page = request.nextUrl.searchParams.get('page') || '1';
    const pageSize = request.nextUrl.searchParams.get('pageSize') || '10';
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');

    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    const from = (pageNum - 1) * size;
    const to = from + size - 1;

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: error.message },
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items: data as Product[],
        pagination: {
          total: count || 0,
          page: pageNum,
          pageSize: size,
          totalPages: Math.ceil((count || 0) / size),
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    // Check authentication - allow admin and supervisor roles
    const authCheck = await requireAuth('admin');
    if (!authCheck.authorized) {
      return authCheck.error;
    }

    const supabase = await getProductsWriteClient();
    const body: CreateProductRequest = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'category', 'price', 'hero_image'];
    const missing = requiredFields.filter(field => !body[field as keyof CreateProductRequest]);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `الحقول المطلوبة: ${missing.join(', ')}` },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(supabase, body.name, body.slug);

    // Prepare product data
    const productData = {
      name: body.name,
      slug,
      description: body.description ?? '',
      category: body.category,
      price: body.price,
      quantity: body.quantity ?? 0,
      min_stock: body.min_stock ?? 10,
      hero_image: body.hero_image,
      gallery: body.gallery ?? [],
      summary: body.summary ?? '',
      specs: body.specs ?? [],
      tags: body.tags ?? [],
      badge: body.badge ?? null,
      in_stock: body.in_stock ?? true,
      created_at: new Date().toISOString(),
    };

    console.log('Inserting product:', productData); // للتتبع

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: error.message },
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data[0] as Product,
        message: 'Product created successfully',
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined,
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

async function getProductsWriteClient() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}
