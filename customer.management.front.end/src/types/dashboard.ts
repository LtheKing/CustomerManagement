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

export interface ProductSalesData {
  productName: string;
  totalQuantity: number;
  totalPrice: number;
}


