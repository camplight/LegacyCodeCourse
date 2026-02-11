// SEAMS PATTERN - Dependency Injection
// This demonstrates creating seams through interfaces and DI

// ============================================================================
// INTERFACE - The Seam (behavior abstraction)
// ============================================================================

// This interface creates a "seam" - a point where we can change behavior
// Different implementations can be plugged in without changing OrderProcessor
export interface INotificationService {
  send(to: string, subject: string, body: string): void;
}

// ============================================================================
// IMPLEMENTATIONS - Different behaviors for the seam
// ============================================================================

// Original email implementation (same logic as before, but now implements interface)
export class EmailNotificationService implements INotificationService {
  private config = {
    host: 'smtp.company.com',
    port: 587,
    user: 'orders@company.com',
    password: 'super-secret-password'
  };

  send(to: string, subject: string, body: string): void {
    console.log(`[EMAIL] Connecting to ${this.config.host}:${this.config.port}`);
    console.log(`[EMAIL] Sending to ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Email sent!`);
  }
}

// NEW: SMS notification implementation
export class SmsNotificationService implements INotificationService {
  private apiKey = 'sms-api-key-12345';
  private apiUrl = 'https://api.sms-provider.com/send';

  send(to: string, subject: string, body: string): void {
    // Convert email to phone number (in real code, you'd look this up in a database)
    const phoneNumber = this.lookupPhoneNumber(to);

    console.log(`[SMS] Calling API: ${this.apiUrl}`);
    console.log(`[SMS] Sending to ${phoneNumber}`);
    console.log(`[SMS] Message: ${subject} - ${body.substring(0, 50)}...`);
    console.log(`[SMS] SMS sent!`);
  }

  private lookupPhoneNumber(email: string): string {
    // Mock phone lookup
    return '+44 7700 900000';
  }
}

// NEW: Composite implementation - sends both email and SMS
export class CompositeNotificationService implements INotificationService {
  constructor(
    private services: INotificationService[]
  ) {}

  send(to: string, subject: string, body: string): void {
    console.log(`[COMPOSITE] Sending via ${this.services.length} channels`);
    this.services.forEach(service => service.send(to, subject, body));
  }
}

// ============================================================================
// ORDER PROCESSOR - Now with Dependency Injection
// ============================================================================

interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}

// Same business logic, but now testable!
export class OrderProcessor {
  // THE KEY CHANGE: Dependency injection via constructor
  // Behavior can now be changed by passing different implementations
  constructor(
    private notificationService: INotificationService
  ) {}

  processOrder(order: Order): void {
    // Validate order (business logic unchanged)
    if (!order.items || order.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const calculatedTotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (calculatedTotal !== order.total) {
      throw new Error('Order total mismatch');
    }

    // Update order status
    order.status = 'processing';

    // Send notification using injected service
    // ZERO changes to this logic - but behavior can vary!
    const subject = `Order Confirmation - ${order.id}`;
    const body = this.formatOrderEmail(order);
    this.notificationService.send(order.customerEmail, subject, body);

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

// ============================================================================
// FACTORY - Business logic for choosing notification method
// ============================================================================

export class NotificationFactory {
  static createForOrder(order: Order): INotificationService {
    // High-value orders get both email and SMS
    if (order.total > 500) {
      return new CompositeNotificationService([
        new EmailNotificationService(),
        new SmsNotificationService()
      ]);
    }

    // Regular orders get email only
    return new EmailNotificationService();
  }
}

// Example usage
if (require.main === module) {
  const regularOrder: Order = {
    id: 'ORD-001',
    customerId: 'CUST-123',
    customerEmail: 'customer@example.com',
    items: [{ name: 'Widget', price: 29.99, quantity: 2 }],
    total: 59.98,
    status: 'pending'
  };

  const highValueOrder: Order = {
    id: 'ORD-002',
    customerId: 'CUST-456',
    customerEmail: 'vip@example.com',
    items: [{ name: 'Premium Gadget', price: 599.99, quantity: 1 }],
    total: 599.99,
    status: 'pending'
  };

  // Regular order - email only
  console.log('Processing regular order:');
  const emailProcessor = new OrderProcessor(new EmailNotificationService());
  emailProcessor.processOrder(regularOrder);

  console.log('\n---\n');

  // High-value order - email + SMS
  console.log('Processing high-value order:');
  const notificationService = NotificationFactory.createForOrder(highValueOrder);
  const compositeProcessor = new OrderProcessor(notificationService);
  compositeProcessor.processOrder(highValueOrder);
}
