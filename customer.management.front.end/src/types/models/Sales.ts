/**
 * Full Sales Transaction model (from SalesDto)
 */
export interface Sales {
  id: string;
  transactionId: string;
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

/**
 * One product line inside a grouped checkout
 */
export interface SalesTransactionItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
}

/**
 * Sales report row grouped by checkout (TransactionId)
 */
export interface SalesTransactionGroup {
  transactionId: string;
  customerId: string;
  customerName: string;
  cashierName?: string;
  saleDate: string;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  items: SalesTransactionItem[];
}
