// Customer Management Types

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerTraffic {
  id: number;
  customerId: number;
  visitDate: Date;
  pageViews: number;
  sessionDuration: number;
}

export interface Sales {
  id: number;
  customerId: number;
  productName: string;
  amount: number;
  saleDate: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  isActive: boolean;
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
