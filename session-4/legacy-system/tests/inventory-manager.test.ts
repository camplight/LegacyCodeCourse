// Tests for inventory manager
// Good coverage of all major functions

import {
  checkStock,
  reserveInventory,
  releaseInventory,
  getStockLevel,
  getProduct,
  addProduct,
  updateStockLevel,
  initializeInventory
} from '../src/inventory-manager';
import { OrderItem, Product } from '../src/models';

describe('Inventory Manager', () => {
  beforeEach(() => {
    // Re-initialize inventory for each test
    initializeInventory();
  });

  describe('checkStock', () => {
    it('should return true when items are in stock', () => {
      const items: OrderItem[] = [
        { productId: 'PROD001', productName: 'Laptop', quantity: 5, unitPrice: 999.99 }
      ];

      const result = checkStock(items);
      expect(result).toBe(true);
    });

    it('should return false when items are out of stock', () => {
      const items: OrderItem[] = [
        { productId: 'PROD001', productName: 'Laptop', quantity: 1000, unitPrice: 999.99 }
      ];

      const result = checkStock(items);
      expect(result).toBe(false);
    });

    it('should return false when product does not exist', () => {
      const items: OrderItem[] = [
        { productId: 'INVALID', productName: 'Unknown', quantity: 1, unitPrice: 10 }
      ];

      const result = checkStock(items);
      expect(result).toBe(false);
    });

    it('should check multiple items', () => {
      const items: OrderItem[] = [
        { productId: 'PROD001', productName: 'Laptop', quantity: 5, unitPrice: 999.99 },
        { productId: 'PROD002', productName: 'Mouse', quantity: 10, unitPrice: 29.99 }
      ];

      const result = checkStock(items);
      expect(result).toBe(true);
    });
  });

  describe('reserveInventory', () => {
    it('should reserve inventory successfully', () => {
      const items: OrderItem[] = [
        { productId: 'PROD001', productName: 'Laptop', quantity: 5, unitPrice: 999.99 }
      ];

      const initialStock = getStockLevel('PROD001');
      const result = reserveInventory(items);

      expect(result).toBe(true);
      expect(getStockLevel('PROD001')).toBe(initialStock - 5);
    });

    it('should not reserve when insufficient stock', () => {
      const items: OrderItem[] = [
        { productId: 'PROD001', productName: 'Laptop', quantity: 1000, unitPrice: 999.99 }
      ];

      const initialStock = getStockLevel('PROD001');
      const result = reserveInventory(items);

      expect(result).toBe(false);
      expect(getStockLevel('PROD001')).toBe(initialStock); // Stock unchanged
    });
  });

  describe('releaseInventory', () => {
    it('should release reserved inventory', () => {
      const items: OrderItem[] = [
        { productId: 'PROD001', productName: 'Laptop', quantity: 5, unitPrice: 999.99 }
      ];

      reserveInventory(items);
      const stockAfterReserve = getStockLevel('PROD001');

      releaseInventory(items);
      const stockAfterRelease = getStockLevel('PROD001');

      expect(stockAfterRelease).toBe(stockAfterReserve + 5);
    });
  });

  describe('getStockLevel', () => {
    it('should return correct stock level', () => {
      const level = getStockLevel('PROD001');
      expect(level).toBe(50); // Initial stock from initializeInventory
    });

    it('should return 0 for non-existent product', () => {
      const level = getStockLevel('INVALID');
      expect(level).toBe(0);
    });
  });

  describe('getProduct', () => {
    it('should return product details', () => {
      const product = getProduct('PROD001');

      expect(product).toBeDefined();
      expect(product?.name).toBe('Laptop');
      expect(product?.price).toBe(999.99);
    });

    it('should return undefined for non-existent product', () => {
      const product = getProduct('INVALID');
      expect(product).toBeUndefined();
    });
  });

  describe('addProduct', () => {
    it('should add new product to inventory', () => {
      const newProduct: Product = {
        id: 'PROD999',
        name: 'Test Product',
        price: 49.99,
        stockLevel: 100
      };

      addProduct(newProduct);

      const retrieved = getProduct('PROD999');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Product');
    });
  });

  describe('updateStockLevel', () => {
    it('should update stock level successfully', () => {
      const result = updateStockLevel('PROD001', 25);

      expect(result).toBe(true);
      expect(getStockLevel('PROD001')).toBe(25);
    });

    it('should return false for non-existent product', () => {
      const result = updateStockLevel('INVALID', 100);
      expect(result).toBe(false);
    });
  });
});
