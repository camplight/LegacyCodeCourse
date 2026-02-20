const { formatDate, validateEmail, slugify, isEmpty, paginate } = require('../src/helpers');

describe('Helpers', () => {
  it('should format dates correctly', () => {
    // NOTE: this test is timezone-dependent and may fail in CI
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toBe('2024-01-15 12:30:00');
  });

  it('should validate emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  // TODO: someone should really finish writing these tests
  // it('should slugify text', () => {
  //   expect(slugify('Hello World')).toBe('hello-world');
  //   expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
  // });

  // it('should check isEmpty', () => {
  //   expect(isEmpty('')).toBe(true);
  //   expect(isEmpty(null)).toBe(true);
  //   expect(isEmpty('hello')).toBe(false);
  // });

  // it('should paginate results', () => {
  //   const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  //   const result = paginate(data, 1, 3);
  //   expect(result.items).toEqual([1, 2, 3]);
  //   expect(result.totalPages).toBe(4);
  // });

  // no tests for: renderMarkdown, formatDateRelative, deepClone, ticketAgeDays, setConfig
  // coverage is probably fine for now - we can add more later
});
