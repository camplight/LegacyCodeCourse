import { Flight } from '../domain/types';

export interface FlightRepository {
  findAvailable(from: string, to: string, date: string): Flight[];
  findById(id: string): Flight | undefined;
  updateSeats(flightId: string, delta: number): void;
  count(): number;
  reset(): void;
}
