// SPROUT CLASSES PATTERN - Adding New Functionality Safely
// This demonstrates adding new features without modifying fragile legacy code

// ============================================================================
// LEGACY CODE (Minimally changed - kept for backward compatibility)
// ============================================================================

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  taxExempt?: boolean; // New optional field for tax calculation
}

interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
  country: string;
}

interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  date: Date;
}

// Original generator - mostly unchanged
export class InvoiceGenerator {
  // NEW: Tax calculator injected (sprout class integration point)
  private taxCalculator = new TaxCalculator();

  generatePDF(order: Order): string {
    let invoice = '';

    // Header (unchanged)
    invoice += '═'.repeat(60) + '\n';
    invoice += '                    INVOICE\n';
    invoice += '═'.repeat(60) + '\n';
    invoice += '\n';

    // Company info (unchanged)
    invoice += 'ACME Corporation\n';
    invoice += '123 Business Street\n';
    invoice += 'London, UK\n';
    invoice += '\n';

    // Customer info (unchanged)
    invoice += 'Bill To:\n';
    invoice += order.customer.name + '\n';
    invoice += order.customer.address + '\n';
    invoice += order.customer.email + '\n';
    invoice += '\n';

    // Invoice metadata (unchanged)
    invoice += '─'.repeat(60) + '\n';
    invoice += 'Invoice Number: ' + order.id + '\n';
    invoice += 'Date: ' + this.formatDate(order.date) + '\n';
    invoice += '─'.repeat(60) + '\n';
    invoice += '\n';

    // Line items (unchanged)
    invoice += 'ITEMS:\n';
    invoice += '─'.repeat(60) + '\n';
    invoice += this.padRight('Description', 30) +
               this.padRight('Qty', 10) +
               this.padRight('Price', 10) +
               'Total\n';
    invoice += '─'.repeat(60) + '\n';

    let subtotal = 0;
    order.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      invoice += this.padRight(item.name, 30) +
                 this.padRight(item.quantity.toString(), 10) +
                 this.padRight('£' + item.price.toFixed(2), 10) +
                 '£' + itemTotal.toFixed(2) + '\n';
    });

    invoice += '─'.repeat(60) + '\n';

    // NEW: Tax calculation using sprout class (minimal integration!)
    const taxInfo = this.taxCalculator.calculateTax(order);

    // Totals section - now includes tax
    invoice += '\n';
    invoice += this.padRight('Subtotal:', 50) + '£' + subtotal.toFixed(2) + '\n';
    invoice += this.padRight(`Tax (${taxInfo.rate}% ${taxInfo.type}):`, 50) +
               '£' + taxInfo.amount.toFixed(2) + '\n';
    invoice += this.padRight('TOTAL:', 50) + '£' + (subtotal + taxInfo.amount).toFixed(2) + '\n';

    invoice += '\n';
    invoice += '═'.repeat(60) + '\n';
    invoice += '        Thank you for your business!\n';
    invoice += '═'.repeat(60) + '\n';

    return invoice;
  }

  // Helper methods (unchanged)
  private formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  private padRight(str: string, length: number): string {
    while (str.length < length) {
      str += ' ';
    }
    return str;
  }
}

// ============================================================================
// SPROUT CLASS - New functionality in isolated, testable class
// ============================================================================

// Tax calculation result
export interface TaxBreakdown {
  rate: number;        // Tax rate as percentage
  amount: number;      // Tax amount in currency
  type: string;        // Type of tax (VAT, Sales Tax, etc.)
  country: string;     // Country tax applies to
}

// THE SPROUT CLASS
// - Completely independent
// - Fully testable
// - Clean, focused responsibility
// - No coupling to legacy code
export class TaxCalculator {
  // Tax rates by country
  private readonly TAX_RATES: Record<string, { rate: number; type: string }> = {
    'UK': { rate: 20, type: 'VAT' },
    'US': { rate: 0, type: 'Sales Tax' }, // Varies by state, simplified here
    'DE': { rate: 19, type: 'VAT' },
    'FR': { rate: 20, type: 'VAT' },
    'IT': { rate: 22, type: 'VAT' },
    'ES': { rate: 21, type: 'VAT' },
    'NL': { rate: 21, type: 'VAT' }
  };

  // US state tax rates (simplified)
  private readonly US_STATE_RATES: Record<string, number> = {
    'CA': 7.25,  // California
    'NY': 4.0,   // New York
    'TX': 6.25,  // Texas
    'FL': 6.0    // Florida
  };

  calculateTax(order: Order): TaxBreakdown {
    const country = order.customer.country;
    const taxConfig = this.TAX_RATES[country];

    if (!taxConfig) {
      // Unknown country - no tax
      return {
        rate: 0,
        amount: 0,
        type: 'None',
        country: country
      };
    }

    // Calculate taxable amount (exclude tax-exempt items)
    const taxableAmount = order.items.reduce((sum, item) => {
      if (item.taxExempt) {
        return sum;
      }
      return sum + (item.price * item.quantity);
    }, 0);

    // Handle US special case - state-based tax
    let rate = taxConfig.rate;
    if (country === 'US') {
      rate = this.getUSStateTaxRate(order.customer.address);
    }

    const taxAmount = taxableAmount * (rate / 100);

    return {
      rate: rate,
      amount: taxAmount,
      type: taxConfig.type,
      country: country
    };
  }

  private getUSStateTaxRate(address: string): number {
    // Simple state extraction from address (in real code, use proper address parser)
    const addressUpper = address.toUpperCase();

    for (const [state, rate] of Object.entries(this.US_STATE_RATES)) {
      if (addressUpper.includes(state)) {
        return rate;
      }
    }

    // Default US tax rate if state not found
    return 5.0;
  }
}

// Example usage
if (require.main === module) {
  const generator = new InvoiceGenerator();

  const ukOrder: Order = {
    id: 'INV-2024-001',
    customer: {
      id: 'CUST-123',
      name: 'John Doe',
      email: 'john@example.com',
      address: '456 Customer Lane, Manchester',
      country: 'UK'
    },
    items: [
      { name: 'Professional Services', price: 1500.00, quantity: 1 },
      { name: 'Software License', price: 299.99, quantity: 2 }
    ],
    date: new Date('2024-01-15')
  };

  console.log('UK Invoice:');
  console.log(generator.generatePDF(ukOrder));

  console.log('\n' + '='.repeat(70) + '\n');

  const usOrder: Order = {
    id: 'INV-2024-002',
    customer: {
      id: 'CUST-456',
      name: 'Jane Smith',
      email: 'jane@example.com',
      address: '789 Main Street, CA 90210',
      country: 'US'
    },
    items: [
      { name: 'Consulting', price: 2000.00, quantity: 1 },
      { name: 'Training', price: 500.00, quantity: 1, taxExempt: true }
    ],
    date: new Date('2024-01-20')
  };

  console.log('US Invoice (with tax-exempt item):');
  console.log(generator.generatePDF(usOrder));
}
