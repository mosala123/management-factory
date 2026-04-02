export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string | { code: string; message: string };
    message?: string;
    success: boolean;
}

export interface UpdateProductRequest {
    name?: string;
    slug?: string;
    description?: string;
    summary?: string;
    price?: number;
    quantity?: number;
    min_stock?: number;
    category?: string;
    hero_image?: string;
    gallery?: string[];
    specs?: string[];
    tags?: string[];
    badge?: string | null;
    in_stock?: boolean;
}

export interface CreateProductRequest {
    name: string;
    slug?: string;
    description?: string;
    summary?: string;
    category: string;
    price: number;
    quantity?: number;
    min_stock?: number;
    sku?: string;
    hero_image: string;
    gallery?: string[];
    specs?: string[];
    tags?: string[];
    badge?: string | null;
    in_stock?: boolean;
}
