import { ProductImage, FabricSpec, ColorVariant, SizeVariant } from "./database";

// ═══════════════════════════════════════════════════════════════════════════
// Generic API Response Type
// ═══════════════════════════════════════════════════════════════════════════
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string | { code: string; message: string };
  message?: string;
  success: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Enhanced Product Request Types - لدعم الصور المتعددة والتفاصيل الموسعة
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateProductRequest {
  // ─── المعلومات الأساسية (مطلوبة) ───────────────────────────────────
  name: string;
  category: string;
  price: number;
  hero_image: string;
  
  // ─── المعلومات الأساسية (اختيارية) ─────────────────────────────────
  slug?: string;
  summary?: string;
  description?: string;
  sku?: string;
  
  // ─── الأسعار الإضافية ───────────────────────────────────────────────
  price_wholesale?: number;
  currency?: string;
  
  // ─── الصور المتعددة ─────────────────────────────────────────────────
  gallery?: string[]; // مصفوفة روابط الصور (للتوافقية)
  images?: ProductImage[]; // الصور المحسّنة مع المعلومات
  
  // ─── مواصفات القماش والخامات ───────────────────────────────────────
  fabric_spec?: FabricSpec;
  care_instructions?: string[];
  
  // ─── المتغيرات والألوان والأحجام ───────────────────────────────────
  colors?: ColorVariant[];
  sizes?: SizeVariant[];
  
  // ─── المخزون ───────────────────────────────────────────────────────
  quantity?: number;
  min_stock?: number;
  in_stock?: boolean;
  
  // ─── التصنيفات والعلامات ───────────────────────────────────────────
  specs?: string[];
  tags?: string[];
  badge?: string | null;
  
  // ─── معلومات إضافية ───────────────────────────────────────────────
  manufacturer?: string;
  origin?: string;
  barcode?: string;
}

export interface UpdateProductRequest {
  // ─── المعلومات الأساسية ───────────────────────────────────────────
  name?: string;
  slug?: string;
  category?: string;
  summary?: string;
  description?: string;
  
  // ─── الأسعار ───────────────────────────────────────────────────────
  price?: number;
  price_wholesale?: number;
  currency?: string;
  
  // ─── الصور المتعددة ────────────────────────────────────────────────
  hero_image?: string;
  gallery?: string[];
  images?: ProductImage[];
  
  // ─── مواصفات القماش والخامات ───────────────────────────────────────
  fabric_spec?: FabricSpec;
  care_instructions?: string[];
  
  // ─── المتغيرات والألوان والأحجام ───────────────────────────────────
  colors?: ColorVariant[];
  sizes?: SizeVariant[];
  
  // ─── المخزون ───────────────────────────────────────────────────────
  quantity?: number;
  min_stock?: number;
  in_stock?: boolean;
  
  // ─── التصنيفات والعلامات ───────────────────────────────────────────
  specs?: string[];
  tags?: string[];
  badge?: string | null;
  
  // ─── معلومات إضافية ───────────────────────────────────────────────
  sku?: string;
  manufacturer?: string;
  origin?: string;
  barcode?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Product Response Type - نوع الاستجابة عند جلب المنتج
// ═══════════════════════════════════════════════════════════════════════════
export interface ProductResponse {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  price_wholesale?: number;
  currency?: string;
  hero_image: string;
  gallery: string[];
  images?: ProductImage[];
  summary: string;
  description: string;
  fabric_spec?: FabricSpec;
  care_instructions?: string[];
  colors?: ColorVariant[];
  sizes?: SizeVariant[];
  specs: string[];
  tags: string[];
  badge?: string;
  quantity: number;
  min_stock: number;
  in_stock: boolean;
  sku?: string;
  manufacturer?: string;
  origin?: string;
  barcode?: string;
  created_at: string;
  updated_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Pagination Types
// ═══════════════════════════════════════════════════════════════════════════
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// ═══════════════════════════════════════════════════════════════════════════
// Batch Operations
// ═══════════════════════════════════════════════════════════════════════════
export interface BulkUpdateRequest {
  productIds: string[];
  updates: Partial<UpdateProductRequest>;
}

export interface BulkDeleteRequest {
  productIds: string[];
}
