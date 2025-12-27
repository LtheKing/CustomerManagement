import { Customer } from "../Customer";

/**
 * Request model for creating a new customer
 */
export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  createdBy: string;
}

/**
 * Request model for updating an existing customer
 */
export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
}

/**
 * Response model for customer operations
 */
export type CustomerResponse = Customer;

