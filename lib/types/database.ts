import { ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// Product Image Type - دعم الصور المتعددة مع معلومات تفصيلية
// ═══════════════════════════════════════════════════════════════════════════
export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  order: number;
  isHero: boolean;
  uploadedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Fabric/Material Specifications - مواصفات القماش والخامات
// ═══════════════════════════════════════════════════════════════════════════
export interface FabricSpec {
  type: string; // نوع القماش (قطن، بوليستر، خليط، إلخ)
  weight: number; // وزن القماش بـ GSM (جرام لكل متر مربع)
  width: number; // عرض القماش بـ سم
  composition: string; // تركيب النسيج (مثال: 100% قطن، 65% بوليستر 35% قطن)
  texture?: string; // نسيج القماش (ناعم، خشن، محبب، إلخ)
  shrinkage?: number; // نسبة الانكماش بـ %
}

// ═══════════════════════════════════════════════════════════════════════════
// Color Variant - متغيرات اللون
// ═══════════════════════════════════════════════════════════════════════════
export interface ColorVariant {
  id: string;
  name: string; // اسم اللون (أحمر، أزرق، إلخ)
  hexCode: string; // رمز اللون HEX (#FF0000)
  imageUrl?: string; // صورة توضح اللون
  stock: number; // المخزون لهذا اللون
}

// ═══════════════════════════════════════════════════════════════════════════
// Size Variant - متغيرات الحجم
// ═══════════════════════════════════════════════════════════════════════════
export interface SizeVariant {
  id: string;
  size: string; // الحجم (XS, S, M, L, XL, XXL أو رقمي)
  stock: number; // المخزون لهذا الحجم
  measurements?: {
    chest?: number; // محيط الصدر
    length?: number; // الطول
    sleeve?: number; // طول الكم
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Product Category Type
// ═══════════════════════════════════════════════════════════════════════════
export type Category = "men" | "women" | "kids" | "uniform" | "fabric" | "accessories";

// ═══════════════════════════════════════════════════════════════════════════
// Enhanced Product Type - نوع المنتج المحسّن
// ═══════════════════════════════════════════════════════════════════════════
export interface Product {
  // ─── المعلومات الأساسية ───────────────────────────────────────────────
  id: string;
  slug: string;
  name: string;
  category: Category;
  
  // ─── الأسعار ───────────────────────────────────────────────────────────
  price: number; // السعر للوحدة/المتر
  priceWholesale?: number; // سعر الجملة
  currency?: string; // العملة (SAR, EGP, إلخ)
  
  // ─── الصور المتعددة ───────────────────────────────────────────────────
  heroImage: string; // الصورة الرئيسية (للتوافقية مع الكود القديم)
  gallery: string[]; // مصفوفة الصور (للتوافقية مع الكود القديم)
  images?: ProductImage[]; // الصور المحسّنة مع المعلومات التفصيلية
  
  // ─── الوصف والتفاصيل ───────────────────────────────────────────────
  summary: string; // ملخص قصير
  description: string; // وصف تفصيلي
  specs: string[]; // المواصفات (للتوافقية مع الكود القديم)
  
  // ─── مواصفات القماش والخامات ───────────────────────────────────────
  fabricSpec?: FabricSpec; // مواصفات القماش
  care?: string[]; // تعليمات العناية (غسيل، كي، إلخ)
  
  // ─── المتغيرات والألوان والأحجام ───────────────────────────────────
  colors?: ColorVariant[]; // الألوان المتاحة
  sizes?: SizeVariant[]; // الأحجام المتاحة
  
  // ─── المخزون ───────────────────────────────────────────────────────
  quantity: number; // الكمية الإجمالية
  minStock: number; // الحد الأدنى للمخزون
  inStock?: boolean; // هل المنتج متوفر
  
  // ─── التصنيفات والعلامات ───────────────────────────────────────────
  tags: string[]; // العلامات (جديد، مخفض، الأكثر مبيعاً، إلخ)
  badge?: string; // شارة خاصة (جديد، مخفض، حصري، إلخ)
  
  // ─── معلومات إضافية ───────────────────────────────────────────────
  sku?: string; // رمز المنتج
  barcode?: string; // الباركود
  manufacturer?: string; // الشركة المصنعة
  origin?: string; // دولة المنشأ
  
  // ─── البيانات الوصفية ───────────────────────────────────────────────
  createdAt?: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Order Types
// ═══════════════════════════════════════════════════════════════════════════
export interface Order {
  id: string;
  userId?: string;
  customer: string;
  productId?: string;
  productName: string;
  status: "قيد التنفيذ" | "جاهز للشحن" | "تم التسليم" | "ملغي";
  quantity: number;
  total: number;
  eta: string;
  notes?: string;
  createdAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Contact Types
// ═══════════════════════════════════════════════════════════════════════════
export interface ContactForm {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  requestType: "sample" | "wholesale" | "uniform" | "custom" | "general";
  message: string;
  status?: "new" | "read" | "replied";
  createdAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// User Types
// ═══════════════════════════════════════════════════════════════════════════
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "customer" | "admin";
  createdAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FAQ Types
// ═══════════════════════════════════════════════════════════════════════════
export interface FAQ {
  question: string;
  answer: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Testimonial Types
// ═══════════════════════════════════════════════════════════════════════════
export interface Testimonial {
  name: string;
  company: string;
  quote: string;
  avatar?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Navigation Types
// ═══════════════════════════════════════════════════════════════════════════
export interface NavLink {
  href: string;
  label: string;
  protected?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Category Types
// ═══════════════════════════════════════════════════════════════════════════
export interface CategoryItem {
  id: string;
  label: string;
  icon?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Admin Navigation Types
// ═══════════════════════════════════════════════════════════════════════════
export interface NavItem {
  href: string;
  label: string;
  permission?: string;
  badge?: number;
  icon?: ReactNode;
}
