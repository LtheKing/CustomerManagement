export interface CashFlow {
  id: string;
  flowType: string;
  referenceId?: string | null;
  amount: number;
  info?: string;
  flowDate: string;
}

