export function dynamicPricingMultiplier(seatsRemaining: number): number {
  if (seatsRemaining < 20) return 1.5;
  if (seatsRemaining < 50) return 1.3;
  if (seatsRemaining < 100) return 1.1;
  return 1.0;
}

export function seasonalMultiplier(date: string): number {
  const month = new Date(date).getMonth() + 1;
  if (month >= 6 && month <= 8) return 1.2;
  if (month === 12 || month === 1) return 1.3;
  return 1.0;
}

export function baseFlightPrice(
  basePrice: number,
  seatsRemaining: number,
  date: string
): number {
  return basePrice * dynamicPricingMultiplier(seatsRemaining) * seasonalMultiplier(date);
}

export function calculateFlightPrice(
  basePrice: number,
  seatsRemaining: number,
  date: string
): number {
  return Math.round(baseFlightPrice(basePrice, seatsRemaining, date) * 100) / 100;
}

// Booking-specific pricing

export const DISCOUNT_CODES: Record<string, number> = {
  'SUMMER10': 0.10,
  'WINTER20': 0.20,
  'EARLYBIRD': 0.15,
  'STUDENT': 0.25,
};

export function isValidSeatClass(seatClass: string): boolean {
  return seatClass === 'economy' || seatClass === 'premium' || seatClass === 'business';
}

export function seatClassMultiplier(seatClass: string): number {
  if (seatClass === 'premium') return 1.5;
  if (seatClass === 'business') return 2.5;
  return 1.0;
}

export function calculateBookingPrice(
  basePrice: number,
  seatsRemaining: number,
  date: string,
  seatClass: string,
  baggageCount: number,
  discountCode: string | null
): number {
  let price = baseFlightPrice(basePrice, seatsRemaining, date) * seatClassMultiplier(seatClass);
  price += baggageCount * 25;

  if (discountCode && DISCOUNT_CODES[discountCode]) {
    price *= (1 - DISCOUNT_CODES[discountCode]);
  }

  return Math.round(price * 100) / 100;
}

export function calculateRefund(
  bookingPrice: number,
  bookedAt: Date,
  flightDate: Date,
  now: Date
): number {
  const hoursSinceBooking = (now.getTime() - bookedAt.getTime()) / (1000 * 60 * 60);
  const daysUntilFlight = (flightDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  let refund = 0;
  if (hoursSinceBooking <= 24) {
    refund = bookingPrice;
  } else if (daysUntilFlight > 7) {
    refund = bookingPrice * 0.8;
  }

  return Math.round(refund * 100) / 100;
}
