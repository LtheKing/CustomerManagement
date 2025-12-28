/**
 * Full Sales Transaction model (from SalesDto)
 */
export interface Sales {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
  cashierName?: string;
  saleDate: string;
  createdBy: string;
  createdByUsername?: string;
}

