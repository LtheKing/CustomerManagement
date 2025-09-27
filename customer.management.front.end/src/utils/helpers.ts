import { Customer } from "../types";

// Utility functions with proper TypeScript typing

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sortCustomersByName = (customers: Customer[]): Customer[] => {
  return [...customers].sort((a, b) => a.name.localeCompare(b.name));
};

export const filterCustomersByEmail = (customers: Customer[], email: string): Customer[] => {
  return customers.filter(customer => 
    customer.email.toLowerCase().includes(email.toLowerCase())
  );
};
