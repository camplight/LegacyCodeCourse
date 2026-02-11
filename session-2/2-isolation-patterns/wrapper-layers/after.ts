// WRAPPER LAYERS PATTERN - Modern Interface for Legacy Code
// This demonstrates wrapping legacy code with a clean, modern interface

// ============================================================================
// LEGACY CODE (Completely unchanged - wrapped, not modified)
// ============================================================================

export class CustomerDB {
  private db: Map<number, any> = new Map();

  constructor() {
    this.db.set(1, {
      customer_id: 1,
      customer_name: 'John Doe',
      email_address: 'john@example.com',
      created_date: '2024-01-15 14:30:00',
      last_login: '2024-02-10 09:15:00'
    });

    this.db.set(2, {
      customer_id: 2,
      customer_name: 'Jane Smith',
      email_address: 'jane@example.com',
      created_date: '2024-02-01 10:00:00',
      last_login: null
    });
  }

  getCustomerById(
    id: number,
    callback: (error: Error | null, data?: any) => void
  ): void {
    setTimeout(() => {
      const customer = this.db.get(id);
      if (!customer) {
        callback(new Error(`Customer ${id} not found`));
      } else {
        callback(null, customer);
      }
    }, 10);
  }

  listCustomers(
    callback: (error: Error | null, data?: any[]) => void
  ): void {
    setTimeout(() => {
      const customers = Array.from(this.db.values());
      callback(null, customers);
    }, 10);
  }

  saveCustomerData(customerData: any): void {
    const id = customerData.customer_id;
    if (!id) {
      throw new Error('Customer ID required');
    }
    this.db.set(id, customerData);
  }
}

// ============================================================================
// MODERN INTERFACE - Clean, typed data structures
// ============================================================================

// Clean TypeScript interface with proper naming
export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  lastLogin: Date | null;
}

// ============================================================================
// WRAPPER LAYER - Adapts legacy interface to modern interface
// ============================================================================

// The wrapper provides:
// - Modern async/await interface (no callbacks!)
// - Clean, typed data (Customer interface)
// - Proper error handling
// - Data transformation (snake_case → camelCase, strings → Dates)
// - Zero changes to legacy code
export class ModernCustomerService {
  constructor(
    private legacyDB: CustomerDB
  ) {}

  // Modern async interface instead of callbacks
  async getCustomer(id: string): Promise<Customer> {
    return new Promise((resolve, reject) => {
      // Adapt: string ID → number ID
      const numericId = parseInt(id, 10);

      // Call legacy callback-based method
      this.legacyDB.getCustomerById(numericId, (error, data) => {
        if (error) {
          reject(error);
        } else {
          // Transform legacy data to modern format
          const customer = this.transformToCustomer(data);
          resolve(customer);
        }
      });
    });
  }

  async listCustomers(): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      this.legacyDB.listCustomers((error, data) => {
        if (error) {
          reject(error);
        } else {
          // Transform all customers to modern format
          const customers = data?.map(d => this.transformToCustomer(d)) || [];
          resolve(customers);
        }
      });
    });
  }

  async saveCustomer(customer: Customer): Promise<void> {
    // Transform modern format to legacy format
    const legacyData = this.transformFromCustomer(customer);

    // Legacy method is synchronous, but we return Promise for consistency
    return new Promise((resolve, reject) => {
      try {
        this.legacyDB.saveCustomerData(legacyData);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ============================================================================
  // DATA TRANSFORMATION - Adapter logic
  // ============================================================================

  // Transform legacy database format to modern format
  private transformToCustomer(legacyData: any): Customer {
    return {
      id: legacyData.customer_id.toString(), // number → string
      name: legacyData.customer_name,         // snake_case → camelCase
      email: legacyData.email_address,        // snake_case → camelCase
      createdAt: this.parseDate(legacyData.created_date), // string → Date
      lastLogin: legacyData.last_login
        ? this.parseDate(legacyData.last_login)
        : null
    };
  }

  // Transform modern format to legacy database format
  private transformFromCustomer(customer: Customer): any {
    return {
      customer_id: parseInt(customer.id, 10), // string → number
      customer_name: customer.name,            // camelCase → snake_case
      email_address: customer.email,           // camelCase → snake_case
      created_date: this.formatDate(customer.createdAt), // Date → string
      last_login: customer.lastLogin
        ? this.formatDate(customer.lastLogin)
        : null
    };
  }

  // Parse legacy date string to Date object
  private parseDate(dateString: string): Date {
    // Legacy format: "2024-01-15 14:30:00"
    return new Date(dateString.replace(' ', 'T'));
  }

  // Format Date object to legacy date string
  private formatDate(date: Date): string {
    // Legacy format: "YYYY-MM-DD HH:MM:SS"
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

// ============================================================================
// EXAMPLE USAGE - Clean, modern code using wrapper
// ============================================================================

if (require.main === module) {
  const legacyDB = new CustomerDB();
  const modernService = new ModernCustomerService(legacyDB);

  (async () => {
    console.log('Modern Customer Service (via Wrapper)');
    console.log('======================================\n');

    try {
      // Example 1: Clean async/await instead of callbacks
      console.log('1. Fetching customer (async/await):');
      const customer = await modernService.getCustomer('1');
      console.log('Customer:', customer);
      console.log('Name:', customer.name);           // camelCase!
      console.log('Email:', customer.email);         // camelCase!
      console.log('Created:', customer.createdAt);   // Date object!
      console.log('Type:', typeof customer.createdAt); // 'object'

      // Example 2: List all customers with clean data
      console.log('\n2. Listing all customers (async/await):');
      const customers = await modernService.listCustomers();
      console.log(`Found ${customers.length} customers`);
      customers.forEach(c => {
        console.log(`  - ${c.name} (${c.email})`);
      });

      // Example 3: Save customer with typed data
      console.log('\n3. Saving new customer (typed data):');
      const newCustomer: Customer = {
        id: '3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        createdAt: new Date(),
        lastLogin: null
      };

      await modernService.saveCustomer(newCustomer);
      console.log('Customer saved successfully!');

      // Verify it was saved
      const savedCustomer = await modernService.getCustomer('3');
      console.log('Verified:', savedCustomer.name);

    } catch (error: any) {
      console.error('Error:', error.message);
    }
  })();
}
