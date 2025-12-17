import type { Sale } from "./Sale";
import type { CustomerTraffic } from "./CustomerTraffic";
import type { User } from "./User";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  user: User;
  sales: Sale[];
  traffic: CustomerTraffic[];
}


