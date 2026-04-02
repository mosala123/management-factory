// app/api/products/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UpdateProductRequest, ApiResponse } from '@/lib/types/api';
import { Product } from '@/lib/types/database';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';

// GET /api/products/[id] - Fetch a single product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Product not found' },
                } as ApiResponse,
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data as Product,
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

// PUT /api/products/[id] - Update a product
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const authCheck = await requireAuth('admin');
        if (!authCheck.authorized) {
            return authCheck.error;
        }

        const supabase = createAdminClient();
        const { id } = await params;
        const body: UpdateProductRequest = await request.json();

        // Check if product exists
        const { data: existingProduct, error: fetchError } = await supabase
            .from('products')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !existingProduct) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Product not found' },
                } as ApiResponse,
                { status: 404 }
            );
        }

        const safeBody = Object.fromEntries(
            Object.entries(body).filter(([key]) => key !== 'id')
        ) as UpdateProductRequest;

        const updateData = {
            ...safeBody,
        };

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

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
            data: data as Product,
            message: 'Product updated successfully',
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

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const authCheck = await requireAuth('admin');
        if (!authCheck.authorized) {
            return authCheck.error;
        }

        const supabase = createAdminClient();
        const { id } = await params;

        // Check if product exists
        const { data: existingProduct, error: fetchError } = await supabase
            .from('products')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !existingProduct) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Product not found' },
                } as ApiResponse,
                { status: 404 }
            );
        }

        const { error } = await supabase.from('products').delete().eq('id', id);

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
            message: 'Product deleted successfully',
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
