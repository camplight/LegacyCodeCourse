// Tests for Wrapper Layers Pattern
// Demonstrates testing the wrapper's data transformation and interface adaptation

import { ModernCustomerService, CustomerDB, Customer } from './after';

describe('ModernCustomerService (Wrapper)', () => {
  let legacyDB: CustomerDB;
  let service: ModernCustomerService;

  beforeEach(() => {
    legacyDB = new CustomerDB();
    service = new ModernCustomerService(legacyDB);
  });

  describe('Data Transformation', () => {
    it('should transform snake_case to camelCase', async () => {
      const customer = await service.getCustomer('1');

      // Modern interface uses camelCase
      expect(customer.name).toBe('John Doe');
      expect(customer.email).toBe('john@example.com');

      // Verify these properties exist (TypeScript would catch if not)
      expect(customer).toHaveProperty('createdAt');
      expect(customer).toHaveProperty('lastLogin');
    });

    it('should convert string dates to Date objects', async () => {
      const customer = await service.getCustomer('1');

      // Should be Date objects, not strings
      expect(customer.createdAt).toBeInstanceOf(Date);
      expect(customer.lastLogin).toBeInstanceOf(Date);

      // Date should be correctly parsed
      expect(customer.createdAt.getFullYear()).toBe(2024);
      expect(customer.createdAt.getMonth()).toBe(0); // January (0-indexed)
      expect(customer.createdAt.getDate()).toBe(15);
    });

    it('should handle null dates correctly', async () => {
      const customer = await service.getCustomer('2');

      // Jane Smith has no last login
      expect(customer.lastLogin).toBeNull();
      expect(customer.createdAt).toBeInstanceOf(Date);
    });

    it('should convert numeric IDs to strings', async () => {
      const customer = await service.getCustomer('1');

      // Modern interface uses string IDs
      expect(typeof customer.id).toBe('string');
      expect(customer.id).toBe('1');
    });
  });

  describe('Callback to Promise Conversion', () => {
    it('should convert callbacks to async/await', async () => {
      // This is the key benefit - modern async/await instead of callbacks
      const customer = await service.getCustomer('1');

      expect(customer.name).toBe('John Doe');
    });

    it('should reject promise on error', async () => {
      // Non-existent customer should reject
      await expect(service.getCustomer('999')).rejects.toThrow('Customer 999 not found');
    });

    it('should handle list operations', async () => {
      const customers = await service.listCustomers();

      expect(Array.isArray(customers)).toBe(true);
      expect(customers.length).toBeGreaterThan(0);
      expect(customers[0]).toHaveProperty('name');
      expect(customers[0]).toHaveProperty('email');
    });
  });

  describe('Save Operations', () => {
    it('should save customer with typed data', async () => {
      const newCustomer: Customer = {
        id: '5',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date('2024-02-11T12:00:00'),
        lastLogin: null
      };

      await service.saveCustomer(newCustomer);

      // Verify it was saved
      const saved = await service.getCustomer('5');
      expect(saved.name).toBe('Test User');
      expect(saved.email).toBe('test@example.com');
    });

    it('should transform Date objects to legacy string format', async () => {
      const testDate = new Date('2024-02-11T15:30:45');

      const newCustomer: Customer = {
        id: '6',
        name: 'Date Test',
        email: 'date@example.com',
        createdAt: testDate,
        lastLogin: testDate
      };

      await service.saveCustomer(newCustomer);

      // Retrieve and verify dates round-trip correctly
      const saved = await service.getCustomer('6');
      expect(saved.createdAt.getFullYear()).toBe(2024);
      expect(saved.createdAt.getMonth()).toBe(1); // February
      expect(saved.createdAt.getDate()).toBe(11);
      expect(saved.createdAt.getHours()).toBe(15);
      expect(saved.createdAt.getMinutes()).toBe(30);
    });
  });

  describe('Integration with Legacy System', () => {
    it('should work with existing legacy data', async () => {
      // The wrapper should work with data already in the legacy system
      const customers = await service.listCustomers();

      // Should find pre-seeded customers
      const john = customers.find(c => c.name === 'John Doe');
      const jane = customers.find(c => c.name === 'Jane Smith');

      expect(john).toBeDefined();
      expect(jane).toBeDefined();
      expect(john?.email).toBe('john@example.com');
      expect(jane?.email).toBe('jane@example.com');
    });

    it('should maintain data integrity through transformation', async () => {
      // Fetch, modify, and save
      const original = await service.getCustomer('1');

      const updated: Customer = {
        ...original,
        email: 'newemail@example.com'
      };

      await service.saveCustomer(updated);

      const refetched = await service.getCustomer('1');
      expect(refetched.email).toBe('newemail@example.com');
      expect(refetched.name).toBe(original.name); // Other fields unchanged
    });
  });
});
