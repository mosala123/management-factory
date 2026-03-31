// lib/supabase/auth-role.ts

export const ADMIN_EMAIL = "admin@ibdaa.com";

// أنواع الأدوار
export type UserRole = "admin" | "inventory_supervisor" | "product_supervisor" | "viewer" | "customer";

// أسماء الأدوار بالعربي
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "مدير المصنع",
  inventory_supervisor: "مشرف مخزون",
  product_supervisor: "مشرف منتجات",
  viewer: "مشرف قراءة",
  customer: "عميل",
};

// صلاحيات كل دور
export const ROLE_PERMISSIONS: Record<UserRole, {
  canViewDashboard: boolean;
  canViewProducts: boolean;
  canEditProducts: boolean;
  canAddProducts: boolean;
  canDeleteProducts: boolean;
  canViewInventory: boolean;
  canEditInventory: boolean;
  canViewProduction: boolean;
  canEditProduction: boolean;
  canViewSettings: boolean;
  canEditSettings: boolean;
  canViewReports: boolean;
}> = {
  admin: {
    canViewDashboard: true,
    canViewProducts: true,
    canEditProducts: true,
    canAddProducts: true,
    canDeleteProducts: true,
    canViewInventory: true,
    canEditInventory: true,
    canViewProduction: true,
    canEditProduction: true,
    canViewSettings: true,
    canEditSettings: true,
    canViewReports: true,
  },
  inventory_supervisor: {
    canViewDashboard: true,
    canViewProducts: true,
    canEditProducts: false,
    canAddProducts: false,
    canDeleteProducts: false,
    canViewInventory: true,
    canEditInventory: true,
    canViewProduction: true,
    canEditProduction: false,
    canViewSettings: false,
    canEditSettings: false,
    canViewReports: true,
  },
  product_supervisor: {
    canViewDashboard: true,
    canViewProducts: true,
    canEditProducts: true,
    canAddProducts: true,
    canDeleteProducts: false,
    canViewInventory: true,
    canEditInventory: false,
    canViewProduction: true,
    canEditProduction: false,
    canViewSettings: false,
    canEditSettings: false,
    canViewReports: false,
  },
  viewer: {
    canViewDashboard: true,
    canViewProducts: true,
    canEditProducts: false,
    canAddProducts: false,
    canDeleteProducts: false,
    canViewInventory: true,
    canEditInventory: false,
    canViewProduction: true,
    canEditProduction: false,
    canViewSettings: false,
    canEditSettings: false,
    canViewReports: true,
  },
  customer: {
    canViewDashboard: false,
    canViewProducts: false,
    canEditProducts: false,
    canAddProducts: false,
    canDeleteProducts: false,
    canViewInventory: false,
    canEditInventory: false,
    canViewProduction: false,
    canEditProduction: false,
    canViewSettings: false,
    canEditSettings: false,
    canViewReports: false,
  },
};

export const normalizeEmail = (email?: string | null) =>
  email?.trim().toLowerCase() ?? "";

export const isAdminEmail = (email?: string | null) =>
  normalizeEmail(email) === ADMIN_EMAIL;

export const resolveUserRole = (
  email?: string | null,
  profileRole?: string | null
): UserRole => {
  if (isAdminEmail(email)) return "admin";
  if (profileRole && profileRole in ROLE_PERMISSIONS) return profileRole as UserRole;
  return "customer";
};

export const hasPermission = (
  role: UserRole,
  permission: keyof typeof ROLE_PERMISSIONS["admin"]
): boolean => {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
};