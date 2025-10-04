// Customer Management Types - Updated to match backend API

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  user: User;
  sales: Sale[];
  traffic: CustomerTraffic[];
}

export interface Sale {
  id: string;
  customerId: string;
  product: string;
  quantity: number;
  amount: number;
  saleDate: string;
  createdBy: string;
  customer: Customer;
  user: User;
}

export interface CustomerTraffic {
  id: string;
  customerId: string;
  pageViews: number;
  sessionDuration: number;
  lastVisit: string;
  createdBy: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard Data Types
export interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  activeCustomers: number;
  avgOrderValue: number;
}

export interface SalesData {
  month: string;
  sales: number;
  customers: number;
}

// Loading and Error States
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
