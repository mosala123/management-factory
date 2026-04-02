'use client'

// app/dashboard/layout.tsx
// ─── إصلاحات مهمة ─────────────────────────────────────────────────────────────
// 1. استخدام singleton createClient → instance واحد فقط طول عمر الـ app
// 2. Promise.allSettled بدل await متسلسل → لا race condition على DB queries
// 3. حذف أي session check مكرر — السيرفر في page.tsx بيعمل ده

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { buildInventoryReport, type ProductLike } from '@/lib/reporting'
import {
  ROLE_LABELS,
  hasPermission,
  resolveUserRole,
  type UserRole,
} from '@/lib/auth-role'

// ─── أنواع ────────────────────────────────────────────────────────────────────
type NavItem = {
  href: string
  label: string
  permission:
    | 'canViewDashboard'
    | 'canViewInventory'
    | 'canViewProducts'
    | 'canViewProduction'
    | 'canViewReports'
    | 'canViewSettings'
    | 'canEditSettings'
  badge?: number
  icon: ReactNode
}

// ─── أيقونات SVG ──────────────────────────────────────────────────────────────
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
  expand: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  ),
  bell: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
}

// ─── مكوّن قائمة التنقل ───────────────────────────────────────────────────────
function SidebarNav({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: NavItem[]
  pathname: string
  collapsed: boolean
  onNavigate: () => void
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={`group flex items-center rounded-2xl transition-all duration-200 ${
              collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'
            } ${
              isActive
                ? 'bg-white/15 text-white shadow-inner shadow-white/5'
                : 'text-white/60 hover:bg-white/8 hover:text-white'
            }`}
          >
            <span
              className={`transition-transform group-hover:scale-110 ${
                isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
              }`}
            >
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1 text-sm font-semibold">{item.label}</span>
                {!!item.badge && item.badge > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-black text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </>
            )}
            {/* Badge صغير في وضع collapsed */}
            {collapsed && !!item.badge && item.badge > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// ─── شاشة التحميل ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="space-y-5 text-center">
        {/* أيقونة مع gradient */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-dark shadow-xl shadow-primary/30">
          <span className="text-2xl font-black text-white">م</span>
        </div>
        {/* spinner */}
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-secondary">جاري تجهيز لوحة التحكم</p>
          <p className="text-xs text-gray-400">التحقق من صلاحياتك...</p>
        </div>
      </div>
    </div>
  )
}

// ─── Layout الرئيسي ───────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // ✅ singleton — نفس الـ instance في كل render
  const supabase = useMemo(() => createClient(), [])

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>('customer')
  const [adminName, setAdminName] = useState('مدير المصنع')
  const [products, setProducts] = useState<ProductLike[]>([])

  // ─── جلب المنتجات ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*')
    if (data) setProducts(data as ProductLike[])
  }, [supabase])

  // ─── التحقق من الجلسة وتحميل بيانات المستخدم ──────────────────────────────
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        // خطوة 1: التحقق من المستخدم
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (!isMounted) return

        if (authError || !user) {
          router.push('/admin/login')
          return
        }

        // ✅ خطوة 2: جلب بيانات الـ profile والـ role بشكل متوازي
        // Promise.allSettled → لا يوقف التنفيذ لو query واحد فشل
        const [profileResult, roleResult] = await Promise.allSettled([
          supabase
            .from('profiles')
            .select('role, name')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('user_roles')
            .select('role, name, is_active')
            .eq('user_id', user.id)
            .maybeSingle(),
        ])

        if (!isMounted) return

        const profile =
          profileResult.status === 'fulfilled' ? profileResult.value.data : null
        const userRoleData =
          roleResult.status === 'fulfilled' ? roleResult.value.data : null

        // خطوة 3: تحديد الدور
        const resolvedRole = resolveUserRole(
          user.email,
          userRoleData?.role || profile?.role
        )

        // خطوة 4: التحقق من الصلاحية
        if (!hasPermission(resolvedRole, 'canViewDashboard')) {
          router.push('/admin/login')
          return
        }

        // خطوة 5: التحقق من حالة الحساب
        if (userRoleData && userRoleData.is_active === false) {
          toast.error('حسابك موقوف. تواصل مع المدير.')
          await supabase.auth.signOut()
          router.push('/admin/login')
          return
        }

        // خطوة 6: تحديث الـ state
        setUserRole(resolvedRole)
        setAdminName(userRoleData?.name || profile?.name || 'مدير المصنع')
        setIsLoggedIn(true)

        // خطوة 7: جلب المنتجات
        await fetchProducts()
      } catch (error) {
        console.error('Dashboard auth bootstrap failed:', error)
        if (!isMounted) return
        toast.error('تعذر تحميل بيانات الحساب.')
        await supabase.auth.signOut()
        router.push('/admin/login')
      }
    }

    void checkAuth()

    return () => {
      isMounted = false
    }
  }, [fetchProducts, router, supabase])

  // ─── تحديث تلقائي للمنتجات كل 30 ثانية ───────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return
    const interval = window.setInterval(() => {
      void fetchProducts()
    }, 30_000)
    return () => window.clearInterval(interval)
  }, [fetchProducts, isLoggedIn])

  // ─── بيانات مشتقة ─────────────────────────────────────────────────────────
  const report = useMemo(() => buildInventoryReport(products), [products])

  const navItems = useMemo<NavItem[]>(
    () =>
      (
        [
          {
            href: '/dashboard',
            label: 'الرئيسية',
            permission: 'canViewDashboard' as const,
            badge: 0,
            icon: icons.dashboard,
          },
          {
            href: '/dashboard/inventory',
            label: 'المخزون',
            permission: 'canViewInventory' as const,
            badge: report.summary.needAction,
            icon: icons.inventory,
          },
          {
            href: '/dashboard/products',
            label: 'المنتجات',
            permission: 'canViewProducts' as const,
            badge: 0,
            icon: icons.products,
          },
          {
            href: '/dashboard/production',
            label: 'الإنتاج',
            permission: 'canViewProduction' as const,
            badge: report.summary.critical + report.summary.outOfStock,
            icon: icons.production,
          },
          {
            href: '/dashboard/reports',
            label: 'التقارير',
            permission: 'canViewReports' as const,
            badge: 0,
            icon: icons.reports,
          },
          {
            href: '/dashboard/charts',
            label: 'الرسوم البيانية',
            permission: 'canViewReports' as const,
            badge: 0,
            icon: icons.charts,
          },
          {
            href: '/dashboard/settings',
            label: 'الإعدادات',
            permission: 'canViewSettings' as const,
            badge: 0,
            icon: icons.settings,
          },
        ] as const
      ).filter((item) => hasPermission(userRole, item.permission)),
    [report.summary.critical, report.summary.needAction, report.summary.outOfStock, userRole]
  )

  const currentLabel =
    navItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== '/dashboard' && pathname.startsWith(item.href))
    )?.label ?? 'الرئيسية'

  const initials = adminName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const roleLabel = ROLE_LABELS[userRole] ?? 'مستخدم'

  const totalAlerts = report.summary.needAction

  // ─── تسجيل الخروج ─────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('تم تسجيل الخروج بنجاح')
    router.push('/admin/login')
  }

  const handleNavigate = () => setIsMobileOpen(false)

  // ─── شاشة التحميل ─────────────────────────────────────────────────────────
  if (!isLoggedIn) return <LoadingScreen />

  // ─── الـ Layout ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f9]" dir="rtl">

      {/* Overlay الموبايل */}
      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-label="إغلاق القائمة"
        />
      )}

      {/* ══════════════════════════════════
          الشريط الجانبي
      ══════════════════════════════════ */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transition-all duration-300 lg:static lg:z-auto ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } ${isSidebarOpen ? 'w-72' : 'w-20'}`}
      >
        {/* ─ رأس الشريط ─ */}
        <div
          className={`flex items-center border-b border-white/10 ${
            isSidebarOpen ? 'gap-3 px-5 py-4' : 'justify-center p-4'
          }`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30">
            <span className="text-lg font-black text-white">م</span>
          </div>
          {isSidebarOpen && (
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">مصنع الإبداع</p>
              <p className="text-[11px] text-white/40">لوحة تشغيل مبسطة وواضحة</p>
            </div>
          )}
        </div>

        {/* ─ قائمة التنقل ─ */}
        <SidebarNav
          items={navItems}
          pathname={pathname}
          collapsed={!isSidebarOpen}
          onNavigate={handleNavigate}
        />

        {/* ─ أسفل الشريط ─ */}
        <div className="space-y-2 border-t border-white/10 p-3">
          {/* بطاقة المستخدم */}
          {isSidebarOpen && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
              <p className="text-xs font-bold text-white">{adminName}</p>
              <p className="text-[11px] text-white/50">{roleLabel}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    totalAlerts > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                <p className="text-[11px] text-white/40">
                  {totalAlerts > 0
                    ? `${totalAlerts} تنبيه يحتاج متابعة`
                    : 'الوضع التشغيلي مستقر'}
                </p>
              </div>
            </div>
          )}

          {/* زر تسجيل الخروج */}
          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-2xl text-white/60 transition hover:bg-red-500/10 hover:text-red-300 ${
              isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'
            }`}
          >
            {icons.logout}
            {isSidebarOpen && (
              <span className="text-sm font-semibold">تسجيل الخروج</span>
            )}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════
          المنطقة الرئيسية
      ══════════════════════════════════ */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* ─ شريط الهيدر ─ */}
        <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">

            {/* يسار: زر الموبايل + اسم الصفحة */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="rounded-2xl p-2 text-gray-500 transition hover:bg-gray-100 lg:hidden"
                aria-label="فتح القائمة"
              >
                {icons.menu}
              </button>

              {/* Breadcrumb */}
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-400">لوحة التحكم</p>
                <p className="truncate text-sm font-black text-secondary">{currentLabel}</p>
              </div>
            </div>

            {/* يمين: مؤشرات + أدوات */}
            <div className="flex items-center gap-2 md:gap-3">

              {/* مؤشر جاهزية المخزون */}
              <div className="hidden items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 md:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[11px] font-bold text-emerald-700">
                  جاهزية المخزون:
                </p>
                <p className="text-sm font-black text-emerald-700">
                  {report.summary.readinessRate}%
                </p>
              </div>

              {/* تنبيهات */}
              {totalAlerts > 0 && (
                <Link
                  href="/dashboard/inventory"
                  className="relative hidden rounded-2xl border border-amber-100 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100 md:block"
                  title={`${totalAlerts} تنبيه`}
                >
                  {icons.bell}
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                    {totalAlerts > 9 ? '9+' : totalAlerts}
                  </span>
                </Link>
              )}

              {/* زر تصغير / توسيع القائمة */}
              <button
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="hidden items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 lg:flex"
                title={isSidebarOpen ? 'تصغير القائمة' : 'توسيع القائمة'}
              >
                {isSidebarOpen ? icons.collapse : icons.expand}
                <span className="hidden xl:block">
                  {isSidebarOpen ? 'تصغير' : 'توسيع'}
                </span>
              </button>

              {/* بطاقة المستخدم */}
              <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-2 py-1.5 shadow-sm">
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

        {/* ─ المحتوى ─ */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}