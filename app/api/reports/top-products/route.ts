// app/api/reports/top-products/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const topProducts = [
            {
                name: 'تيشيرت أبيض',
                sold: 25,
                profit: 5000,
            },
            {
                name: 'جينز أزرق',
                sold: 12,
                profit: 3600,
            },
            {
                name: 'حقيبة يد',
                sold: 8,
                profit: 960,
            },
        ];

        return NextResponse.json(topProducts);
    } catch (error) {
        console.error('Error fetching top products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch top products' },
            { status: 500 }
        );
    }
}
