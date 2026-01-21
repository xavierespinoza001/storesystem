export type Role = "admin" | "sales" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  active: boolean;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  stock: number;
  minStock: number;
  status: "active" | "inactive";
}

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out";
  quantity: number;
  date: string;
  userId: string;
  userName: string;
  reason?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  date: string;
  total: number;
  items: SaleItem[];
  userId: string;
  userName: string;
  documentType: 'receipt' | 'invoice';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
