// app/(admin)/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
    totalProducts: 0,
    totalMessages: 0,
    unreadMessages: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);

    // جلب المنتجات
    const { data: products, count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // جلب الطلبات
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    // جلب الطلبات الكاملة للإحصائيات
    const { data: allOrders } = await supabase
      .from("orders")
      .select("*");

    // جلب الرسائل
    const { count: messagesCount } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true });

    const { count: unreadCount } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("status", "new");

    if (allOrders) {
      const pending = allOrders.filter((o) => o.status === "قيد التنفيذ").length;
      const ready = allOrders.filter((o) => o.status === "جاهز للشحن").length;
      const delivered = allOrders.filter((o) => o.status === "تم التسليم").length;

      setStats({
        totalOrders: allOrders.length,
        pendingOrders: pending,
        readyOrders: ready,
        deliveredOrders: delivered,
        totalProducts: productsCount || 0,
        totalMessages: messagesCount || 0,
        unreadMessages: unreadCount || 0,
      });
      setRecentOrders(orders || []);
    }

    setIsLoading(false);
  };

  // حالة الطلب بالعربية مع الألوان
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; bgColor: string }> = {
      "قيد التنفيذ": { color: "text-amber-800", bgColor: "bg-amber-50", label: "قيد التنفيذ" },
      "جاهز للشحن": { color: "text-sky-800", bgColor: "bg-sky-50", label: "جاهز للشحن" },
      "تم التسليم": { color: "text-emerald-800", bgColor: "bg-emerald-50", label: "تم التسليم" },
      "ملغي": { color: "text-red-800", bgColor: "bg-red-50", label: "ملغي" },
    };
    return statusConfig[status] || { color: "text-gray-800", bgColor: "bg-gray-50", label: status };
  };

  // بطاقات الإحصائيات
  const statCards = [
    { title: "إجمالي الطلبات", value: stats.totalOrders, icon: "📦", color: "from-blue-500 to-blue-600", delay: 0 },
    { title: "قيد التنفيذ", value: stats.pendingOrders, icon: "⚙️", color: "from-amber-500 to-amber-600", delay: 1 },
    { title: "جاهز للشحن", value: stats.readyOrders, icon: "🚚", color: "from-sky-500 to-sky-600", delay: 2 },
    { title: "تم التسليم", value: stats.deliveredOrders, icon: "✅", color: "from-emerald-500 to-emerald-600", delay: 3 },
    { title: "المنتجات", value: stats.totalProducts, icon: "👕", color: "from-primary to-primary-dark", delay: 4 },
    { title: "الرسائل", value: stats.totalMessages, icon: "💬", color: "from-purple-500 to-purple-600", delay: 5 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-secondary">
          مرحباً بك في لوحة التحكم
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          نظرة عامة على نشاط المتجر وإحصائياته
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        {statCards.map((card, index) => (
          <div
            key={card.title}
            className={`bg-gradient-to-br ${card.color} rounded-xl sm:rounded-2xl p-4 sm:p-5 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up`}
            style={{ animationDelay: `${card.delay * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl">{card.icon}</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black">{card.value}</span>
            </div>
            <p className="text-xs sm:text-sm text-white/80 mt-2 sm:mt-3 font-medium">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <QuickActionCard
          href="/dashboard/orders"
          icon="📋"
          iconBgColor="bg-blue-50"
          iconHoverColor="group-hover:bg-blue-100"
          title="متابعة الطلبات"
          description="عرض وإدارة الطلبات"
        />
        <QuickActionCard
          href="/dashboard/products"
          icon="👕"
          iconBgColor="bg-primary/10"
          iconHoverColor="group-hover:bg-primary/20"
          title="إدارة المنتجات"
          description="إضافة وتعديل المنتجات"
        />
        <QuickActionCard
          href="/dashboard/messages"
          icon="💬"
          iconBgColor="bg-purple-50"
          iconHoverColor="group-hover:bg-purple-100"
          title="الرسائل"
          description={stats.unreadMessages > 0 ? `${stats.unreadMessages} رسائل غير مقروءة` : "لا توجد رسائل جديدة"}
          badge={stats.unreadMessages > 0 ? stats.unreadMessages : undefined}
        />
        <QuickActionCard
          href="/dashboard/settings"
          icon="⚙️"
          iconBgColor="bg-gray-50"
          iconHoverColor="group-hover:bg-gray-100"
          title="الإعدادات"
          description="تخصيص الموقع والإعدادات"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-secondary">آخر الطلبات</h2>
          <Link
            href="/dashboard/orders"
            className="text-primary text-xs sm:text-sm font-semibold hover:underline transition-colors"
          >
            عرض الكل ←
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">لا توجد طلبات حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr className="text-right">
                  <th className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-600">رقم الطلب</th>
                  <th className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-600">العميل</th>
                  <th className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-600">المنتج</th>
                  <th className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-600">الكمية</th>
                  <th className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-600">الإجمالي</th>
                  <th className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-600">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order, idx) => {
                  const status = getStatusBadge(order.status);
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gray-50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <span className="font-mono text-xs sm:text-sm text-primary font-semibold">
                          #{order.id.slice(-6)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-700 font-medium">
                        {order.customer_name}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">
                        {order.product_name?.length > 30 
                          ? `${order.product_name.slice(0, 30)}...` 
                          : order.product_name}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-700">
                        {order.quantity}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-primary">
                        {order.total.toLocaleString()} ج.م
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${status.bgColor} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// مكون Quick Action Card منفصل
function QuickActionCard({ 
  href, 
  icon, 
  iconBgColor, 
  iconHoverColor, 
  title, 
  description,
  badge 
}: { 
  href: string; 
  icon: string; 
  iconBgColor: string; 
  iconHoverColor: string; 
  title: string; 
  description: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 sm:gap-4 relative"
    >
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBgColor} rounded-lg sm:rounded-xl flex items-center justify-center ${iconHoverColor} transition-colors flex-shrink-0`}>
        <span className="text-xl sm:text-2xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-secondary text-sm sm:text-base truncate">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 truncate">{description}</p>
      </div>
      {badge && badge > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          {badge}
        </div>
      )}
    </Link>
  );
}