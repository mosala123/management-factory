'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { buildInventoryReport, type ProductLike } from '@/lib/reporting';
import {
  ROLE_LABELS,
  hasPermission,
  resolveUserRole,
  type UserRole,
} from '@/lib/auth-role';

type NavItem = {
  href: string;
  label: string;
  permission:
    | 'canViewDashboard'
    | 'canViewInventory'
    | 'canViewProducts'
    | 'canViewProduction'
    | 'canViewReports'
    | 'canViewSettings'
    | 'canEditSettings';
  badge?: number;
  icon: ReactNode;
};

const icons = {
  dashboard: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2 7-7 7 7M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6" />
    </svg>
  ),
  products: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  inventory: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  production: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  reports: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6M13 17V7M17 17v-3M6 21h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2Z" />
    </svg>
  ),
  charts: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l3-4 3 2 4-6" />
    </svg>
  ),
  settings: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  menu: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  collapse: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  ),
};

function SidebarNav({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={`group flex items-center rounded-2xl transition-all ${
              collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'
            } ${
              isActive
                ? 'bg-white/14 text-white shadow-inner'
                : 'text-white/65 hover:bg-white/8 hover:text-white'
            }`}
          >
            <span className={isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}>
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1 text-sm font-semibold">{item.label}</span>
                {!!item.badge && (
                  <span className="min-w-[22px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[11px] font-black text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('customer');
  const [adminName, setAdminName] = useState('مدير المصنع');
  const [products, setProducts] = useState<ProductLike[]>([]);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) {
      setProducts(data as ProductLike[]);
    }
  }, [supabase]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .single();

      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role, name, is_active')
        .eq('user_id', user.id)
        .single();

      const resolvedRole = resolveUserRole(
        user.email,
        userRoleData?.role || profile?.role
      );

      if (!hasPermission(resolvedRole, 'canViewDashboard')) {
        router.push('/admin/login');
        return;
      }

      if (userRoleData && !userRoleData.is_active) {
        toast.error('حسابك موقوف، تواصل مع المدير');
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setUserRole(resolvedRole);
      setAdminName(userRoleData?.name || profile?.name || 'مدير المصنع');
      setIsLoggedIn(true);
      await fetchProducts();
    };

    void checkAuth();
  }, [fetchProducts, router, supabase]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = window.setInterval(() => {
      void fetchProducts();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchProducts, isLoggedIn]);

  const report = useMemo(() => buildInventoryReport(products), [products]);

  // تم إصلاح الخطأ هنا بإضافة as const
  const navItems = useMemo<NavItem[]>(
    () =>
      (
        [
          {
            href: '/dashboard',
            label: 'الرئيسية',
            permission: 'canViewDashboard',
            badge: 0,
            icon: icons.dashboard,
          },
          {
            href: '/dashboard/inventory',
            label: 'المخزون',
            permission: 'canViewInventory',
            badge: report.summary.needAction,
            icon: icons.inventory,
          },
          {
            href: '/dashboard/products',
            label: 'المنتجات',
            permission: 'canViewProducts',
            badge: 0,
            icon: icons.products,
          },
          {
            href: '/dashboard/production',
            label: 'الإنتاج',
            permission: 'canViewProduction',
            badge: report.summary.critical + report.summary.outOfStock,
            icon: icons.production,
          },
          {
            href: '/dashboard/reports',
            label: 'التقارير',
            permission: 'canViewReports',
            badge: 0,
            icon: icons.reports,
          },
          {
            href: '/dashboard/charts',
            label: 'الرسوم البيانية',
            permission: 'canViewReports',
            badge: 0,
            icon: icons.charts,
          },
          {
            href: '/dashboard/users',
            label: 'المستخدمين',
            permission: 'canEditSettings',
            badge: 0,
            icon: icons.dashboard,
          },
          {
            href: '/dashboard/settings',
            label: 'الإعدادات',
            permission: 'canViewSettings',
            badge: 0,
            icon: icons.settings,
          },
        ] as const
      ).filter(
        (item) =>
          item.href !== '/dashboard/users' && hasPermission(userRole, item.permission)
      ),
    [report.summary.critical, report.summary.needAction, report.summary.outOfStock, userRole]
  );

  const currentLabel =
    navItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== '/dashboard' && pathname.startsWith(item.href))
    )?.label || 'الرئيسية';

  const initials = adminName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const roleLabel = ROLE_LABELS[userRole] || 'مستخدم';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    toast.success('تم تسجيل الخروج');
    router.push('/admin/login');
  };

  const handleNavigate = () => {
    setIsMobileOpen(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg">
            <span className="text-2xl font-black text-white">م</span>
          </div>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">جاري تجهيز لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-muted,#f7f2eb)]">
      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label="إغلاق القائمة"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full flex-col bg-gradient-to-b from-[var(--secondary)] to-[var(--secondary-dark)] transition-all duration-300 lg:static lg:z-auto ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } ${isSidebarOpen ? 'w-72' : 'w-20'} `}
      >
        <div className={`flex items-center border-b border-white/10 ${isSidebarOpen ? 'gap-3 px-5 py-4' : 'justify-center p-4'}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-md">
            <span className="text-lg font-black text-white">م</span>
          </div>
          {isSidebarOpen && (
            <div>
              <p className="text-sm font-black text-white">مصنع الإبداع</p>
              <p className="text-xs text-white/50">لوحة تشغيل مبسطة وواضحة</p>
            </div>
          )}
        </div>

        <SidebarNav
          items={navItems}
          pathname={pathname}
          collapsed={!isSidebarOpen}
          onNavigate={handleNavigate}
        />

        <div className="space-y-2 border-t border-white/10 p-3">
          {isSidebarOpen && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
              <p className="text-xs font-bold text-white">{adminName}</p>
              <p className="text-[11px] text-white/55">{roleLabel}</p>
              <p className="mt-2 text-[11px] text-white/40">
                {report.summary.needAction > 0
                  ? `${report.summary.needAction} تنبيه يحتاج متابعة`
                  : 'الوضع التشغيلي مستقر'}
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-2xl text-white/70 transition hover:bg-red-500/10 hover:text-red-300 ${
              isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'
            }`}
          >
            {icons.logout}
            {isSidebarOpen && <span className="text-sm font-semibold">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="rounded-2xl p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
                aria-label="فتح القائمة"
              >
                {icons.menu}
              </button>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">لوحة التحكم</p>
                <p className="truncate text-sm font-black text-secondary">{currentLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right md:block">
                <p className="text-[11px] font-bold text-emerald-700">جاهزية المخزون</p>
                <p className="text-sm font-black text-emerald-700">{report.summary.readinessRate}%</p>
              </div>

              <button
                onClick={() => setIsSidebarOpen((current) => !current)}
                className="hidden items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 lg:flex"
              >
                {icons.collapse}
                <span>{isSidebarOpen ? 'تصغير القائمة' : 'توسيع القائمة'}</span>
              </button>

              <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-2 py-1.5">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-bold text-secondary">{adminName}</p>
                  <p className="text-[11px] text-gray-400">{roleLabel}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-xs font-black text-white shadow-md">
                  {initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}