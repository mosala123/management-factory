"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

function isValidImageSrc(value: string): boolean {
  const src = value.trim();
  if (!src) return false;
  if (src.startsWith("data:image/")) return true;
  if (src.startsWith("blob:")) return true;
  try {
    const parsed = new URL(src);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const STEPS = [
  { id: 1, label: "المعلومات الأساسية", icon: "📦" },
  { id: 2, label: "الصور", icon: "🖼️" },
  { id: 3, label: "التفاصيل", icon: "📝" },
  { id: 4, label: "المخزون والنشر", icon: "🏪" },
];

export default function AddProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    category: "men",
    price: "",
    heroImage: "",
    gallery: [] as string[],
    summary: "",
    description: "",
    specs: [] as string[],
    tags: [] as string[],
    badge: "",
    inStock: true,
    quantity: "0",
    min_stock: "10",
  });

  const [newSpec, setNewSpec] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newImage, setNewImage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/[^\x00-\x7F]/g, (char) => {
        const arabicToEnglish: Record<string, string> = {
          ا: "a", ب: "b", ت: "t", ث: "th", ج: "g", ح: "h",
          خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z", س: "s",
          ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a",
          غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m",
          ن: "n", ه: "h", و: "w", ي: "y", ة: "h", ى: "a",
        };
        return arabicToEnglish[char] || "-";
      })
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.price || !formData.heroImage) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      setIsLoading(false);
      return;
    }

    if (!isValidImageSrc(formData.heroImage)) {
      toast.error("رابط الصورة الرئيسية غير صالح");
      setIsLoading(false);
      return;
    }

    const baseSlug = generateSlugFromName(formData.name) || "product";

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        slug: baseSlug,
        category: formData.category,
        price: parseInt(formData.price),
        hero_image: formData.heroImage,
        gallery: formData.gallery,
        summary: formData.summary,
        description: formData.description,
        specs: formData.specs,
        tags: formData.tags,
        badge: formData.badge || null,
        in_stock: formData.inStock,
        quantity: parseInt(formData.quantity) || 0,
        min_stock: parseInt(formData.min_stock) || 10,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      const errorMessage =
        result?.error?.code === "UNAUTHORIZED"
          ? "يرجى تسجيل الدخول أولاً"
          : result?.error?.code === "FORBIDDEN"
          ? "ليس لديك صلاحية لإضافة منتجات"
          : typeof result?.error === "string"
          ? result.error
          : result?.error?.message || "حدث خطأ في إضافة المنتج";
      toast.error(errorMessage);
    } else {
      const createdSlug = result.data?.slug ?? baseSlug;
      toast.success(`✅ تم إضافة المنتج بنجاح`);
      router.push("/dashboard/products");
    }

    setIsLoading(false);
  };

  const currentQty = parseInt(formData.quantity) || 0;
  const minStock = parseInt(formData.min_stock) || 10;
  const isLowStock = currentQty > 0 && currentQty <= minStock;
  const isOutOfStock = currentQty === 0;

  const canGoNext = () => {
    if (currentStep === 1) return formData.name && formData.price && formData.category;
    if (currentStep === 2) return isValidImageSrc(formData.heroImage);
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50/50" dir="rtl">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/products"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">إضافة منتج جديد</h1>
              <p className="text-xs text-gray-400">الخطوة {currentStep} من {STEPS.length}</p>
            </div>
          </div>

          {/* Progress pills */}
          <div className="hidden md:flex items-center gap-2">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                type="button"
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className="flex items-center gap-1.5"
              >
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    step.id === currentStep
                      ? "bg-primary text-white shadow-sm"
                      : step.id < currentStep
                      ? "bg-green-100 text-green-700 cursor-pointer hover:bg-green-200"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <span>{step.id < currentStep ? "✓" : step.icon}</span>
                  <span className="hidden lg:block">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-0.5 ${step.id < currentStep ? "bg-green-300" : "bg-gray-200"}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="md:hidden h-1 bg-gray-100">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* ═══════════════ STEP 1: المعلومات الأساسية ═══════════════ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">📦</div>
                <h2 className="text-2xl font-bold text-gray-900">المعلومات الأساسية</h2>
                <p className="text-gray-500 mt-1">ابدأ بإدخال اسم المنتج والتصنيف والسعر</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم المنتج <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-lg transition-all"
                  placeholder="مثال: قميص بولو كلاسيك"
                  required
                />
                {formData.name && (
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    🔗 /products/{generateSlugFromName(formData.name) || "..."}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الفئة <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "men", label: "رجالي", icon: "👔" },
                      { value: "women", label: "حريمي", icon: "👗" },
                      { value: "kids", label: "أطفال", icon: "🧸" },
                      { value: "uniform", label: "يونيفورم", icon: "🦺" },
                    ].map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, category: cat.value }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          formData.category === cat.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    السعر (ج.م) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-2xl font-bold transition-all"
                      placeholder="0"
                      required
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                      ج.م
                    </span>
                  </div>
                  {formData.price && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      السعر: {parseInt(formData.price).toLocaleString("ar-EG")} جنيه
                    </p>
                  )}
                </div>
              </div>

              {/* Badge */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  شارة المنتج (اختياري)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["الأكثر مبيعاً", "جديد", "خصم", "محدود", "مميز"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, badge: p.badge === b ? "" : b }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.badge === b
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                  placeholder="أو اكتب شارة مخصصة..."
                />
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 2: الصور ═══════════════ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🖼️</div>
                <h2 className="text-2xl font-bold text-gray-900">صور المنتج</h2>
                <p className="text-gray-500 mt-1">أضف الصورة الرئيسية ومعرض الصور</p>
              </div>

              {/* Hero Image */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  الصورة الرئيسية <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <input
                      type="url"
                      name="heroImage"
                      value={formData.heroImage}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                      placeholder="الصق رابط الصورة هنا..."
                    />
                    <div className="text-center text-gray-400 text-xs">— أو —</div>
                    <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 cursor-pointer hover:border-primary hover:text-primary transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">اختر صورة من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData((prev) => ({ ...prev, heroImage: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-center">
                    {isValidImageSrc(formData.heroImage) ? (
                      <div className="relative group">
                        <img
                          src={formData.heroImage}
                          alt="معاينة"
                          className="w-40 h-40 object-cover rounded-2xl shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, heroImage: "" }))}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                          ✓ تم
                        </div>
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">معاينة الصورة</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  معرض الصور <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="url"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newImage.trim() && isValidImageSrc(newImage.trim())) {
                          setFormData((p) => ({ ...p, gallery: [...p.gallery, newImage.trim()] }));
                          setNewImage("");
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="رابط صورة إضافية..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newImage.trim()) return;
                      if (!isValidImageSrc(newImage.trim())) {
                        toast.error("رابط الصورة غير صالح");
                        return;
                      }
                      setFormData((p) => ({ ...p, gallery: [...p.gallery, newImage.trim()] }));
                      setNewImage("");
                    }}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    إضافة
                  </button>
                  <label className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                    📁 رفع
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach((file) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData((p) => ({ ...p, gallery: [...p.gallery, reader.result as string] }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.gallery.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {formData.gallery.map((img, index) => (
                      <div key={index} className="relative group aspect-square">
                        {isValidImageSrc(img) ? (
                          <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full rounded-xl border border-red-200 bg-red-50 flex items-center justify-center text-red-400 text-xs text-center p-1">
                            غير صالح
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, gallery: p.gallery.filter((_, i) => i !== index) }))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {/* Add more placeholder */}
                    <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 cursor-pointer hover:border-primary hover:text-primary transition-all">
                      <span className="text-2xl">+</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach((file) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData((p) => ({ ...p, gallery: [...p.gallery, reader.result as string] }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                    لا توجد صور في المعرض بعد
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 3: التفاصيل ═══════════════ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">📝</div>
                <h2 className="text-2xl font-bold text-gray-900">تفاصيل المنتج</h2>
                <p className="text-gray-500 mt-1">الوصف والمواصفات والتاغات</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ملخص المنتج <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="summary"
                      value={formData.summary}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none text-sm transition-all"
                      placeholder="وصف قصير يظهر في بطاقة المنتج..."
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">{formData.summary.length} حرف</p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      الوصف التفصيلي <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none text-sm transition-all"
                      placeholder="وصف مفصل للمنتج، خامات، مميزات، تعليمات العناية..."
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">{formData.description.length} حرف</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Specs */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">المواصفات</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newSpec}
                        onChange={(e) => setNewSpec(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newSpec.trim()) {
                              setFormData((p) => ({ ...p, specs: [...p.specs, newSpec.trim()] }));
                              setNewSpec("");
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                        placeholder="مثال: قطن 100% ..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSpec.trim()) {
                            setFormData((p) => ({ ...p, specs: [...p.specs, newSpec.trim()] }));
                            setNewSpec("");
                          }
                        }}
                        className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.specs.length === 0 && (
                        <p className="text-xs text-gray-400">لا توجد مواصفات بعد</p>
                      )}
                      {formData.specs.map((spec, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                          {spec}
                          <button type="button" onClick={() => setFormData((p) => ({ ...p, specs: p.specs.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500 mr-1 text-xs">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">التاغات</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newTag.trim()) {
                              setFormData((p) => ({ ...p, tags: [...p.tags, newTag.trim()] }));
                              setNewTag("");
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                        placeholder="مثال: صيفي، قطن..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTag.trim()) {
                            setFormData((p) => ({ ...p, tags: [...p.tags, newTag.trim()] }));
                            setNewTag("");
                          }
                        }}
                        className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.length === 0 && (
                        <p className="text-xs text-gray-400">لا توجد تاغات بعد</p>
                      )}
                      {formData.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                          #{tag}
                          <button type="button" onClick={() => setFormData((p) => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))} className="text-primary/50 hover:text-red-500 mr-1 text-xs">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 4: المخزون والنشر ═══════════════ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🏪</div>
                <h2 className="text-2xl font-bold text-gray-900">المخزون والنشر</h2>
                <p className="text-gray-500 mt-1">حدد الكمية وحالة المنتج قبل النشر</p>
              </div>

              {/* Stock inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الكمية المتوفرة <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none text-2xl font-bold transition-all ${
                      isOutOfStock
                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
                        : isLowStock
                        ? "border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-100"
                        : "border-gray-200 focus:border-primary focus:ring-primary/10"
                    }`}
                    required
                  />
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red-500" : isLowStock ? "bg-amber-500" : "bg-green-500"}`} />
                    <p className={`text-xs font-medium ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-green-600"}`}>
                      {isOutOfStock ? "سيظهر كـ \"غير متوفر\"" : isLowStock ? "مخزون منخفض - تنبيه سيظهر" : "مخزون كافي ✓"}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">حد التنبيه (الحد الأدنى)</label>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-2xl font-bold transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-2">سيظهر تنبيه عندما تقل الكمية عن هذا الرقم</p>
                </div>
              </div>

              {/* Stock visual indicator */}
              {parseInt(formData.quantity) > 0 && parseInt(formData.min_stock) > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">مستوى المخزون</p>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOutOfStock ? "bg-red-500" : isLowStock ? "bg-amber-400" : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (currentQty / (minStock * 3)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>حد التنبيه: {minStock}</span>
                    <span>{minStock * 3}+</span>
                  </div>
                </div>
              )}

              {/* In Stock toggle */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-700">حالة النشر</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {formData.inStock ? "المنتج ظاهر ومتاح للشراء" : "المنتج مخفي من المتجر"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, inStock: !p.inStock }))}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                      formData.inStock ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
                        formData.inStock ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20">
                <p className="text-sm font-bold text-primary mb-4">ملخص المنتج قبل الإضافة</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">الاسم:</span>
                    <span className="font-medium text-gray-800 mr-1">{formData.name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">السعر:</span>
                    <span className="font-medium text-gray-800 mr-1">{formData.price ? `${parseInt(formData.price).toLocaleString("ar-EG")} ج.م` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">الفئة:</span>
                    <span className="font-medium text-gray-800 mr-1">
                      {{ men: "رجالي", women: "حريمي", kids: "أطفال", uniform: "يونيفورم" }[formData.category]}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">الكمية:</span>
                    <span className="font-medium text-gray-800 mr-1">{formData.quantity} قطعة</span>
                  </div>
                  <div>
                    <span className="text-gray-500">الصور:</span>
                    <span className="font-medium text-gray-800 mr-1">{isValidImageSrc(formData.heroImage) ? `${1 + formData.gallery.length} صورة` : "لا توجد"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">الحالة:</span>
                    <span className={`font-medium mr-1 ${formData.inStock ? "text-green-600" : "text-red-500"}`}>
                      {formData.inStock ? "✓ منشور" : "✗ مخفي"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ Navigation ═══════════════ */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              السابق
            </button>

            <span className="text-sm text-gray-400">
              {currentStep} / {STEPS.length}
            </span>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={() => {
                  if (!canGoNext()) {
                    toast.error("يرجى إكمال الحقول المطلوبة أولاً");
                    return;
                  }
                  setCurrentStep((s) => s + 1);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                التالي
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-all disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    إضافة المنتج
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}