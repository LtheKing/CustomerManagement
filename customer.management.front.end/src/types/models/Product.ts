export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

