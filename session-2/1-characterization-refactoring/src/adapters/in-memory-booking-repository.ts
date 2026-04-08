import { Booking } from '../domain/types';
import { BookingRepository } from '../ports/booking-repository';

export class InMemoryBookingRepository implements BookingRepository {
  private bookings: Booking[] = [];
  private counter = 0;

  nextId(now: Date): string {
    this.counter++;
    return `BK-${now.getTime()}-${this.counter}`;
  }

  save(booking: Booking): void {
    this.bookings.push(booking);
  }

  findById(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id);
  }

  count(): number {
    return this.bookings.length;
  }

  reset(): void {
    this.bookings = [];
    this.counter = 0;
  }
}
