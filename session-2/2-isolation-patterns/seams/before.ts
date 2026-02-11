// LEGACY ORDER PROCESSOR - E-commerce System
// This is intentionally messy legacy code for training purposes

// Hard-coded email configuration - tightly coupled
const SMTP_CONFIG = {
  host: 'smtp.company.com',
  port: 587,
  user: 'orders@company.com',
  password: 'super-secret-password' // Security issue: hard-coded credentials
};

// Mock SMTP library
class EmailService {
  // Directly couples to real SMTP - impossible to test without sending emails
  sendEmail(to: string, subject: string, body: string): void {
    console.log(`[SMTP] Connecting to ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}`);
    console.log(`[SMTP] Authenticating as ${SMTP_CONFIG.user}`);
    console.log(`[SMTP] Sending email to ${to}`);
    console.log(`[SMTP] Subject: ${subject}`);
    console.log(`[SMTP] Body: ${body}`);
    console.log(`[SMTP] Email sent successfully!`);

    // In real code, this would be:
    // const transporter = nodemailer.createTransport(SMTP_CONFIG);
    // transporter.sendMail({ to, subject, text: body });
  }
}

// Order types
interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}

// THE PROBLEMATIC ORDER PROCESSOR
// Problems:
// - Direct instantiation of EmailService inside method
// - Tightly coupled to specific implementation
// - Impossible to test without sending real emails
// - No way to mock or substitute behavior
// - Hard-coded notification logic
export class OrderProcessor {
  processOrder(order: Order): void {
    // Validate order
    if (!order.items || order.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Calculate total (business logic)
    const calculatedTotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (calculatedTotal !== order.total) {
      throw new Error('Order total mismatch');
    }

    // Update order status
    order.status = 'processing';

    // THE PROBLEM: Direct instantiation creates tight coupling
    // No way to test this without sending real emails!
    const emailer = new EmailService();

    // Send confirmation email
    const subject = `Order Confirmation - ${order.id}`;
    const body = this.formatOrderEmail(order);
    emailer.sendEmail(order.customerEmail, subject, body);

    console.log(`Order ${order.id} processed successfully`);
  }

  private formatOrderEmail(order: Order): string {
    let body = `Thank you for your order!\n\n`;
    body += `Order ID: ${order.id}\n`;
    body += `Items:\n`;
    order.items.forEach(item => {
      body += `  - ${item.name} x${item.quantity} @ £${item.price}\n`;
    });
    body += `\nTotal: £${order.total}\n`;
    return body;
  }
}

// Example usage
if (require.main === module) {
  const processor = new OrderProcessor();

  const order: Order = {
    id: 'ORD-001',
    customerId: 'CUST-123',
    customerEmail: 'customer@example.com',
    items: [
      { name: 'Widget', price: 29.99, quantity: 2 },
      { name: 'Gadget', price: 49.99, quantity: 1 }
    ],
    total: 109.97,
    status: 'pending'
  };

  processor.processOrder(order);
}
