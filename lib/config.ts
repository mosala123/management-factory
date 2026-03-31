// lib/config.ts
/**
 * Application Configuration
 * تكوين التطبيق - جميع الثوابت والإعدادات
 */

export const APP_NAME = 'My Clothing Factory';
export const APP_DESCRIPTION = 'نظام متكامل لإدارة مصنع الملابس';
export const APP_VERSION = '1.0.0';

/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Pagination Defaults
 */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
} as const;

/**
 * Stock Configuration
 */
export const STOCK = {
    LOW_STOCK_THRESHOLD: 50, // الحد الأدنى للمخزون المنخفض
    CRITICAL_STOCK_THRESHOLD: 10, // الحد الحرج
    MIN_DEFAULT: 10, // الحد الأدنى الافتراضي للمنتج الجديد
} as const;

/**
 * Order Configuration
 */
export const ORDER = {
    TAX_RATE: 0.15, // معدل الضريبة 15%
    SHIPPING_COST: 50, // تكلفة الشحن الثابتة
    STATUSES: ['pending', 'in_production', 'ready_to_ship', 'shipped', 'delivered', 'cancelled'] as const,
    PAYMENT_STATUSES: ['unpaid', 'paid', 'refunded'] as const,
} as const;

/**
 * Production Configuration
 */
export const PRODUCTION = {
    STATUSES: ['planned', 'in_progress', 'completed', 'quality_check', 'shipped'] as const,
} as const;

/**
 * User Roles & Permissions
 */
export const ROLES = {
    ADMIN: 'admin',
    PRODUCT_SUPERVISOR: 'product_supervisor',
    INVENTORY_SUPERVISOR: 'inventory_supervisor',
    VIEWER: 'viewer',
    CUSTOMER: 'customer',
} as const;

export const ROLE_LABELS: Record<typeof ROLES[keyof typeof ROLES], string> = {
    admin: 'مدير النظام',
    product_supervisor: 'مشرف المنتجات',
    inventory_supervisor: 'مشرف المخزون',
    viewer: 'عارض',
    customer: 'عميل',
} as const;

/**
 * Categories
 */
export const CATEGORIES = {
    MEN: 'men',
    WOMEN: 'women',
    KIDS: 'kids',
    UNIFORM: 'uniform',
} as const;

export const CATEGORY_LABELS: Record<typeof CATEGORIES[keyof typeof CATEGORIES], string> = {
    men: 'رجالي',
    women: 'حريمي',
    kids: 'أطفال',
    uniform: 'يونيفورم',
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'أنت لست مصرحاً بهذه العملية',
    FORBIDDEN: 'لا تملك صلاحيات كافية',
    NOT_FOUND: 'الموارد غير موجودة',
    VALIDATION_ERROR: 'خطأ في صحة البيانات',
    SERVER_ERROR: 'حدث خطأ في الخادم',
    NETWORK_ERROR: 'خطأ في الاتصال',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
    CREATED: 'تم الإنشاء بنجاح',
    UPDATED: 'تم التحديث بنجاح',
    DELETED: 'تم الحذف بنجاح',
    SAVED: 'تم الحفظ بنجاح',
} as const;

/**
 * Toast Durations (ms)
 */
export const TOAST_DURATION = {
    SHORT: 2000,
    NORMAL: 3000,
    LONG: 5000,
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
    MIN_NAME_LENGTH: 3,
    MAX_NAME_LENGTH: 100,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 1000,
    MIN_PASSWORD_LENGTH: 8,
    SKU_PATTERN: /^[A-Z0-9\-_]{3,20}$/,
    SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_PATTERN: /^[\d\s\-\+\(\)]{10,}$/,
} as const;

/**
 * Routes (Protected Routes)
 */
export const PROTECTED_ROUTES = ['/admin', '/dashboard'] as const;

export const PUBLIC_ROUTES = ['/login', '/'] as const;

/**
 * API Response Codes
 */
export const API_CODES = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    SERVER_ERROR: 500,
} as const;

/**
 * Cache Duration (seconds)
 */
export const CACHE_DURATION = {
    SHORT: 60,
    NORMAL: 300,
    LONG: 900,
} as const;

/**
 * File Upload
 */
export const FILE_UPLOAD = {
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;
