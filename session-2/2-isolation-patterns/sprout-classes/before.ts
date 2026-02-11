// LEGACY INVOICE GENERATOR - Accounting System
// This is intentionally messy legacy code for training purposes

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
  country: string; // Not currently used
}

interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  date: Date;
}

// THE MONOLITHIC INVOICE GENERATOR
// Problems:
// - God class - does everything
// - String manipulation nightmare
// - Hard to test individual pieces
// - No separation of concerns
// - Business logic mixed with presentation
// - No tax calculation (just shows subtotal)
export class InvoiceGenerator {
  generatePDF(order: Order): string {
    // This would normally generate actual PDF, but we'll use text for demo
    let invoice = '';

    // Header section - lots of string manipulation
    invoice += '═'.repeat(60) + '\n';
    invoice += '                    INVOICE\n';
    invoice += '═'.repeat(60) + '\n';
    invoice += '\n';

    // Company info - hard-coded
    invoice += 'ACME Corporation\n';
    invoice += '123 Business Street\n';
    invoice += 'London, UK\n';
    invoice += '\n';

    // Customer info - messy formatting
    invoice += 'Bill To:\n';
    invoice += order.customer.name + '\n';
    invoice += order.customer.address + '\n';
    invoice += order.customer.email + '\n';
    invoice += '\n';

    // Invoice metadata
    invoice += '─'.repeat(60) + '\n';
    invoice += 'Invoice Number: ' + order.id + '\n';
    invoice += 'Date: ' + this.formatDate(order.date) + '\n';
    invoice += '─'.repeat(60) + '\n';
    invoice += '\n';

    // Line items - complex formatting logic
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

    // Totals section - NO TAX CALCULATION (requirement gap!)
    invoice += '\n';
    invoice += this.padRight('Subtotal:', 50) + '£' + subtotal.toFixed(2) + '\n';
    // TODO: Need to add tax calculation here!
    invoice += this.padRight('TOTAL:', 50) + '£' + subtotal.toFixed(2) + '\n';

    invoice += '\n';
    invoice += '═'.repeat(60) + '\n';
    invoice += '        Thank you for your business!\n';
    invoice += '═'.repeat(60) + '\n';

    return invoice;
  }

  // Helper methods - cluttering the class
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

// Example usage
if (require.main === module) {
  const generator = new InvoiceGenerator();

  const order: Order = {
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

  const invoice = generator.generatePDF(order);
  console.log(invoice);
}
