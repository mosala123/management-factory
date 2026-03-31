// app/api/sales/route.ts
import { NextRequest, NextResponse } from 'next/server';

// بيانات وهمية للمبيعات
let mockSales = [
    {
        id: '1',
        product_id: '1',
        product_name: 'تيشيرت أبيض',
        quantity: 5,
        unit_price: 100,
        total_price: 500,
        profit: 300,
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        product_id: '2',
        product_name: 'جينز أزرق',
        quantity: 2,
        unit_price: 250,
        total_price: 500,
        profit: 300,
        created_at: new Date().toISOString(),
    },
];

export async function GET() {
    return NextResponse.json(mockSales);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newSale = {
            id: Date.now().toString(),
            ...body,
            created_at: new Date().toISOString(),
        };

        mockSales.push(newSale);
        return NextResponse.json(newSale, { status: 201 });
    } catch (error) {
        console.error('Error creating sale:', error);
        return NextResponse.json(
            { error: 'Failed to create sale' },
            { status: 500 }
        );
    }
}
