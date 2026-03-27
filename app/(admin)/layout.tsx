// app/(admin)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { resolveUserRole } from "@/lib/auth-role";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

// ─── أيقونات SVG ──────────────────────────────────────────────────────────────
const Icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
    </svg>
  ),
  orders: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  products: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  messages: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  clients: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  bell: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  chevronLeft: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// ─── Badge للأرقام ────────────────────────────────────────────────────────────
const NotifBadge = ({ count, active }: { count: number; active: boolean }) => {
  if (!count || count <= 0) return null;
  return (
    <span
      className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center tabular-nums leading-none transition-all ${
        active
          ? "bg-white text-primary shadow-sm"
          : "bg-red-500 text-white shadow-[0_2px_6px_rgba(239,68,68,0.5)]"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();

  const [isSidebarOpen,     setIsSidebarOpen]     = useState(true);
  const [isMobileOpen,      setIsMobileOpen]       = useState(false);
  const [isLoggedIn,        setIsLoggedIn]         = useState(false);
  const [isAdmin,           setIsAdmin]            = useState(false);
  const [adminName,         setAdminName]          = useState("مدير النظام");
  const [showNotifications, setShowNotifications]  = useState(false);
  const [notifications, setNotifications] = useState({
    pendingOrders:      0,
    newMessages:        0,
    totalNotifications: 0,
  });

  const notifRef = useRef<HTMLDivElement>(null);

  // ── إغلاق الـ dropdown لو ضغط برا ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── إغلاق الموبايل sidebar عند تغيير الصفحة ───────────────────────────────
  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  // ── التحقق من الصلاحيات ────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .single();

      const userRole = resolveUserRole(user.email, profile?.role);
      if (userRole !== "admin") { router.push("/"); return; }

      setIsLoggedIn(true);
      setIsAdmin(true);
      if (profile?.name) setAdminName(profile.name);
    };
    checkAuth();
  }, [router, supabase]);

  // ── جلب الإشعارات ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchNotifications = async () => {
      const [{ count: pendingCount }, { count: messagesCount }] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "new"),
      ]);
      setNotifications({
        pendingOrders:      pendingCount  || 0,
        newMessages:        messagesCount || 0,
        totalNotifications: (pendingCount || 0) + (messagesCount || 0),
      });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn, supabase]);

  // ── روابط الـ sidebar ───────────────────────────────────────────────────────
  const adminLinks = [
    { href: "/dashboard",          label: "الرئيسية",  icon: Icons.dashboard, badge: 0 },
    { href: "/dashboard/orders",   label: "الطلبات",   icon: Icons.orders,    badge: notifications.pendingOrders },
    { href: "/dashboard/products", label: "المنتجات",  icon: Icons.products,  badge: 0 },
    { href: "/dashboard/messages", label: "الرسائل",   icon: Icons.messages,  badge: notifications.newMessages },
    { href: "/dashboard/clients",  label: "العملاء",   icon: Icons.clients,   badge: 0 },
    { href: "/dashboard/settings", label: "الإعدادات", icon: Icons.settings,  badge: 0 },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    toast.success("تم تسجيل الخروج");
    router.push("/login");
  };

  const currentLabel = adminLinks.find((l) => l.href === pathname)?.label || "لوحة التحكم";
  const initials = adminName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-2xl">م</span>
          </div>
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // ── مكوّن الـ Sidebar الداخلي ────────────────────────────────────────────────
  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center border-b border-white/8 ${collapsed ? "justify-center p-4" : "gap-3 px-5 py-4"}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md shrink-0">
          <span className="text-white font-black text-lg">م</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-black text-white text-sm leading-tight">مصنع الإبداع</p>
            <p className="text-white/40 text-xs">لوحة التحكم</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          const hasBadge = link.badge > 0;

          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={`relative flex items-center rounded-xl transition-all duration-200 group ${
                collapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5"
              } ${
                isActive
                  ? "bg-white/12 text-white shadow-inner border border-white/10"
                  : "text-white/55 hover:text-white hover:bg-white/8"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-light rounded-full" />
              )}

              <span className={`shrink-0 transition-transform duration-200 ${isActive ? "text-white" : "text-white/55 group-hover:text-white"} ${isActive ? "" : "group-hover:scale-110"}`}>
                {link.icon}
              </span>

              {!collapsed && (
                <>
                  <span className={`flex-1 text-sm font-semibold ${isActive ? "text-white" : ""}`}>
                    {link.label}
                  </span>
                  {hasBadge && <NotifBadge count={link.badge} active={isActive} />}
                </>
              )}

              {/* Collapsed badge dot */}
              {collapsed && hasBadge && (
                <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-secondary-dark" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin Info + Logout */}
      <div className="p-3 border-t border-white/8 space-y-1">
        {/* Admin card */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/8 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0 shadow">
              <span className="text-white text-xs font-black">{initials}</span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{adminName}</p>
              <p className="text-white/40 text-[10px]">مدير النظام</p>
            </div>
            <span className="w-2 h-2 bg-green-400 rounded-full shrink-0 shadow-[0_0_6px_rgba(74,222,128,0.8)]" title="متصل" />
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? "تسجيل الخروج" : undefined}
          className={`flex items-center w-full rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group ${
            collapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5"
          }`}
        >
          <span className="shrink-0 group-hover:scale-110 transition-transform">{Icons.logout}</span>
          {!collapsed && <span className="text-sm font-semibold">تسجيل الخروج</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-muted, #f7f2eb)" }}>

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col relative bg-gradient-to-b shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-64" : "w-[72px]"
        }`}
        style={{ background: "linear-gradient(180deg, var(--secondary) 0%, var(--secondary-dark) 100%)" }}
      >
        <SidebarContent collapsed={!isSidebarOpen} />

        {/* Toggle button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -left-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 transition-all z-20"
        >
          {isSidebarOpen ? Icons.chevronLeft : Icons.chevronRight}
        </button>
      </aside>

      {/* ── Mobile Sidebar Overlay ───────────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-72 z-50 lg:hidden flex flex-col transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "linear-gradient(180deg, var(--secondary) 0%, var(--secondary-dark) 100%)" }}
      >
        <SidebarContent collapsed={false} />
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 shadow-sm shrink-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">

            {/* Left: menu + title */}
            <div className="flex items-center gap-3">
              {/* Mobile menu btn */}
              <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-secondary transition-colors"
              >
                {Icons.menu}
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm hidden sm:block">لوحة التحكم</span>
                {currentLabel !== "لوحة التحكم" && (
                  <>
                    <svg className="w-4 h-4 text-gray-300 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-black text-secondary">{currentLabel}</span>
                  </>
                )}
                {currentLabel === "لوحة التحكم" && (
                  <span className="text-sm font-black text-secondary sm:hidden">لوحة التحكم</span>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 md:gap-3">

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-xl transition-all duration-200 ${
                    showNotifications
                      ? "bg-primary/10 text-primary"
                      : "text-gray-500 hover:bg-gray-100 hover:text-secondary"
                  }`}
                >
                  {Icons.bell}
                  {notifications.totalNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center tabular-nums ring-2 ring-white">
                      {notifications.totalNotifications > 9 ? "9+" : notifications.totalNotifications}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="font-black text-secondary text-sm">الإشعارات</h3>
                      {notifications.totalNotifications > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
                          {notifications.totalNotifications} جديد
                        </span>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {notifications.pendingOrders > 0 && (
                        <Link
                          href="/dashboard/orders"
                          onClick={() => setShowNotifications(false)}
                          className="flex items-center gap-3 px-4 py-3.5 hover:bg-amber-50/60 transition-colors"
                        >
                          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                            {Icons.orders}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 text-sm">طلبات بانتظار المراجعة</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              <span className="font-black text-amber-600 tabular-nums">{notifications.pendingOrders}</span> طلب جديد
                            </p>
                          </div>
                          <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0 animate-pulse" />
                        </Link>
                      )}

                      {notifications.newMessages > 0 && (
                        <Link
                          href="/dashboard/messages"
                          onClick={() => setShowNotifications(false)}
                          className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50/60 transition-colors"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                            {Icons.messages}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 text-sm">رسائل غير مقروءة</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              <span className="font-black text-blue-600 tabular-nums">{notifications.newMessages}</span> رسالة جديدة
                            </p>
                          </div>
                          <span className="w-2 h-2 bg-blue-400 rounded-full shrink-0 animate-pulse" />
                        </Link>
                      )}

                      {notifications.totalNotifications === 0 && (
                        <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                            {Icons.bell}
                          </div>
                          <p className="text-gray-500 text-sm font-medium">لا توجد إشعارات جديدة</p>
                          <p className="text-gray-400 text-xs">كل شيء على ما يرام ✓</p>
                        </div>
                      )}
                    </div>

                    {notifications.totalNotifications > 0 && (
                      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 text-center">
                        <button
                          onClick={() => { setShowNotifications(false); router.push("/dashboard/orders"); }}
                          className="text-primary text-xs font-bold hover:text-primary-dark transition-colors"
                        >
                          عرض جميع الإشعارات ←
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-7 bg-gray-200 hidden sm:block" />

              {/* Admin profile */}
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-black text-secondary leading-tight">{adminName}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">مدير النظام</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md">
                  {initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
