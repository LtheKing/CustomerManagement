import type { Customer } from "./Customer";
import type { User } from "./User";

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


