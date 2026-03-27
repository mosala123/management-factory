// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { resolveUserRole } from "@/lib/auth-role";
import { createClient } from "@/lib/supabase/client";
import { getCart } from "@/lib/cart";

// ─── الروابط ──────────────────────────────────────────────────────────────────

const publicLinks = [
  { href: "/",         label: "الرئيسية" },
  { href: "/products", label: "المنتجات" },
  { href: "/about",    label: "عن المصنع" },
  { href: "/contact",  label: "اتصل بنا" },
];

const customerLinks = [
  { href: "/orders", label: "طلباتي" },
];

const adminLinks = [
  { href: "/dashboard", label: "لوحة التحكم" },
];

const secondaryLinks = [
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms",   label: "الشروط والأحكام" },
];

const isLinkActive = (href: string, pathname: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
};

// ─── أيقونات SVG ──────────────────────────────────────────────────────────────
const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
  </svg>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────
export function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  // إنشاء instance واحدة فقط من الـ supabase client
  const supabase = useRef(createClient()).current;

  const [isMenuOpen,     setIsMenuOpen]     = useState(false);
  const [isScrolled,     setIsScrolled]     = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoading,      setIsLoading]      = useState(true);
  const [user,           setUser]           = useState<any>(null);
  const [userName,       setUserName]       = useState("");
  const [userRole,       setUserRole]       = useState<string | null>(null);
  const [cartCount,      setCartCount]      = useState(0);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // ── scroll ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── إغلاق الموبايل عند تغيير الصفحة ───────────────────────────────────────
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // ── إغلاق user menu عند الضغط برا ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── جلب بيانات المستخدم (useCallback لتجنب إعادة التعريف) ──────────────────
  const loadUser = useCallback(async (sessionUser: any) => {
    if (!sessionUser) {
      setUser(null);
      setUserRole(null);
      setUserName("");
      setIsLoading(false);
      return;
    }

    setUser(sessionUser);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", sessionUser.id)
        .single();

      setUserRole(resolveUserRole(sessionUser.email, profile?.role ?? null));
      setUserName(profile?.name || sessionUser.email?.split("@")[0] || "مستخدم");
    } catch {
      // لو فشل جلب الـ profile نستخدم email كاحتياط
      setUserRole(resolveUserRole(sessionUser.email, null));
      setUserName(sessionUser.email?.split("@")[0] || "مستخدم");
    }

    setIsLoading(false);
  }, [supabase]);

  // ── مراقبة حالة الـ auth — الطريقة الصحيحة بدون lock conflicts ─────────────
  useEffect(() => {
    // الخطوة 1: جلب الـ session الحالي أولاً (بدون getUser لتجنب network call)
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session?.user ?? null);
    });

    // الخطوة 2: الاستماع لأي تغيير في الـ auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, loadUser]);

  // ── جلب السلة ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadCart = async () => {
      try {
        const { items } = await getCart();
        setCartCount(items.length);
      } catch {
        setCartCount(0);
      }
    };
    loadCart();
  }, [pathname]);

  // ── تسجيل الخروج ────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    setUser(null);
    setUserRole(null);
    setUserName("");
    setIsUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  // ── تحديد الروابط حسب نوع المستخدم ─────────────────────────────────────────
  const navLinks = [
    ...publicLinks,
    ...(user && userRole === "customer" ? customerLinks : []),
    ...(user && userRole === "admin"    ? adminLinks    : []),
  ];

  const showCart = userRole !== "admin";

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "م";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/96 backdrop-blur-md shadow-md border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-18">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <span className="text-white text-lg font-black">م</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-black text-secondary text-sm leading-tight">مصنع الإبداع</p>
              <p className="text-gray-400 text-[10px] leading-tight">للمنتجات الإبداعية</p>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "text-primary bg-primary/8"
                      : "text-gray-600 hover:text-secondary hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Desktop Actions ── */}
          <div className="hidden lg:flex items-center gap-2">

            {/* سلة للعميل وغير المسجل */}
            {showCart && (
              <Link
                href="/cart"
                className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-secondary transition-colors"
              >
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center tabular-nums ring-2 ring-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* لوحة التحكم — زر مباشر للأدمن في الـ navbar */}
            {!isLoading && user && userRole === "admin" && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/8 text-secondary hover:bg-secondary/15 transition-colors text-sm font-bold"
              >
                <DashboardIcon />
                لوحة التحكم
              </Link>
            )}

            {/* Auth: مسجل أو لا */}
            {isLoading ? (
              // skeleton أثناء التحميل
              <div className="w-28 h-9 bg-gray-100 animate-pulse rounded-xl" />
            ) : !user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-primary hover:text-primary transition-all"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-light to-primary-dark text-white text-sm font-bold hover:shadow-[0_4px_16px_rgba(196,122,58,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  إنشاء حساب
                </Link>
              </div>
            ) : (
              /* User Menu */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
                    isUserMenuOpen
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-black">{initials}</span>
                  </div>
                  <span className="text-sm font-bold text-secondary max-w-[100px] truncate">{userName}</span>
                  {userRole === "admin" && (
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      أدمن
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="font-black text-secondary text-sm truncate">{userName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {userRole === "admin" ? "مدير النظام" : "عميل"}
                      </p>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      {userRole === "customer" && (
                        <Link
                          href="/orders"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-secondary transition-colors font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          طلباتي
                        </Link>
                      )}

                      {userRole === "admin" && (
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-colors font-medium"
                        >
                          <DashboardIcon />
                          لوحة التحكم
                        </Link>
                      )}

                      <div className="h-px bg-gray-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                      >
                        <LogoutIcon />
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Mobile: سلة + زر القائمة ── */}
          <div className="flex items-center gap-2 lg:hidden">
            {showCart && (
              <Link
                href="/cart"
                className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center tabular-nums ring-2 ring-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
              aria-label="القائمة"
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* ══════════════════════ Mobile Menu ══════════════════════════ */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-100 animate-fade-in-up">

            {user && (
              <div className="flex items-center gap-3 mx-1 mt-3 mb-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-black">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-secondary text-sm truncate">{userName}</p>
                  <p className="text-xs text-gray-400">
                    {userRole === "admin" ? "مدير النظام" : "عميل"}
                  </p>
                </div>
                {userRole === "admin" && (
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-full shrink-0">
                    أدمن
                  </span>
                )}
              </div>
            )}

            <nav className="flex flex-col gap-0.5 mt-2 px-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href, pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-secondary"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span className="mr-auto w-1.5 h-1.5 bg-white/70 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 pt-3 border-t border-gray-100 px-1">
              <p className="px-4 py-1 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                روابط مهمة
              </p>
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-secondary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 px-1 space-y-1.5">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    className="flex items-center justify-center px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:border-primary hover:text-primary transition-all"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-primary-light to-primary-dark text-white font-bold text-sm hover:shadow-md transition-all"
                  >
                    إنشاء حساب جديد
                  </Link>
                </>
              ) : (
                <>
                  {userRole === "admin" && (
                    <Link
                      href="/dashboard"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/8 text-secondary font-bold text-sm hover:bg-secondary/15 transition-all"
                    >
                      <DashboardIcon />
                      لوحة التحكم
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-all"
                  >
                    <LogoutIcon />
                    تسجيل الخروج
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}