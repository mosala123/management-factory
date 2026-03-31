import { ReactNode } from "react";

// Product Types
export type Category = "men" | "women" | "kids" | "uniform";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  heroImage: string;
  gallery: string[];
  summary: string;
  description: string;
  specs: string[];
  tags: string[];
  badge?: string;
  inStock?: boolean;
  createdAt?: string;
}

// Order Types
export interface Order {
  id: string;
  userId?: string;
  customer: string;
  productId?: string;
  productName: string;
  status: "قيد التنفيذ" | "جاهز للشحن" | "تم التسليم" | "ملغي";
  quantity: number;
  total: number;
  eta: string;
  notes?: string;
  createdAt?: string;
}

// Contact Types
export interface ContactForm {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  requestType: "sample" | "wholesale" | "uniform" | "custom" | "general";
  message: string;
  status?: "new" | "read" | "replied";
  createdAt?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "customer" | "admin";
  createdAt?: string;
}

// FAQ Types
export interface FAQ {
  question: string;
  answer: string;
}

// Testimonial Types
export interface Testimonial {
  name: string;
  company: string;
  quote: string;
  avatar?: string;
}

// Navigation Types
export interface NavLink {
  href: string;
  label: string;
  protected?: boolean;
}

// Category Types
export interface CategoryItem {
  id: string;
  label: string;
  icon?: string;
}

// Admin Navigation Types
export interface NavItem {
  href: string;
  label: string;
  permission?: string;
  badge?: number;
  icon?: ReactNode;
}