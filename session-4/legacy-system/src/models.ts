// Data models for the e-commerce system
// TODO: Should really use proper validation library

export type Order = {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalPrice?: number;
  taxAmount?: number;
  discountAmount?: number;
  status: string;
  createdAt: Date;
  shippingAddress?: any;
  billingAddress?: any;
  paymentMethod?: any;
};

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
};

export type Customer = {
  id: string;
  email: string;
  name: string;
  tier: string; // 'standard' | 'premium' | 'vip'
  country?: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  stockLevel: number;
  category?: string;
};

export type Promotion = {
  code: string;
  type: string; // 'percentage' | 'fixed'
  value: number;
  minPurchase?: number;
};

export type PaymentResult = {
  success: boolean;
  transactionId?: string;
  error?: string;
};

export type ShippingOption = {
  method: string;
  cost: number;
  estimatedDays: number;
};
