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