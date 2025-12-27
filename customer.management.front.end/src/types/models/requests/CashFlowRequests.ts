/**
 * Request model for creating a cash flow
 */
export interface CreateCashFlowRequest {
  flowType: string;
  referenceId?: string | null;
  amount: number;
  info?: string;
  flowDate: string;
}

/**
 * Response model for cash flow operations
 */
export interface CashFlowResponse {
  id: string;
  flowType: string;
  referenceId?: string | null;
  amount: number;
  info?: string;
  flowDate: string;
}

