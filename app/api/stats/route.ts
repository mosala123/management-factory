// app/api/stats/route.ts
// API لجلب الإحصائيات

import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // البيانات الوهمية (يتم استبدالها بـ Supabase لاحقاً)
        const stats = {
            total_products: 15,
            low_stock_count: 3,
            total_inventory_value: 45000,
            total_profit: 120000,
            total_sales: 24,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
