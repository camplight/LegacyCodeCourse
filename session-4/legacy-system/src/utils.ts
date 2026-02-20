// Utility functions
// Some are used, some are not (dead code)

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatCurrency(amount: number): string {
  return '$' + amount.toFixed(2);
}

export function formatDate(date: Date): string {
  // TODO: use proper date library
  return date.toISOString().split('T')[0];
}

// This function is never used but no one dares to remove it
export function calculatePercentage(part: number, whole: number): number {
  return (part / whole) * 100;
}

// Duplicate of formatCurrency but with different name
export function toDollars(amt: any) {
  return '$' + amt.toFixed(2);
}

export function isValidEmail(email: string): boolean {
  // Oversimplified regex that misses many edge cases
  return /\S+@\S+\.\S+/.test(email);
}

// Another unused function
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
