// LEGACY CUSTOMER DATABASE - Old Database Access Layer
// This is intentionally messy legacy code for training purposes

// ============================================================================
// LEGACY DATABASE LAYER - Callback-based, untyped, fragile
// ============================================================================

// Problems with this legacy code:
// - Callback-based interface (callback hell)
// - Unstructured data (any type)
// - Poor naming (snake_case from database)
// - Dates as strings instead of Date objects
// - No proper error handling
// - Tightly coupled to specific database library
// - No TypeScript types
export class CustomerDB {
  // Simulated database storage
  private db: Map<number, any> = new Map();

  constructor() {
    // Seed with some test data
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

  // OLD-STYLE CALLBACK INTERFACE
  // Problems:
  // - Callbacks instead of promises (hard to use with async/await)
  // - Error-first callback pattern (error-prone)
  // - Returns raw database rows (snake_case fields)
  getCustomerById(
    id: number,
    callback: (error: Error | null, data?: any) => void
  ): void {
    // Simulate async database call
    setTimeout(() => {
      const customer = this.db.get(id);
      if (!customer) {
        callback(new Error(`Customer ${id} not found`));
      } else {
        callback(null, customer);
      }
    }, 10);
  }

  // More callback-based methods
  listCustomers(
    callback: (error: Error | null, data?: any[]) => void
  ): void {
    setTimeout(() => {
      const customers = Array.from(this.db.values());
      callback(null, customers);
    }, 10);
  }

  // Saves customer with unstructured data (any type)
  // Problems:
  // - No validation
  // - No type checking
  // - Synchronous (blocking)
  // - Direct mutation
  saveCustomerData(customerData: any): void {
    const id = customerData.customer_id;
    if (!id) {
      throw new Error('Customer ID required');
    }

    // Direct database mutation - no validation!
    this.db.set(id, customerData);
  }
}

// ============================================================================
// EXAMPLE USAGE - Shows the pain of using legacy interface
// ============================================================================

if (require.main === module) {
  const db = new CustomerDB();

  console.log('Legacy Database Usage Examples:');
  console.log('================================\n');

  // Example 1: Callback hell when chaining operations
  console.log('1. Fetching customer (callback style):');
  db.getCustomerById(1, (err, customer) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      // Raw data with snake_case fields
      console.log('Customer:', customer);
      console.log('Name:', customer.customer_name);
      console.log('Email:', customer.email_address);
      console.log('Created:', customer.created_date); // String, not Date!
    }
  });

  // Example 2: Cannot use async/await easily
  setTimeout(() => {
    console.log('\n2. Listing all customers (callback style):');
    db.listCustomers((err, customers) => {
      if (err) {
        console.error('Error:', err.message);
      } else {
        console.log(`Found ${customers?.length} customers`);
        customers?.forEach((c: any) => {
          console.log(`  - ${c.customer_name} (${c.email_address})`);
        });
      }
    });
  }, 50);

  // Example 3: Unstructured data - easy to make mistakes
  setTimeout(() => {
    console.log('\n3. Saving customer (unstructured data):');
    try {
      db.saveCustomerData({
        customer_id: 3,
        customer_name: 'Bob Wilson',
        email_address: 'bob@example.com',
        created_date: '2024-02-11 12:00:00',
        // Typo! Should be 'last_login' but no type checking catches it
        lastLogin: null
      });
      console.log('Customer saved (but with data quality issues!)');
    } catch (error: any) {
      console.error('Error:', error.message);
    }
  }, 100);
}
