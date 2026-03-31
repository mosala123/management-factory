export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string | { code: string; message: string };
    message?: string;
    success: boolean;
}

export interface UpdateProductRequest {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    category?: string;
    image_url?: string;
}

// ✅ أضف الـ interface دي الجديدة
export interface CreateProductRequest {
    name: string;
    slug: string;
    description: string;
    category: string;
    price: number;
    quantity: number;
    min_stock: number;
    sku: string;
    cost?: number;
    images?: string[];
    summary?: string;
    specs?: Record<string, unknown>;
    tags?: string[];
}