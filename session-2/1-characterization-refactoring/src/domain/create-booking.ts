import { Booking, CreateBookingInput, Result } from './types';
import { calculateBookingPrice, isValidSeatClass } from './pricing';
import { FlightRepository } from '../ports/flight-repository';
import { BookingRepository } from '../ports/booking-repository';

export function createBooking(
  input: CreateBookingInput,
  flightRepo: FlightRepository,
  bookingRepo: BookingRepository,
  now: Date
): Result<Booking> {
  if (!input.flightId) {
    return { ok: false, error: 'Flight ID is required', status: 400 };
  }
  if (!input.passengerName) {
    return { ok: false, error: 'Passenger name is required', status: 400 };
  }
  if (!input.passengerEmail) {
    return { ok: false, error: 'Passenger email is required', status: 400 };
  }

  const seatClass = input.seatClass || 'economy';

  const email = input.passengerEmail;
  if (!email.includes('@') || !email.includes('.')) {
    return { ok: false, error: 'Invalid email format', status: 400 };
  }

  const flight = flightRepo.findById(input.flightId);
  if (!flight) {
    return { ok: false, error: 'Flight not found', status: 404 };
  }

  if (flight.seats <= 0) {
    return { ok: false, error: 'No seats available', status: 400 };
  }

  if (!isValidSeatClass(seatClass)) {
    return { ok: false, error: 'Invalid seat class', status: 400 };
  }

  const baggageCount = input.baggage || 0;
  const discountCode = input.discountCode || null;

  const price = calculateBookingPrice(
    flight.base_price, flight.seats, flight.date,
    seatClass, baggageCount, discountCode
  );

  const booking: Booking = {
    id: bookingRepo.nextId(now),
    flightId: input.flightId,
    flight: { from: flight.from, to: flight.to, date: flight.date },
    passengerName: input.passengerName,
    passengerEmail: input.passengerEmail,
    seatClass,
    baggage: baggageCount,
    price,
    discountCode,
    status: 'confirmed',
    bookedAt: now.toISOString(),
  };

  bookingRepo.save(booking);
  flightRepo.updateSeats(input.flightId, -1);

  return { ok: true, data: booking };
}
