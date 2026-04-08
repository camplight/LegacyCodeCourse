import { Booking } from '../domain/types';

export interface BookingRepository {
  nextId(now: Date): string;
  save(booking: Booking): void;
  findById(id: string): Booking | undefined;
  count(): number;
  reset(): void;
}
