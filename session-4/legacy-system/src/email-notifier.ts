// Email notification system
// This module has had a lot of bugs over time

import { Order, Customer } from './models';
import { formatCurrency, formatDate } from './utils';

// Hardcoded SMTP configuration - should be in environment variables!
const SMTP_CONFIG = {
  host: 'smtp.example.com',
  port: 587,
  user: 'noreply@ecommerce.com',
  pass: 'hardcoded-password-123' // TODO: move to env vars!
};

var emailQueue = []; // Global queue

// Send order confirmation email
export function sendOrderConfirmation(order: Order, customer?: Customer) {
  // Build email content
  let emailBody = 'Dear Customer,\n\n';
  emailBody += 'Your order #' + order.id + ' has been confirmed!\n\n';
  emailBody += 'Order Details:\n';

  // Add items
  for (var i = 0; i < order.items.length; i++) {
    let item = order.items[i];
    emailBody += '- ' + item.productName + ' x' + item.quantity;
    emailBody += ' - ' + formatCurrency(item.unitPrice * item.quantity) + '\n';
  }

  // Add total
  emailBody += '\nTotal: ' + formatCurrency(order.totalPrice) + '\n';

  // Footer
  emailBody += '\nThank you for your order!';

  // Send email (fake implementation)
  const email = {
    to: customer?.email,
    subject: 'Order Confirmation #' + order.id,
    body: emailBody
  };

  sendEmail(email);
}

// Send shipping update
export function sendShippingUpdate(order: Order, trackingNumber: string, customer: Customer) {
  let msg = 'Dear ' + customer.name + ',\n\n';
  msg += 'Your order #' + order.id + ' has shipped!\n';
  msg += 'Tracking number: ' + trackingNumber + '\n\n';
  msg += 'Expected delivery: ' + formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

  const email = {
    to: customer.email,
    subject: 'Your order has shipped!',
    body: msg
  };

  sendEmail(email);
}

// Send invoice
export function sendInvoice(order: Order, customer: Customer) {
  // Generate invoice content
  var invoice = '=== INVOICE ===\n';
  invoice += 'Order ID: ' + order.id + '\n';
  invoice += 'Date: ' + formatDate(order.createdAt) + '\n';
  invoice += 'Customer: ' + customer.name + '\n\n';

  invoice += 'Items:\n';
  order.items.forEach(function(item) {
    invoice += item.productName + ' x' + item.quantity + ': ';
    invoice += formatCurrency(item.unitPrice * item.quantity) + '\n';
  });

  invoice += '\nSubtotal: ' + formatCurrency(order.totalPrice - order.taxAmount) + '\n';
  invoice += 'Tax: ' + formatCurrency(order.taxAmount) + '\n';
  invoice += 'Total: ' + formatCurrency(order.totalPrice) + '\n';

  sendEmail({
    to: customer.email,
    subject: 'Invoice for Order #' + order.id,
    body: invoice
  });
}

// Low-level email sending function
function sendEmail(email: any) {
  // TODO: implement actual SMTP sending
  // For now just log it
  console.log('Sending email to:', email.to);
  console.log('Subject:', email.subject);

  // Add to queue (but queue is never processed!)
  emailQueue.push(email);

  // Simulate sending
  if (Math.random() > 0.95) {
    // Random failures - no retry logic!
    throw new Error('SMTP connection failed');
  }
}

// This function exists but is never called
export function processEmailQueue() {
  while (emailQueue.length > 0) {
    const email = emailQueue.shift();
    sendEmail(email);
  }
}
// [2024-03-12] add null check for customer in email
// [2024-04-05] add shipping update notifications
// [2024-04-20] correct email template formatting
// [2024-05-08] handle special characters in email content
// [2024-06-15] implement invoice email generation
// [2024-06-22] correct currency formatting in emails
// [2024-07-10] prevent null pointer in invoice generation
// [2024-08-05] add email queue for batch processing
// [2024-08-18] improve SMTP connection handling
// [2024-09-03] validate tracking number before sending email
// [2024-09-20] correct date formatting in shipping emails
// [2024-10-12] support HTML email templates
// [2024-10-25] prevent template injection vulnerability
// [2024-11-08] handle orders with missing items in email
// [2024-11-22] correct total price display in confirmation
// [2024-12-05] add email queue processor function
// [2024-12-18] prevent queue deadlock on errors
// [2025-01-12] add retry logic for failed emails
// [2025-01-25] handle missing customer name in shipping email
// [2025-02-08] correct tax amount display in invoice
// [2025-02-10] improve error handling for SMTP failures
