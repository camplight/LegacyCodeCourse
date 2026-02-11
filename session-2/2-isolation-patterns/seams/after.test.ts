// Tests for Seams Pattern - Demonstrating Testability
// The seam (interface) allows us to inject mock behavior for testing

import { OrderProcessor, INotificationService } from './after';

// Mock implementation for testing - no real side effects!
class MockNotificationService implements INotificationService {
  public sentNotifications: Array<{
    to: string;
    subject: string;
    body: string;
  }> = [];

  send(to: string, subject: string, body: string): void {
    // Just record the call instead of sending real notifications
    this.sentNotifications.push({ to, subject, body });
  }

  // Helper methods for testing
  getSentCount(): number {
    return this.sentNotifications.length;
  }

  getLastNotification() {
    return this.sentNotifications[this.sentNotifications.length - 1];
  }
}

describe('OrderProcessor with Seams', () => {
  let mockNotifier: MockNotificationService;
  let processor: OrderProcessor;

  beforeEach(() => {
    // Inject mock implementation - the seam allows this!
    mockNotifier = new MockNotificationService();
    processor = new OrderProcessor(mockNotifier);
  });

  it('should process valid order and send notification', () => {
    const order = {
      id: 'ORD-001',
      customerId: 'CUST-123',
      customerEmail: 'test@example.com',
      items: [{ name: 'Widget', price: 10, quantity: 2 }],
      total: 20,
      status: 'pending' as const
    };

    processor.processOrder(order);

    // Business logic verification
    expect(order.status).toBe('processing');

    // Notification verification - no real emails sent!
    expect(mockNotifier.getSentCount()).toBe(1);
    expect(mockNotifier.getLastNotification().to).toBe('test@example.com');
    expect(mockNotifier.getLastNotification().subject).toContain('ORD-001');
  });

  it('should throw error for empty order', () => {
    const emptyOrder = {
      id: 'ORD-002',
      customerId: 'CUST-123',
      customerEmail: 'test@example.com',
      items: [],
      total: 0,
      status: 'pending' as const
    };

    expect(() => processor.processOrder(emptyOrder)).toThrow('at least one item');

    // Verify no notification was sent
    expect(mockNotifier.getSentCount()).toBe(0);
  });

  it('should throw error for total mismatch', () => {
    const invalidOrder = {
      id: 'ORD-003',
      customerId: 'CUST-123',
      customerEmail: 'test@example.com',
      items: [{ name: 'Widget', price: 10, quantity: 2 }],
      total: 999, // Wrong total!
      status: 'pending' as const
    };

    expect(() => processor.processOrder(invalidOrder)).toThrow('total mismatch');

    // Verify no notification was sent
    expect(mockNotifier.getSentCount()).toBe(0);
  });

  it('should include order details in notification', () => {
    const order = {
      id: 'ORD-004',
      customerId: 'CUST-456',
      customerEmail: 'customer@example.com',
      items: [
        { name: 'Widget', price: 29.99, quantity: 2 },
        { name: 'Gadget', price: 49.99, quantity: 1 }
      ],
      total: 109.97,
      status: 'pending' as const
    };

    processor.processOrder(order);

    const notification = mockNotifier.getLastNotification();
    expect(notification.body).toContain('ORD-004');
    expect(notification.body).toContain('Widget');
    expect(notification.body).toContain('Gadget');
    expect(notification.body).toContain('109.97');
  });
});
