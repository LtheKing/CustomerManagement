export interface UserActivity {
  id: string;
  userId: string;
  username: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface AddStockRequest {
  productId: string;
  quantity: number;
  note?: string;
  performedByUserId?: string;
}

export interface AddStockResult {
  productId: string;
  productName: string;
  previousStock: number;
  addedQuantity: number;
  newStock: number;
}
