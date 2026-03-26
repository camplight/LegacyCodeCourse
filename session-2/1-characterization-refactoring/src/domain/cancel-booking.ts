import { Booking, Result } from './types';
import { calculateRefund } from './pricing';
import { FlightRepository } from '../ports/flight-repository';
import { BookingRepository } from '../ports/booking-repository';

export interface CancelBookingResult {
  booking: Booking;
  refundAmount: number;
}

export function cancelBooking(
  id: string,
  bookingRepo: BookingRepository,
  flightRepo: FlightRepository,
  now: Date
): Result<CancelBookingResult> {
  const booking = bookingRepo.findById(id);
  if (!booking) {
    return { ok: false, error: 'Booking not found', status: 404 };
  }

  if (booking.status === 'cancelled') {
    return { ok: false, error: 'Booking already cancelled', status: 400 };
  }

  const refundAmount = calculateRefund(
    booking.price,
    new Date(booking.bookedAt),
    new Date(booking.flight.date),
    now
  );

  booking.status = 'cancelled';
  booking.cancelledAt = now.toISOString();
  booking.refundAmount = refundAmount;

  flightRepo.updateSeats(booking.flightId, +1);

  return { ok: true, data: { booking, refundAmount } };
}
