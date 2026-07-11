/**
 * Request model for creating a sales transaction
 * Hybrid approach: Either customerId OR customerName must be provided
 */
export interface CreateSalesTransactionRequest {
  customerId?: string; // Optional: if provided, customer must exist
  customerName?: string; // Optional: if provided, will find or create customer
  productId: string;
  quantity: number;
  amount: number;
  cashierName?: string;
  saleDate?: string; // Optional: defaults to current time
  createdBy: string;
  /** Shared ID for all products in the same checkout */
  transactionId?: string;
}

/**
 * Response model for sales transaction operations
 */
export interface SalesTransactionResponse {
  id: string;
  transactionId: string;
  customerId: string;
  productId: string;
  quantity: number;
  amount: number;
  cashierName?: string;
  saleDate: string;
  createdBy: string;
}
