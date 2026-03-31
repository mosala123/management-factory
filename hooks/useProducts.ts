import { useCallback, useState } from "react";
import type { Product } from "@/lib/types";
import toast from "react-hot-toast";

type ProductsApiResponse = {
  success?: boolean;
  data?: {
    items?: Product[];
    pagination?: {
      total?: number;
      page?: number;
      pageSize?: number;
      totalPages?: number;
    };
  };
};

function normalizeProductsResponse(payload: ProductsApiResponse | Product[]): Product[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  return [];
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      const res = await fetch(`/api/products?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data: ProductsApiResponse | Product[] = await res.json();
      setProducts(normalizeProductsResponse(data));
    } catch (error) {
      setProducts([]);
      toast.error("خطأ في جلب المنتجات");
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = async (product: Omit<Product, "id" | "created_at" | "updated_at">) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!res.ok) {
        throw new Error("Failed to add product");
      }

      const response = await res.json();
      const newProduct = response?.data ?? response;

      setProducts((current) => [...current, newProduct]);
      toast.success("تم إضافة المنتج بنجاح");

      return newProduct;
    } catch (error) {
      toast.error("خطأ في إضافة المنتج");
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error("Failed to update product");
      }

      const response = await res.json();
      const updated = response?.data ?? response;

      setProducts((current) => current.map((product) => (product.id === id ? updated : product)));
      toast.success("تم تحديث المنتج بنجاح");

      return updated;
    } catch (error) {
      toast.error("خطأ في تحديث المنتج");
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts((current) => current.filter((product) => product.id !== id));
      toast.success("تم حذف المنتج بنجاح");
    } catch (error) {
      toast.error("خطأ في حذف المنتج");
    }
  };

  return {
    products,
    loading,
    isLoading: loading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
