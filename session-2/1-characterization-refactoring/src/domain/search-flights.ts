import { FlightSearchResult } from './types';
import { calculateFlightPrice } from './pricing';
import { FlightRepository } from '../ports/flight-repository';

export function searchFlights(
  from: string,
  to: string,
  date: string,
  repository: FlightRepository
): FlightSearchResult[] {
  const available = repository.findAvailable(from, to, date);

  return available.map((f) => ({
    id: f.id,
    from: f.from,
    to: f.to,
    date: f.date,
    seatsAvailable: f.seats,
    price: calculateFlightPrice(f.base_price, f.seats, f.date),
  }));
}
