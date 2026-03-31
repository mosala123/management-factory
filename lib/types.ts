// lib/types.ts
// أنواع البيانات المبسطة لنظام إدارة المصنع

export interface Product {
    id: string;
    name: string;
    price: number;
    quantity: number;
    min_stock: number;
    cost?: number;
    created_at: string;
    updated_at: string;
}

export interface Sale {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    profit: number;
    created_at: string;
}

export interface Stats {
    total_products: number;
    low_stock_count: number;
    total_inventory_value: number;
    total_profit: number;
    total_sales: number;
}

export interface User {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    last_sign_in?: string;
    created_at: string;
}
