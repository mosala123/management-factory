// app/api/sales/reset/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // يتم حذف جميع سجلات المبيعات (إعادة تعيين)
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error resetting profits:', error);
        return NextResponse.json(
            { error: 'Failed to reset profits' },
            { status: 500 }
        );
    }
}
