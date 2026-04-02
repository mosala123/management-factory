import { createClient } from '@/lib/supabase/client';

export async function uploadImage(file: File, folder: string = 'products'): Promise<string> {
  const supabase = createClient();
  
  // إنشاء اسم فريد للملف
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;
  
  // رفع الملف إلى Supabase Storage
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`فشل رفع الصورة: ${error.message}`);
  }
  
  // الحصول على الرابط العام
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);
  
  return publicUrl;
}

export async function uploadMultipleImages(files: File[], folder: string = 'products'): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}