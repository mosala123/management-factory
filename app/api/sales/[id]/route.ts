// app/api/sales/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // يتم حذف المبيعة من قاعدة البيانات
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting sale:', error);
        return NextResponse.json(
            { error: 'Failed to delete sale' },
            { status: 500 }
        );
    }
}
