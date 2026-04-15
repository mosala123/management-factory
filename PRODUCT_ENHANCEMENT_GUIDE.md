# دليل تحسين نظام إدارة المنتجات - مصنع القماش والملابس

## 📋 نظرة عامة

تم تحسين نظام إدارة المنتجات ليدعم الصور المتعددة والتفاصيل الموسعة لمصنع القماش والملابس. يتضمن النظام المحسّن:

- ✅ دعم الصور المتعددة مع معلومات تفصيلية
- ✅ مواصفات القماش والخامات (نوع، وزن، عرض، تركيب، نسيج)
- ✅ متغيرات الألوان والأحجام
- ✅ تعليمات العناية والصيانة
- ✅ واجهة محسّنة بـ 5 خطوات للإضافة والتعديل
- ✅ عرض شبكة وجدول محسّن مع صور معاينة
- ✅ فلاتر وترتيب متقدمة
- ✅ إحصائيات شاملة للمخزون

---

## 🗂️ الملفات المحدثة والجديدة

### 1. **أنواع البيانات المحسّنة**

#### `lib/types/database.ts`
تم إضافة أنواع جديدة:

```typescript
// الصور المتعددة
interface ProductImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  order: number;
  isHero: boolean;
  uploadedAt: string;
}

// مواصفات القماش
interface FabricSpec {
  type: string;           // نوع القماش
  weight: number;         // وزن GSM
  width: number;          // عرض بـ سم
  composition: string;    // تركيب النسيج
  texture?: string;       // نسيج القماش
  shrinkage?: number;     // نسبة الانكماش
}

// متغيرات اللون
interface ColorVariant {
  id: string;
  name: string;
  hexCode: string;
  imageUrl?: string;
  stock: number;
}

// متغيرات الحجم
interface SizeVariant {
  id: string;
  size: string;
  stock: number;
  measurements?: {
    chest?: number;
    length?: number;
    sleeve?: number;
  };
}

// المنتج المحسّن
interface Product {
  // ... الحقول الأساسية
  images?: ProductImage[];           // الصور المحسّنة
  fabricSpec?: FabricSpec;           // مواصفات القماش
  care?: string[];                   // تعليمات العناية
  colors?: ColorVariant[];           // الألوان
  sizes?: SizeVariant[];             // الأحجام
  priceWholesale?: number;           // سعر الجملة
  sku?: string;                      // رمز المنتج
  barcode?: string;                  // الباركود
  manufacturer?: string;             // الشركة المصنعة
  origin?: string;                   // دولة المنشأ
}
```

#### `lib/types/api.ts`
تم تحديث واجهات الطلب والاستجابة:

```typescript
interface CreateProductRequest {
  // ... الحقول الأساسية
  price_wholesale?: number;
  currency?: string;
  images?: ProductImage[];
  fabric_spec?: FabricSpec;
  care_instructions?: string[];
  colors?: ColorVariant[];
  sizes?: SizeVariant[];
  manufacturer?: string;
  origin?: string;
  barcode?: string;
}

interface UpdateProductRequest {
  // نفس الحقول لكن اختيارية
}
```

---

## 🎨 المكونات الجديدة

### 2. **واجهة إضافة المنتج المحسّنة**

**الملف:** `app/(admin)/dashboard/products/new/page-enhanced.tsx`

#### الخطوات الخمس:

1. **المعلومات الأساسية** 📦
   - اسم المنتج
   - الفئة (رجالي، حريمي، أطفال، يونيفورم، قماش، إكسسوارات)
   - السعر وسعر الجملة
   - رمز المنتج SKU
   - الشركة المصنعة ودولة المنشأ

2. **الصور المتعددة** 🖼️
   - الصورة الرئيسية (مطلوبة)
   - صور إضافية مع تسميات توضيحية
   - رفع من الملفات أو إدراج روابط
   - معاينة فورية

3. **مواصفات القماش** 🧵
   - نوع القماش
   - وزن القماش (GSM)
   - عرض القماش (سم)
   - تركيب النسيج
   - نسيج القماش
   - نسبة الانكماش
   - تعليمات العناية

4. **الألوان والأحجام** 🎨
   - إضافة ألوان متعددة مع رموز HEX
   - إضافة أحجام مع قياسات (صدر، طول، كم)
   - تتبع المخزون لكل لون وحجم

5. **التفاصيل والمخزون** 📝
   - ملخص المنتج
   - الوصف التفصيلي
   - المواصفات (specs)
   - العلامات (tags)
   - الشارة (badge)
   - إدارة المخزون
   - الباركود

#### المميزات:
- ✅ تحقق من الصحة في الوقت الفعلي
- ✅ معاينة فورية للصور
- ✅ حفظ تلقائي للمسودات (يمكن إضافته)
- ✅ رسائل خطأ واضحة
- ✅ واجهة سهلة الاستخدام

---

### 3. **قائمة المنتجات المحسّنة**

**الملف:** `app/(admin)/dashboard/products/page-enhanced.tsx`

#### المميزات:

1. **عرض الشبكة (Grid View)**
   - بطاقات منتج جميلة
   - معاينة الصورة الرئيسية
   - عرض الشارة والحالة
   - عدد الصور الإضافية
   - عدد الألوان والأحجام
   - السعر والكمية

2. **عرض الجدول (Table View)**
   - جدول شامل مع جميع التفاصيل
   - صور مصغرة
   - معلومات الخامة
   - حالة المخزون
   - إجراءات سريعة

3. **الفلاتر والبحث**
   - بحث بالاسم والملخص والعلامات
   - فلتر حسب الفئة
   - فلتر حسب حالة المخزون (متوفر، منخفض، غير متوفر)
   - ترتيب حسب (الأحدث، الاسم، السعر، المخزون)
   - ترتيب تصاعدي/تنازلي

4. **الإحصائيات**
   - إجمالي المنتجات
   - عدد المنتجات بمخزون منخفض
   - عدد المنتجات غير المتوفرة
   - قيمة المخزون الإجمالية
   - متوسط المخزون

5. **الإجراءات**
   - تصدير CSV
   - إضافة منتج جديد
   - تعديل منتج
   - حذف منتج مع تأكيد

---

## 🔧 كيفية الاستخدام

### تثبيت الملفات المحسّنة

```bash
# استبدل الملف الأصلي بالملف المحسّن
cp app/(admin)/dashboard/products/new/page-enhanced.tsx \
   app/(admin)/dashboard/products/new/page.tsx

# أو احتفظ بالملف الأصلي واستخدم الملف الجديد
# ثم قم بتحديث الروابط في التطبيق
```

### تحديث قاعدة البيانات (Supabase)

إذا كنت تستخدم Supabase، قم بإضافة الأعمدة الجديدة:

```sql
-- إضافة الأعمدة الجديدة للمنتجات
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_wholesale NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT 'SAR';
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric_spec JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS care_instructions TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin VARCHAR;
```

### تحديث API Routes

تأكد من أن API routes تدعم الحقول الجديدة:

```typescript
// app/api/products/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  // تأكد من دعم جميع الحقول الجديدة
  const productData = {
    name: body.name,
    category: body.category,
    price: body.price,
    price_wholesale: body.price_wholesale,
    currency: body.currency,
    hero_image: body.hero_image,
    gallery: body.gallery,
    images: body.images,
    fabric_spec: body.fabric_spec,
    care_instructions: body.care_instructions,
    colors: body.colors,
    sizes: body.sizes,
    // ... باقي الحقول
  };
  
  // إدراج في قاعدة البيانات
}
```

---

## 📊 مثال على بيانات المنتج الكاملة

```json
{
  "id": "prod-123",
  "name": "قميص بولو كلاسيك",
  "slug": "polo-shirt-classic",
  "category": "men",
  "price": 150,
  "priceWholesale": 120,
  "currency": "SAR",
  "heroImage": "https://...",
  "gallery": ["https://...", "https://..."],
  "images": [
    {
      "id": "img-1",
      "url": "https://...",
      "alt": "الصورة الأمامية",
      "caption": "الصورة الأمامية للقميص",
      "order": 0,
      "isHero": true,
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "summary": "قميص بولو كلاسيكي مصنوع من 100% قطن",
  "description": "وصف تفصيلي...",
  "fabricSpec": {
    "type": "قطن",
    "weight": 200,
    "width": 150,
    "composition": "100% قطن",
    "texture": "ناعم",
    "shrinkage": 3
  },
  "careInstructions": [
    "غسيل بماء بارد",
    "عدم استخدام المبيض",
    "كي بحرارة متوسطة"
  ],
  "colors": [
    {
      "id": "color-1",
      "name": "أحمر",
      "hexCode": "#FF0000",
      "stock": 50
    },
    {
      "id": "color-2",
      "name": "أزرق",
      "hexCode": "#0000FF",
      "stock": 30
    }
  ],
  "sizes": [
    {
      "id": "size-1",
      "size": "S",
      "stock": 20,
      "measurements": {
        "chest": 90,
        "length": 70,
        "sleeve": 60
      }
    },
    {
      "id": "size-2",
      "size": "M",
      "stock": 25,
      "measurements": {
        "chest": 95,
        "length": 72,
        "sleeve": 62
      }
    }
  ],
  "specs": ["قطن 100%", "مريح وناعم", "سهل العناية"],
  "tags": ["جديد", "الأكثر مبيعاً"],
  "badge": "جديد",
  "sku": "POLO-001",
  "barcode": "1234567890",
  "manufacturer": "شركة النسيج",
  "origin": "بنجلاديش",
  "quantity": 100,
  "minStock": 10,
  "inStock": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## 🎯 الخطوات التالية

### 1. تحديث صفحة التعديل
قم بإنشاء نسخة محسّنة من `app/(admin)/dashboard/products/[id]/edit/page.tsx` بنفس المميزات.

### 2. تحديث واجهة العرض (Frontend)
قم بتحديث صفحات عرض المنتجات للعملاء لعرض:
- معرض الصور المتعددة
- الألوان والأحجام المتاحة
- مواصفات القماش
- تعليمات العناية

### 3. تحسينات الأداء
- إضافة التخزين المؤقت (caching)
- تحسين حجم الصور
- تحميل كسول (lazy loading)

### 4. ميزات إضافية
- استيراد المنتجات من CSV
- نسخ المنتجات
- إدارة الفئات المتقدمة
- تقارير مبيعات متقدمة

---

## 🐛 استكشاف الأخطاء

### المشكلة: الصور لا تظهر
**الحل:** تأكد من أن Supabase Storage مُعد بشكل صحيح وأن الأذونات صحيحة.

### المشكلة: الأنواع غير متطابقة
**الحل:** تأكد من تحديث جميع الملفات في `lib/types/` بشكل صحيح.

### المشكلة: البيانات لا تُحفظ
**الحل:** تحقق من API routes وتأكد من أنها تدعم جميع الحقول الجديدة.

---

## 📞 الدعم والمساعدة

للمزيد من المعلومات:
- اطلع على [توثيق Supabase](https://supabase.com/docs)
- اطلع على [توثيق Next.js](https://nextjs.org/docs)
- اطلع على [توثيق TypeScript](https://www.typescriptlang.org/docs)

---

**آخر تحديث:** 15 أبريل 2026
**الإصدار:** 2.0.0
