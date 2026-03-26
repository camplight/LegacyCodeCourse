import { Booking, UpdateBookingInput, Result } from './types';
import { baseFlightPrice, seatClassMultiplier, isValidSeatClass } from './pricing';
import { FlightRepository } from '../ports/flight-repository';
import { BookingRepository } from '../ports/booking-repository';

export function updateBooking(
  id: string,
  changes: UpdateBookingInput,
  bookingRepo: BookingRepository,
  flightRepo: FlightRepository,
  now: Date
): Result<Booking> {
  const booking = bookingRepo.findById(id);
  if (!booking) {
    return { ok: false, error: 'Booking not found', status: 404 };
  }

  if (booking.status === 'cancelled') {
    return { ok: false, error: 'Cannot modify cancelled booking', status: 400 };
  }

  let priceChanged = false;
  let newPrice = booking.price;

  if (changes.seatClass && changes.seatClass !== booking.seatClass) {
    if (!isValidSeatClass(changes.seatClass)) {
      return { ok: false, error: 'Invalid seat class', status: 400 };
    }

    const flight = flightRepo.findById(booking.flightId);
    if (!flight) {
      return { ok: false, error: 'Flight not found', status: 500 };
    }

    const baseDynSeas = baseFlightPrice(flight.base_price, flight.seats, flight.date);
    const oldSeatPrice = baseDynSeas * seatClassMultiplier(booking.seatClass);
    const newSeatPrice = baseDynSeas * seatClassMultiplier(changes.seatClass);
    newPrice += (newSeatPrice - oldSeatPrice);

    booking.seatClass = changes.seatClass;
    priceChanged = true;
  }

  if (changes.baggage !== undefined && changes.baggage !== booking.baggage) {
    const baggageDiff = changes.baggage - booking.baggage;
    newPrice += baggageDiff * 25;
    booking.baggage = changes.baggage;
    priceChanged = true;
  }

  if (priceChanged) {
    booking.price = Math.round(newPrice * 100) / 100;
    booking.updatedAt = now.toISOString();
  }

  return { ok: true, data: booking };
}
