// app/api/products/route.ts
import { createClient } from '@/lib/supabase/server';
import { CreateProductRequest, ApiResponse } from '@/lib/types/api';
import { Product } from '@/lib/types/database';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validationErrorResponse } from '@/lib/auth-utils';

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
        // Check authentication - only allow admin and supervisors
        const authCheck = await requireAuth('admin');
        if (!authCheck.authorized) {
            return authCheck.error;
        }

        const supabase = await createClient();
        const body: CreateProductRequest = await request.json();

        // Validate required fields
        const requiredFields = ['name', 'slug', 'description', 'category', 'price', 'quantity', 'min_stock', 'sku'];
        const missing = requiredFields.filter(field => !body[field as keyof CreateProductRequest]);

        if (missing.length > 0) {
            return validationErrorResponse({ missing });
        }

        const { data, error } = await supabase
            .from('products')
            .insert([
                {
                    name: body.name,
                    slug: body.slug,
                    description: body.description,
                    category: body.category,
                    price: body.price,
                    cost: body.cost,
                    quantity: body.quantity,
                    min_stock: body.min_stock,
                    sku: body.sku,
                    images: body.images,
                    summary: body.summary,
                    specs: body.specs,
                    tags: body.tags,
                    active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ])
            .select();

        if (error) {
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
