// Inventory Manager - handles stock levels
// This module is well-tested and stable

import { Product, OrderItem } from './models';

// In-memory inventory - in production this would be a database
const inventory: Map<string, Product> = new Map();

// Initialize with some sample products
export function initializeInventory() {
  const products: Product[] = [
    { id: 'PROD001', name: 'Laptop', price: 999.99, stockLevel: 50 },
    { id: 'PROD002', name: 'Mouse', price: 29.99, stockLevel: 200 },
    { id: 'PROD003', name: 'Keyboard', price: 79.99, stockLevel: 150 },
    { id: 'PROD004', name: 'Monitor', price: 299.99, stockLevel: 75 },
    { id: 'PROD005', name: 'Webcam', price: 89.99, stockLevel: 100 }
  ];

  products.forEach(product => {
    inventory.set(product.id, product);
  });
}

// Check if items are in stock
export function checkStock(items: OrderItem[]): boolean {
  for (const item of items) {
    const product = inventory.get(item.productId);

    if (!product) {
      return false; // Product not found
    }

    if (product.stockLevel < item.quantity) {
      return false; // Insufficient stock
    }
  }

  return true;
}

// Reserve inventory for an order
export function reserveInventory(items: OrderItem[]): boolean {
  // First check if all items are available
  if (!checkStock(items)) {
    return false;
  }

  // Reserve by reducing stock levels
  for (const item of items) {
    const product = inventory.get(item.productId);
    if (product) {
      product.stockLevel -= item.quantity;
    }
  }

  return true;
}

// Release reserved inventory (e.g., if order is cancelled)
export function releaseInventory(items: OrderItem[]): void {
  for (const item of items) {
    const product = inventory.get(item.productId);
    if (product) {
      product.stockLevel += item.quantity;
    }
  }
}

// Get current stock level for a product
export function getStockLevel(productId: string): number {
  const product = inventory.get(productId);
  return product ? product.stockLevel : 0;
}

// Get product details
export function getProduct(productId: string): Product | undefined {
  return inventory.get(productId);
}

// Add new product to inventory
export function addProduct(product: Product): void {
  inventory.set(product.id, product);
}

// Update stock level
export function updateStockLevel(productId: string, newLevel: number): boolean {
  const product = inventory.get(productId);

  if (!product) {
    return false;
  }

  product.stockLevel = newLevel;
  return true;
}

// Initialize on module load
initializeInventory();
// [2024-06-10] add inventory reservation system
// [2024-09-05] add product management functions
// [2024-12-10] add stock level updates
