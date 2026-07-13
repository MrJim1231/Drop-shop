import axios from "axios";

// Standard API URL (reads from environment variables in production, or uses proxy in development)
const API_URL = import.meta.env.VITE_API_URL || "";

const client = axios.create({
  baseURL: API_URL,
});

// Interceptor to inject JWT token in Authorization header
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export interface CategoryData {
  id: number;
  name: string;
  image?: string;
  parent_id?: number | null;
  parent_category?: { id: number; name: string } | null;
  subcategories?: { id: number; name: string; image?: string }[];
}

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  discounted_price: number | null;
  image: string;
  images: string[];
  size?: string;
  availability: number | boolean;
  quantity_in_stock: number;
  weight?: number | null;
  category_id: number;
  category_name?: string;
  parent_id?: number | null;
  supplier?: string;
}

export interface UserData {
  email: string;
  name: string;
  phone: string;
  address: string;
  is_admin: boolean;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  size: string;
  rubber: number | boolean;
}

export interface OrderData {
  id?: string;
  order_number: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  comment: string;
  total_price: number;
  user_id: string;
  created_at: string;
  items: OrderItem[];
}

export const api = {
  // Categories
  getCategories: () => client.get<CategoryData[]>("/api/categories.php").then(r => r.data),
  
  getCategory: (id: string | number) => 
    client.get<CategoryData>(`/api/get_category_by_id.php?category_id=${id}`).then(r => r.data),
  
  getProductsByCategory: (categoryId: string | number) =>
    client.get<ProductData[]>(`/api/get_products_by_category.php?category_id=${categoryId}`).then(r => r.data),

  // Products
  getProducts: (page = 1) => 
    client.get<{ products: ProductData[]; total_pages: number }>(`/api/products.php?page=${page}`).then(r => r.data),
  
  searchProducts: (query: string, page = 1) => 
    client.get<{ products: ProductData[]; total_pages: number }>(`/api/products.php?q=${encodeURIComponent(query)}&page=${page}`).then(r => r.data),
  
  getProduct: (id: string) => 
    client.get<ProductData>(`/api/product-details.php?id=${id}`).then(r => r.data),

  // Orders
  createOrder: (data: Partial<OrderData>) =>
    client.post<{ status: string; message: string; orderNumber?: string; userId?: string }>("/api/order.php", data).then(r => r.data),
  
  generateUserId: () => 
    client.get<{ userId: string }>("/api/order.php?generate_user_id=1").then(r => r.data),
  
  getOrders: (userId: string) => 
    client.get<OrderData[] | { status: string; message: string }>(`/api/get_orders.php?userId=${userId}`).then(r => r.data),

  // Auth & Profile
  login: (data: any) => 
    client.post<{ status: string; message: string; token?: string; userId?: string; isAdmin?: boolean }>("/api/login.php", data).then(r => r.data),
  
  register: (data: any) => 
    client.post<{ status: string; message: string; userId?: string }>("/api/register.php", data).then(r => r.data),
  
  verifyEmail: (data: { email: string; code: string }) =>
    client.post<{ status: string; message: string; token?: string; userId?: string }>("/api/verify_email.php", data).then(r => r.data),
  
  getProfile: (userId: string) => 
    client.get<{ status: string; data?: UserData; message?: string }>(`/api/get_profile.php?userId=${userId}`).then(r => r.data),
  
  updateProfile: (data: any) => 
    client.post<{ status: string; message: string }>("/api/update_profile.php", data).then(r => r.data),

  requestPasswordReset: (email: string) =>
    client.post<{ status: string; message: string }>("/api/reset_password_request.php", { email }).then(r => r.data),

  resetPassword: (data: any) =>
    client.post<{ status: string; message: string }>("/api/reset_password.php", data).then(r => r.data),

  changePassword: (data: any) =>
    client.post<{ status: string; message: string }>("/api/change-password", data).then(r => r.data),

  // Admin Catalog & Stats
  uploadCatalog: (formData: FormData) =>
    client.post<{ status: string; message: string }>("/api/upload_catalog.php", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data),
  
  getCatalogs: () => 
    client.get<{ name: string; size: string; uploaded_at: string }[]>("/api/get_uploaded_catalogs.php").then(r => r.data),
  
  deleteCatalog: (fileName: string) =>
    client.post<{ status: string; message: string }>("/api/delete_catalog.php", { fileName }).then(r => r.data),
  
  getStats: () => 
    client.get<{ status: string; data: { total_products: number; total_categories: number; suppliers: { name: string; count: number }[] } }>("/api/get_stats.php").then(r => r.data),
  
  setDiscount: (product_id: string, discount: number) =>
    client.post<{ status: string; message: string }>("/api/set_discount.php", { product_id, discount }).then(r => r.data),

  // Admin CRUD Categories
  adminGetCategories: () => 
    client.get<{ status: string; categories: CategoryData[] }>("/api/admin_category_crud.php").then(r => r.data),
  
  adminCategoryCrud: (action: "create" | "update" | "delete", data: any) =>
    client.post<{ status: string; message: string; id?: number }>("/api/admin_category_crud.php", { action, ...data }).then(r => r.data),

  adminProductCrud: (action: "create" | "update" | "delete", data: any) =>
    client.post<{ status: string; message: string }>("/api/admin_product_crud.php", { action, ...data }).then(r => r.data),

  uploadImage: (formData: FormData) =>
    client.post<{ status: string; message: string; url: string }>("/api/upload_image.php", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data),

  searchProductsAdmin: (query: string) =>
    client.get<ProductData[]>(`/api/products.php?q=${encodeURIComponent(query)}&page=1`).then(r => r.data),

  getDiscountedProducts: () =>
    client.get<{ status: string; products: ProductData[] }>("/api/get_discounted_products.php").then(r => r.data),
};
export default client;
