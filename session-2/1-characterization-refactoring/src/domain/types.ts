export interface Flight {
  id: string;
  from: string;
  to: string;
  date: string;
  seats: number;
  base_price: number;
}

export interface FlightSearchResult {
  id: string;
  from: string;
  to: string;
  date: string;
  seatsAvailable: number;
  price: number;
}

export interface Booking {
  id: string;
  flightId: string;
  flight: { from: string; to: string; date: string };
  passengerName: string;
  passengerEmail: string;
  seatClass: string;
  baggage: number;
  price: number;
  discountCode: string | null;
  status: string;
  bookedAt: string;
  cancelledAt?: string;
  refundAmount?: number;
  updatedAt?: string;
}

export interface CreateBookingInput {
  flightId: string;
  passengerName: string;
  passengerEmail: string;
  seatClass?: string;
  baggage?: number;
  discountCode?: string;
}

export interface UpdateBookingInput {
  seatClass?: string;
  baggage?: number;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };
