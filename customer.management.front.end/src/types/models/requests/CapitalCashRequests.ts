/**
 * Request model for creating capital cash
 */
export interface CreateCapitalCashRequest {
  balance: number;
}

/**
 * Request model for updating capital cash
 */
export interface UpdateCapitalCashRequest {
  id: string;
  balance: number;
}

/**
 * Response model for capital cash operations
 */
export interface CapitalCashResponse {
  id: string;
  balance: number;
  updatedAt: string;
}

