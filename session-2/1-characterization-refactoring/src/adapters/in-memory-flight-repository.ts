import { Flight } from '../domain/types';
import { FlightRepository } from '../ports/flight-repository';

const SEED_FLIGHTS: Flight[] = [
  { id: 'FL001', from: 'LON', to: 'NYC', date: '2024-06-15', seats: 150, base_price: 450 },
  { id: 'FL002', from: 'NYC', to: 'LON', date: '2024-06-15', seats: 150, base_price: 450 },
  { id: 'FL003', from: 'LON', to: 'PAR', date: '2024-06-20', seats: 80, base_price: 120 },
  { id: 'FL004', from: 'PAR', to: 'LON', date: '2024-06-20', seats: 80, base_price: 120 },
  { id: 'FL005', from: 'NYC', to: 'TOK', date: '2024-07-10', seats: 200, base_price: 850 },
  { id: 'FL006', from: 'TOK', to: 'NYC', date: '2024-07-10', seats: 200, base_price: 850 },
  { id: 'FL007', from: 'PAR', to: 'TOK', date: '2024-08-05', seats: 120, base_price: 720 },
  { id: 'FL008', from: 'TOK', to: 'PAR', date: '2024-08-05', seats: 120, base_price: 720 },
  { id: 'FL009', from: 'LON', to: 'NYC', date: '2024-12-25', seats: 150, base_price: 450 },
  { id: 'FL010', from: 'NYC', to: 'LON', date: '2024-12-25', seats: 150, base_price: 450 },
];

export class InMemoryFlightRepository implements FlightRepository {
  private flights: Flight[] = [];

  constructor() {
    this.reset();
  }

  findAvailable(from: string, to: string, date: string): Flight[] {
    return this.flights.filter(
      (f) => f.from === from && f.to === to && f.date === date && f.seats > 0
    );
  }

  findById(id: string): Flight | undefined {
    return this.flights.find((f) => f.id === id);
  }

  updateSeats(flightId: string, delta: number): void {
    const flight = this.findById(flightId);
    if (flight) {
      flight.seats += delta;
    }
  }

  count(): number {
    return this.flights.length;
  }

  reset(): void {
    this.flights = SEED_FLIGHTS.map((f) => ({ ...f }));
  }
}
