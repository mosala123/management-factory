// app/(admin)/dashboard/products/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getCategoryLabel, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    slug: "",
    category: "men" as "men" | "women" | "kids" | "uniform",
    price: "",
    quantity: "0",           // الحقل الجديد
    min_stock: "10",         // الحقل الجديد
    heroImage: "",
    gallery: [] as string[],
    summary: "",
    description: "",
    specs: [] as string[],
    tags: [] as string[],
    badge: "",
    inStock: true,
  });

  const [newSpec, setNewSpec] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newImage, setNewImage] = useState("");

  // جلب بيانات المنتج من Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoadingProduct(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) {
        toast.error("حدث خطأ في جلب المنتج");
        router.push("/dashboard/products");
      } else if (data) {
        setFormData({
          id: data.id,
          name: data.name,
          slug: data.slug,
          category: data.category,
          price: data.price.toString(),
          quantity: data.quantity?.toString() || "0",           // الحقل الجديد
          min_stock: data.min_stock?.toString() || "10",        // الحقل الجديد
          heroImage: data.hero_image,
          gallery: data.gallery || [],
          summary: data.summary,
          description: data.description,
          specs: data.specs || [],
          tags: data.tags || [],
          badge: data.badge || "",
          inStock: data.in_stock ?? true,
        });
      }

      setIsLoadingProduct(false);
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // توليد slug تلقائي من الاسم
  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/[^\x00-\x7F]/g, (char) => {
        const arabicToEnglish: Record<string, string> = {
          'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g', 'ح': 'h',
          'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's',
          'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
          'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
          'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'h', 'ى': 'a'
        };
        return arabicToEnglish[char] || '-';
      })
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // التحقق من عدم تكرار slug (باستثناء المنتج الحالي)
  const checkSlugUnique = async (slug: string, currentId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("products")
      .select("slug")
      .eq("slug", slug)
      .neq("id", currentId)
      .single();

    return !data;
  };

  // تحديث slug
  const updateSlug = async () => {
    if (!formData.name) return;

    let baseSlug = generateSlugFromName(formData.name);
    if (!baseSlug) baseSlug = "product";

    let slug = baseSlug;
    let counter = 1;

    while (!(await checkSlugUnique(slug, formData.id))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    setFormData(prev => ({ ...prev, slug }));
    toast.success("تم تحديث الرابط تلقائياً");
  };

  // إضافة مواصفة
  const addSpec = () => {
    if (newSpec.trim()) {
      setFormData((prev) => ({
        ...prev,
        specs: [...prev.specs, newSpec.trim()],
      }));
      setNewSpec("");
    }
  };

  const removeSpec = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index),
    }));
  };

  // إضافة تاغ
  const addTag = () => {
    if (newTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // إضافة صورة للمعرض
  const addImage = () => {
    if (newImage.trim()) {
      setFormData((prev) => ({
        ...prev,
        gallery: [...prev.gallery, newImage.trim()],
      }));
      setNewImage("");
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  // رفع صورة من الجهاز
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isHero: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isHero) {
        setFormData((prev) => ({ ...prev, heroImage: base64String }));
      } else {
        setFormData((prev) => ({
          ...prev,
          gallery: [...prev.gallery, base64String],
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.price || !formData.heroImage) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      setIsLoading(false);
      return;
    }

    // تحديث المنتج في Supabase مع الحقول الجديدة
    const { error } = await supabase
      .from("products")
      .update({
        name: formData.name,
        slug: formData.slug,
        category: formData.category,
        price: parseInt(formData.price),
        quantity: parseInt(formData.quantity) || 0,        // الحقل الجديد
        min_stock: parseInt(formData.min_stock) || 10,     // الحقل الجديد
        hero_image: formData.heroImage,
        gallery: formData.gallery,
        summary: formData.summary,
        description: formData.description,
        specs: formData.specs,
        tags: formData.tags,
        badge: formData.badge || null,
        in_stock: formData.inStock,
      })
      .eq("id", formData.id);

    if (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ في تحديث المنتج");
    } else {
      toast.success("✅ تم تحديث المنتج بنجاح");
      router.push("/dashboard/products");
    }

    setIsLoading(false);
  };

  // حساب حالة المخزون
  const currentQuantity = parseInt(formData.quantity) || 0;
  const minStock = parseInt(formData.min_stock) || 10;
  const isLowStock = currentQuantity <= minStock;
  const isOutOfStock = currentQuantity === 0;
  const stockStatus = isOutOfStock ? "غير متوفر" : isLowStock ? "مخزون منخفض" : "مخزون كاف";
  const stockStatusColor = isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-green-600";

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">تعديل المنتج</h1>
          <p className="text-gray-500 mt-1">تعديل تفاصيل المنتج: {formData.name}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/products/${formData.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            معاينة المنتج
          </Link>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            العودة للمنتجات
          </Link>
        </div>
      </div>

      {/* Stock Status Alert */}
      {isLowStock && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${isOutOfStock ? "bg-red-50 border-r-4 border-red-500" : "bg-amber-50 border-r-4 border-amber-500"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOutOfStock ? "bg-red-100" : "bg-amber-100"}`}>
            <span className={isOutOfStock ? "text-red-600" : "text-amber-600"}>
              {isOutOfStock ? "❌" : "⚠️"}
            </span>
          </div>
          <div>
            <p className={`font-bold ${stockStatusColor}`}>
              {stockStatus}
            </p>
            <p className="text-sm text-gray-600">
              {isOutOfStock
                ? "المنتج غير متوفر حالياً. يرجى إعادة الطلب فوراً."
                : `الكمية الحالية (${currentQuantity}) أقل من الحد الأدنى (${minStock}). يرجى إعادة الطلب.`}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* العمود الأيمن */}
          <div className="space-y-6">
            {/* الاسم */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اسم المنتج *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={updateSlug}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  تحديث الرابط
                </button>
              </div>
            </div>

            {/* Slug - للعرض فقط */}
            <div className="bg-white rounded-xl p-6 shadow-sm bg-gray-50">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                رابط المنتج (Slug)
              </label>
              <div className="font-mono text-sm text-primary bg-gray-100 px-4 py-2 rounded-xl">
                /products/{formData.slug || "..."}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                يتم إنشاء الرابط تلقائياً من الاسم
              </p>
            </div>

            {/* الفئة والسعر */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الفئة *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                >
                  <option value="men">رجالي</option>
                  <option value="women">حريمي</option>
                  <option value="kids">أطفال</option>
                  <option value="uniform">يونيفورم</option>
                </select>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  السعر (ج.م) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  required
                />
              </div>
            </div>

            {/* الكمية والحد الأدنى - الحقول الجديدة */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الكمية المتوفرة *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border focus:border-primary outline-none ${isLowStock ? "border-amber-300 bg-amber-50" : "border-gray-200"
                    }`}
                  required
                  min="0"
                />
                {isLowStock && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ الكمية أقل من الحد الأدنى الموصى به
                  </p>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الحد الأدنى للتنبيه
                </label>
                <input
                  type="number"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-1">
                  سيظهر تنبيه عندما تصبح الكمية أقل من هذا الرقم
                </p>
              </div>
            </div>

            {/* الصورة الرئيسية */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                الصورة الرئيسية *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  name="heroImage"
                  value={formData.heroImage}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  placeholder="رابط الصورة"
                />
                <label className="px-4 py-2 bg-gray-100 rounded-xl text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                  📁 اختيار ملف
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="hidden"
                  />
                </label>
              </div>
              {formData.heroImage && (
                <img src={formData.heroImage} alt="معاينة" className="w-32 h-32 object-cover rounded-xl" />
              )}
            </div>

            {/* معرض الصور */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">معرض الصور</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  placeholder="رابط صورة"
                />
                <button type="button" onClick={addImage} className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark">
                  إضافة
                </button>
                <label className="px-4 py-2 bg-gray-100 rounded-xl text-gray-600 cursor-pointer">
                  📁 رفع
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.gallery.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* الشارة والحالة */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">شارة (Badge)</label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  placeholder="مثال: الأكثر مبيعاً"
                />
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="inStock"
                    checked={formData.inStock}
                    onChange={handleChange}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm font-semibold text-gray-700">متوفر في المخزون</span>
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  * يتم تحديث هذه الحالة تلقائياً حسب الكمية
                </p>
              </div>
            </div>
          </div>

          {/* العمود الأيسر */}
          <div className="space-y-6">
            {/* الملخص */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">ملخص المنتج *</label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none resize-none"
                required
              />
            </div>

            {/* الوصف التفصيلي */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف التفصيلي *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none resize-none"
                required
              />
            </div>

            {/* المواصفات */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">المواصفات</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSpec()}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  placeholder="مثال: قطن 100%"
                />
                <button type="button" onClick={addSpec} className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark">
                  إضافة
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specs.map((spec, index) => (
                  <span key={index} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                    {spec}
                    <button type="button" onClick={() => removeSpec(index)} className="text-gray-400 hover:text-red-500 mr-1">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* التاغات */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">التاغات</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  placeholder="مثال: صيفي"
                />
                <button type="button" onClick={addTag} className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark">
                  إضافة
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                    #{tag}
                    <button type="button" onClick={() => removeTag(index)} className="text-primary/50 hover:text-red-500 mr-1">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/dashboard/products"
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all disabled:opacity-70"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحفظ...
              </div>
            ) : (
              "حفظ التغييرات"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}