// app/api/products/[id]/restock/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        // يتم إضافة الكمية للمنتج
        return NextResponse.json({ success: true, ...body });
    } catch (error) {
        console.error('Error restocking:', error);
        return NextResponse.json(
            { error: 'Failed to restock product' },
            { status: 500 }
        );
    }
}
