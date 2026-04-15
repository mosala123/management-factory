"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ProductImage, FabricSpec, ColorVariant, SizeVariant } from "@/lib/types/database";

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
  { id: 2, label: "الصور المتعددة", icon: "🖼️" },
  { id: 3, label: "مواصفات القماش", icon: "🧵" },
  { id: 4, label: "الألوان والأحجام", icon: "🎨" },
  { id: 5, label: "التفاصيل والمخزون", icon: "📝" },
];

export default function AddProductPageEnhanced() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // ─── الحالة الأساسية ───────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // المعلومات الأساسية
    name: "",
    category: "men",
    price: "",
    priceWholesale: "",
    currency: "SAR",
    summary: "",
    description: "",
    
    // الصور
    heroImage: "",
    gallery: [] as string[],
    images: [] as ProductImage[],
    
    // مواصفات القماش
    fabricType: "",
    fabricWeight: "",
    fabricWidth: "",
    fabricComposition: "",
    fabricTexture: "",
    fabricShrinkage: "",
    careInstructions: [] as string[],
    
    // الألوان والأحجام
    colors: [] as ColorVariant[],
    sizes: [] as SizeVariant[],
    
    // التفاصيل الإضافية
    specs: [] as string[],
    tags: [] as string[],
    badge: "",
    sku: "",
    barcode: "",
    manufacturer: "",
    origin: "",
    
    // المخزون
    quantity: "0",
    minStock: "10",
    inStock: true,
  });

  // ─── متغيرات مساعدة ───────────────────────────────────────────────────
  const [newImage, setNewImage] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [newCareInstruction, setNewCareInstruction] = useState("");
  const [newSpec, setNewSpec] = useState("");
  const [newTag, setNewTag] = useState("");
  
  // ─── متغيرات الألوان والأحجام ───────────────────────────────────────
  const [newColor, setNewColor] = useState({ name: "", hexCode: "#000000", stock: "0" });
  const [newSize, setNewSize] = useState({ size: "", stock: "0", chest: "", length: "", sleeve: "" });

  // ─── معالجات الإدخال ───────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
  };

  // ─── معالجات الصور المتعددة ───────────────────────────────────────────
  const addImage = () => {
    if (!newImage.trim()) {
      toast.error("يرجى إدخال رابط الصورة");
      return;
    }
    if (!isValidImageSrc(newImage.trim())) {
      toast.error("رابط الصورة غير صالح");
      return;
    }

    const newProductImage: ProductImage = {
      id: `img-${Date.now()}`,
      url: newImage.trim(),
      alt: newImageCaption || "صورة المنتج",
      caption: newImageCaption || undefined,
      order: formData.images.length,
      isHero: formData.images.length === 0,
      uploadedAt: new Date().toISOString(),
    };

    setFormData((p) => ({
      ...p,
      images: [...p.images, newProductImage],
      gallery: [...p.gallery, newImage.trim()],
    }));
    setNewImage("");
    setNewImageCaption("");
    toast.success("تمت إضافة الصورة بنجاح");
  };

  const removeImage = (index: number) => {
    setFormData((p) => ({
      ...p,
      images: p.images.filter((_, i) => i !== index),
      gallery: p.gallery.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        const newProductImage: ProductImage = {
          id: `img-${Date.now()}-${Math.random()}`,
          url: imageUrl,
          alt: file.name,
          order: formData.images.length,
          isHero: formData.images.length === 0,
          uploadedAt: new Date().toISOString(),
        };
        setFormData((p) => ({
          ...p,
          images: [...p.images, newProductImage],
          gallery: [...p.gallery, imageUrl],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // ─── معالجات تعليمات العناية ───────────────────────────────────────────
  const addCareInstruction = () => {
    if (!newCareInstruction.trim()) return;
    setFormData((p) => ({
      ...p,
      careInstructions: [...p.careInstructions, newCareInstruction.trim()],
    }));
    setNewCareInstruction("");
  };

  // ─── معالجات الألوان ───────────────────────────────────────────────────
  const addColor = () => {
    if (!newColor.name.trim()) {
      toast.error("يرجى إدخال اسم اللون");
      return;
    }
    const colorVariant: ColorVariant = {
      id: `color-${Date.now()}`,
      name: newColor.name,
      hexCode: newColor.hexCode,
      stock: parseInt(newColor.stock) || 0,
    };
    setFormData((p) => ({
      ...p,
      colors: [...p.colors, colorVariant],
    }));
    setNewColor({ name: "", hexCode: "#000000", stock: "0" });
    toast.success("تمت إضافة اللون بنجاح");
  };

  const removeColor = (index: number) => {
    setFormData((p) => ({
      ...p,
      colors: p.colors.filter((_, i) => i !== index),
    }));
  };

  // ─── معالجات الأحجام ───────────────────────────────────────────────────
  const addSize = () => {
    if (!newSize.size.trim()) {
      toast.error("يرجى إدخال الحجم");
      return;
    }
    const sizeVariant: SizeVariant = {
      id: `size-${Date.now()}`,
      size: newSize.size,
      stock: parseInt(newSize.stock) || 0,
      measurements: {
        chest: newSize.chest ? parseInt(newSize.chest) : undefined,
        length: newSize.length ? parseInt(newSize.length) : undefined,
        sleeve: newSize.sleeve ? parseInt(newSize.sleeve) : undefined,
      },
    };
    setFormData((p) => ({
      ...p,
      sizes: [...p.sizes, sizeVariant],
    }));
    setNewSize({ size: "", stock: "0", chest: "", length: "", sleeve: "" });
    toast.success("تمت إضافة الحجم بنجاح");
  };

  const removeSize = (index: number) => {
    setFormData((p) => ({
      ...p,
      sizes: p.sizes.filter((_, i) => i !== index),
    }));
  };

  // ─── معالجات المواصفات والعلامات ───────────────────────────────────────
  const addSpec = () => {
    if (!newSpec.trim()) return;
    setFormData((p) => ({
      ...p,
      specs: [...p.specs, newSpec.trim()],
    }));
    setNewSpec("");
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    setFormData((p) => ({
      ...p,
      tags: [...p.tags, newTag.trim()],
    }));
    setNewTag("");
  };

  // ─── معالج الإرسال ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.price || !formData.heroImage) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      setIsLoading(false);
      return;
    }

    const baseSlug = generateSlugFromName(formData.name) || "product";

    const fabricSpec: FabricSpec = {
      type: formData.fabricType,
      weight: parseInt(formData.fabricWeight) || 0,
      width: parseInt(formData.fabricWidth) || 0,
      composition: formData.fabricComposition,
      texture: formData.fabricTexture,
      shrinkage: parseInt(formData.fabricShrinkage) || 0,
    };

    const payload = {
      name: formData.name,
      slug: baseSlug,
      category: formData.category,
      price: parseInt(formData.price),
      price_wholesale: formData.priceWholesale ? parseInt(formData.priceWholesale) : undefined,
      currency: formData.currency,
      hero_image: formData.heroImage,
      gallery: formData.gallery,
      images: formData.images,
      summary: formData.summary,
      description: formData.description,
      fabric_spec: fabricSpec,
      care_instructions: formData.careInstructions,
      colors: formData.colors,
      sizes: formData.sizes,
      specs: formData.specs,
      tags: formData.tags,
      badge: formData.badge || null,
      in_stock: formData.inStock,
      quantity: parseInt(formData.quantity) || 0,
      min_stock: parseInt(formData.minStock) || 10,
      sku: formData.sku || undefined,
      barcode: formData.barcode || undefined,
      manufacturer: formData.manufacturer || undefined,
      origin: formData.origin || undefined,
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        const errorMessage = result?.error?.message || "حدث خطأ في إضافة المنتج";
        toast.error(errorMessage);
      } else {
        toast.success("✅ تم إضافة المنتج بنجاح");
        router.push("/dashboard/products");
      }
    } catch (error) {
      toast.error("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const canGoNext = () => {
    if (currentStep === 1) return formData.name && formData.price && formData.category;
    if (currentStep === 2) return isValidImageSrc(formData.heroImage);
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50/50" dir="rtl">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                type="button"
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className="flex items-center gap-1"
              >
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
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
                  <div className={`w-2 h-0.5 ${step.id < currentStep ? "bg-green-300" : "bg-gray-200"}`} />
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
        <div className="max-w-6xl mx-auto px-6 py-8">
          
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
                      { value: "fabric", label: "قماش", icon: "🧵" },
                      { value: "accessories", label: "إكسسوارات", icon: "👜" },
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
                    السعر <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      placeholder="0"
                      required
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    >
                      <option value="SAR">SAR</option>
                      <option value="EGP">EGP</option>
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    سعر الجملة <span className="text-gray-400 text-xs">(اختياري)</span>
                  </label>
                  <input
                    type="number"
                    name="priceWholesale"
                    value={formData.priceWholesale}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="0"
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رمز المنتج SKU <span className="text-gray-400 text-xs">(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="مثال: POLO-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الشركة المصنعة <span className="text-gray-400 text-xs">(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="اسم الشركة المصنعة"
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    دولة المنشأ <span className="text-gray-400 text-xs">(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="مثال: الصين، بنجلاديش"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 2: الصور المتعددة ═══════════════ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🖼️</div>
                <h2 className="text-2xl font-bold text-gray-900">الصور المتعددة</h2>
                <p className="text-gray-500 mt-1">أضف صورة رئيسية وصور إضافية للمنتج</p>
              </div>

              {/* Hero Image */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  الصورة الرئيسية <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="url"
                    value={formData.heroImage}
                    onChange={(e) => setFormData((p) => ({ ...p, heroImage: e.target.value }))}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="رابط الصورة الرئيسية..."
                  />
                  <label className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                    📁 رفع
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData((p) => ({ ...p, heroImage: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.heroImage && isValidImageSrc(formData.heroImage) && (
                  <img src={formData.heroImage} alt="الصورة الرئيسية" className="w-full h-48 object-cover rounded-xl" />
                )}
              </div>

              {/* Gallery Images */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  صور إضافية <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <div className="space-y-3 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                      placeholder="رابط الصورة..."
                    />
                    <input
                      type="text"
                      value={newImageCaption}
                      onChange={(e) => setNewImageCaption(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                      placeholder="وصف الصورة (اختياري)"
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      إضافة
                    </button>
                  </div>
                  <label className="block px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors text-center">
                    📁 رفع صور متعددة
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group aspect-square">
                        {isValidImageSrc(img.url) ? (
                          <img src={img.url} alt={img.alt} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full rounded-xl border border-red-200 bg-red-50 flex items-center justify-center text-red-400 text-xs text-center p-1">
                            غير صالح
                          </div>
                        )}
                        {img.isHero && <span className="absolute top-1 right-1 bg-primary text-white text-xs px-2 py-1 rounded-full">رئيسية</span>}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                    لا توجد صور إضافية بعد
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 3: مواصفات القماش ═══════════════ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🧵</div>
                <h2 className="text-2xl font-bold text-gray-900">مواصفات القماش</h2>
                <p className="text-gray-500 mt-1">أدخل معلومات القماش والخامات</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">نوع القماش</label>
                  <input
                    type="text"
                    name="fabricType"
                    value={formData.fabricType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="مثال: قطن، بوليستر، خليط"
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">وزن القماش (GSM)</label>
                  <input
                    type="number"
                    name="fabricWeight"
                    value={formData.fabricWeight}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="مثال: 200"
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">عرض القماش (سم)</label>
                  <input
                    type="number"
                    name="fabricWidth"
                    value={formData.fabricWidth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="مثال: 150"
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">نسبة الانكماش (%)</label>
                  <input
                    type="number"
                    name="fabricShrinkage"
                    value={formData.fabricShrinkage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="مثال: 5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">تركيب النسيج</label>
                  <input
                    type="text"
                    name="fabricComposition"
                    value={formData.fabricComposition}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="مثال: 100% قطن أو 65% بوليستر 35% قطن"
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">نسيج القماش</label>
                  <input
                    type="text"
                    name="fabricTexture"
                    value={formData.fabricTexture}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="مثال: ناعم، خشن، محبب"
                  />
                </div>
              </div>

              {/* Care Instructions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">تعليمات العناية</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newCareInstruction}
                    onChange={(e) => setNewCareInstruction(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="مثال: غسيل بماء بارد..."
                  />
                  <button
                    type="button"
                    onClick={addCareInstruction}
                    className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.careInstructions.length === 0 && (
                    <p className="text-xs text-gray-400">لا توجد تعليمات بعد</p>
                  )}
                  {formData.careInstructions.map((care, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                      {care}
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, careInstructions: p.careInstructions.filter((_, j) => j !== i) }))}
                        className="text-blue-400 hover:text-red-500 mr-1 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 4: الألوان والأحجام ═══════════════ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🎨</div>
                <h2 className="text-2xl font-bold text-gray-900">الألوان والأحجام</h2>
                <p className="text-gray-500 mt-1">أضف الألوان والأحجام المتاحة</p>
              </div>

              {/* Colors */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-4">الألوان المتاحة</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <input
                    type="text"
                    value={newColor.name}
                    onChange={(e) => setNewColor((p) => ({ ...p, name: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="اسم اللون"
                  />
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newColor.hexCode}
                      onChange={(e) => setNewColor((p) => ({ ...p, hexCode: e.target.value }))}
                      className="w-12 h-10 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newColor.hexCode}
                      onChange={(e) => setNewColor((p) => ({ ...p, hexCode: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                      placeholder="#000000"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newColor.stock}
                      onChange={(e) => setNewColor((p) => ({ ...p, stock: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                      placeholder="المخزون"
                    />
                    <button
                      type="button"
                      onClick={addColor}
                      className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90"
                    >
                      +
                    </button>
                  </div>
                </div>

                {formData.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" style={{ backgroundColor: color.hexCode }} />
                        <span className="text-sm">{color.name} ({color.stock})</span>
                        <button
                          type="button"
                          onClick={() => removeColor(i)}
                          className="text-gray-400 hover:text-red-500 text-xs ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-4">الأحجام المتاحة</label>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
                  <input
                    type="text"
                    value={newSize.size}
                    onChange={(e) => setNewSize((p) => ({ ...p, size: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="الحجم (XS, S, M...)"
                  />
                  <input
                    type="number"
                    value={newSize.stock}
                    onChange={(e) => setNewSize((p) => ({ ...p, stock: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="المخزون"
                  />
                  <input
                    type="number"
                    value={newSize.chest}
                    onChange={(e) => setNewSize((p) => ({ ...p, chest: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="محيط الصدر"
                  />
                  <input
                    type="number"
                    value={newSize.length}
                    onChange={(e) => setNewSize((p) => ({ ...p, length: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="الطول"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newSize.sleeve}
                      onChange={(e) => setNewSize((p) => ({ ...p, sleeve: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                      placeholder="الكم"
                    />
                    <button
                      type="button"
                      onClick={addSize}
                      className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90"
                    >
                      +
                    </button>
                  </div>
                </div>

                {formData.sizes.length > 0 && (
                  <div className="space-y-2">
                    {formData.sizes.map((size, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                        <div>
                          <span className="text-sm font-medium">{size.size}</span>
                          <span className="text-xs text-gray-500 ml-2">المخزون: {size.stock}</span>
                          {size.measurements?.chest && <span className="text-xs text-gray-500 ml-2">صدر: {size.measurements.chest}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSize(i)}
                          className="text-gray-400 hover:text-red-500 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 5: التفاصيل والمخزون ═══════════════ */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">📝</div>
                <h2 className="text-2xl font-bold text-gray-900">التفاصيل والمخزون</h2>
                <p className="text-gray-500 mt-1">الوصف والمواصفات والعلامات والمخزون</p>
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
                            addSpec();
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                        placeholder="مثال: قطن 100% ..."
                      />
                      <button
                        type="button"
                        onClick={addSpec}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-3">العلامات</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                        placeholder="مثال: جديد، مخفض، الأكثر مبيعاً ..."
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.length === 0 && (
                        <p className="text-xs text-gray-400">لا توجد علامات بعد</p>
                      )}
                      {formData.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm">
                          {tag}
                          <button type="button" onClick={() => setFormData((p) => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))} className="text-green-400 hover:text-red-500 mr-1 text-xs">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الشارة</label>
                    <input
                      type="text"
                      name="badge"
                      value={formData.badge}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      placeholder="مثال: جديد، حصري، مخفض"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Management */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-4">إدارة المخزون</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">الكمية الإجمالية</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">الحد الأدنى للمخزون</label>
                    <input
                      type="number"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="inStock"
                    checked={formData.inStock}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label className="text-sm font-medium text-gray-700">المنتج متوفر</label>
                </div>
              </div>

              {/* Barcode */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">الباركود (اختياري)</label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  placeholder="رمز الباركود"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-between mt-8">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>

            {currentStep === STEPS.length ? (
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  "إضافة المنتج"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canGoNext()}
                className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            )}
          </div>
        </div>
      </form>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
