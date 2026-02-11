// Legacy Flight Booking API - Single File Implementation
// WARNING: This code is intentionally messy for training purposes
// DO NOT use as example of good code!

import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

// Global state - everything stored in memory
let flights: any[] = [];
let bookings: any[] = [];
let booking_counter = 0;

// Initialize flight data
function init_flights() {
  flights = [
    { id: 'FL001', from: 'LON', to: 'NYC', date: '2024-06-15', seats: 150, base_price: 450 },
    { id: 'FL002', from: 'NYC', to: 'LON', date: '2024-06-15', seats: 150, base_price: 450 },
    { id: 'FL003', from: 'LON', to: 'PAR', date: '2024-06-20', seats: 80, base_price: 120 },
    { id: 'FL004', from: 'PAR', to: 'LON', date: '2024-06-20', seats: 80, base_price: 120 },
    { id: 'FL005', from: 'NYC', to: 'TOK', date: '2024-07-10', seats: 200, base_price: 850 },
    { id: 'FL006', from: 'TOK', to: 'NYC', date: '2024-07-10', seats: 200, base_price: 850 },
    { id: 'FL007', from: 'PAR', to: 'TOK', date: '2024-08-05', seats: 120, base_price: 720 },
    { id: 'FL008', from: 'TOK', to: 'PAR', date: '2024-08-05', seats: 120, base_price: 720 },
    { id: 'FL009', from: 'LON', to: 'NYC', date: '2024-12-25', seats: 150, base_price: 450 },
    { id: 'FL010', from: 'NYC', to: 'LON', date: '2024-12-25', seats: 150, base_price: 450 }
  ];
}

init_flights();

// Discount codes
const DISCOUNT_CODES: any = {
  'SUMMER10': 0.10,
  'WINTER20': 0.20,
  'EARLYBIRD': 0.15,
  'STUDENT': 0.25
};

// Search flights endpoint
app.get('/flights', (req: any, res: any) => {
  const from = req.query.from;
  const to = req.query.to;
  const date = req.query.date;

  if (!from || !to || !date) {
    return res.status(400).json({ error: 'Missing required parameters: from, to, date' });
  }

  const available_flights = flights.filter((f: any) => {
    if (f.from === from && f.to === to && f.date === date && f.seats > 0) {
      return true;
    }
    return false;
  });

  // Calculate prices for each flight
  const flights_with_prices = available_flights.map((f: any) => {
    const base = f.base_price;
    let price = base;

    // Dynamic pricing based on availability
    const seats_left = f.seats;
    if (seats_left < 20) {
      price = price * 1.5;
    } else if (seats_left < 50) {
      price = price * 1.3;
    } else if (seats_left < 100) {
      price = price * 1.1;
    }

    // Seasonal adjustment
    const flight_date = new Date(f.date);
    const month = flight_date.getMonth() + 1;
    if (month >= 6 && month <= 8) {
      // Summer months
      price = price * 1.2;
    } else if (month === 12 || month === 1) {
      // Winter holidays
      price = price * 1.3;
    }

    return {
      id: f.id,
      from: f.from,
      to: f.to,
      date: f.date,
      seatsAvailable: f.seats,
      price: Math.round(price * 100) / 100
    };
  });

  res.json({ flights: flights_with_prices });
});

// Create booking endpoint
app.post('/bookings', (req: any, res: any) => {
  const body = req.body;

  // Validation
  if (!body.flightId) {
    return res.status(400).json({ error: 'Flight ID is required' });
  }
  if (!body.passengerName) {
    return res.status(400).json({ error: 'Passenger name is required' });
  }
  if (!body.passengerEmail) {
    return res.status(400).json({ error: 'Passenger email is required' });
  }
  if (!body.seatClass) {
    body.seatClass = 'economy';
  }

  // Check email format
  const email = body.passengerEmail;
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Find flight
  const flight = flights.find((f: any) => f.id === body.flightId);
  if (!flight) {
    return res.status(404).json({ error: 'Flight not found' });
  }

  // Check availability
  if (flight.seats <= 0) {
    return res.status(400).json({ error: 'No seats available' });
  }

  // Calculate price
  let total_price = 0;
  const base_price = flight.base_price;

  // Dynamic pricing
  const seats_left = flight.seats;
  let dynamic_multiplier = 1.0;
  if (seats_left < 20) {
    dynamic_multiplier = 1.5;
  } else if (seats_left < 50) {
    dynamic_multiplier = 1.3;
  } else if (seats_left < 100) {
    dynamic_multiplier = 1.1;
  }

  let price_after_dynamic = base_price * dynamic_multiplier;

  // Seasonal adjustment
  const flight_date = new Date(flight.date);
  const month = flight_date.getMonth() + 1;
  let seasonal_multiplier = 1.0;
  if (month >= 6 && month <= 8) {
    seasonal_multiplier = 1.2;
  } else if (month === 12 || month === 1) {
    seasonal_multiplier = 1.3;
  }

  price_after_dynamic = price_after_dynamic * seasonal_multiplier;

  // Seat class multiplier
  let seat_multiplier = 1.0;
  const seatClass = body.seatClass;
  if (seatClass === 'premium') {
    seat_multiplier = 1.5;
  } else if (seatClass === 'business') {
    seat_multiplier = 2.5;
  } else if (seatClass === 'economy') {
    seat_multiplier = 1.0;
  } else {
    return res.status(400).json({ error: 'Invalid seat class' });
  }

  let price_after_seat = price_after_dynamic * seat_multiplier;

  // Baggage fees
  const baggage_count = body.baggage || 0;
  const baggage_fee = baggage_count * 25;

  total_price = price_after_seat + baggage_fee;

  // Apply discount code
  if (body.discountCode) {
    const code = body.discountCode;
    if (DISCOUNT_CODES[code]) {
      const discount_percent = DISCOUNT_CODES[code];
      total_price = total_price * (1 - discount_percent);
    }
  }

  total_price = Math.round(total_price * 100) / 100;

  // Create booking
  booking_counter++;
  const booking_id = 'BK-' + Date.now() + '-' + booking_counter;

  const new_booking: any = {
    id: booking_id,
    flightId: body.flightId,
    flight: {
      from: flight.from,
      to: flight.to,
      date: flight.date
    },
    passengerName: body.passengerName,
    passengerEmail: body.passengerEmail,
    seatClass: seatClass,
    baggage: baggage_count,
    price: total_price,
    discountCode: body.discountCode || null,
    status: 'confirmed',
    bookedAt: new Date().toISOString()
  };

  bookings.push(new_booking);

  // Update flight seats
  flight.seats = flight.seats - 1;

  res.status(201).json(new_booking);
});

// Get booking endpoint
app.get('/bookings/:id', (req: any, res: any) => {
  const id = req.params.id;

  const booking = bookings.find((b: any) => b.id === id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json(booking);
});

// Cancel booking endpoint
app.delete('/bookings/:id', (req: any, res: any) => {
  const id = req.params.id;

  const booking_index = bookings.findIndex((b: any) => b.id === id);

  if (booking_index === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const booking = bookings[booking_index];

  if (booking.status === 'cancelled') {
    return res.status(400).json({ error: 'Booking already cancelled' });
  }

  // Calculate refund
  const booked_at = new Date(booking.bookedAt);
  const flight_date = new Date(booking.flight.date);
  const now = new Date();

  let refund_amount = 0;
  const hours_since_booking = (now.getTime() - booked_at.getTime()) / (1000 * 60 * 60);
  const days_until_flight = (flight_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  // Refund policy
  if (hours_since_booking <= 24) {
    // Full refund if cancelled within 24 hours of booking
    refund_amount = booking.price;
  } else if (days_until_flight > 7) {
    // 80% refund if cancelled more than 7 days before flight
    refund_amount = booking.price * 0.8;
  } else {
    // No refund if cancelled less than 7 days before flight
    refund_amount = 0;
  }

  refund_amount = Math.round(refund_amount * 100) / 100;

  // Update booking status
  booking.status = 'cancelled';
  booking.cancelledAt = now.toISOString();
  booking.refundAmount = refund_amount;

  // Restore flight seat
  const flight = flights.find((f: any) => f.id === booking.flightId);
  if (flight) {
    flight.seats = flight.seats + 1;
  }

  res.json({
    message: 'Booking cancelled',
    refundAmount: refund_amount,
    booking: booking
  });
});

// Update booking endpoint
app.put('/bookings/:id', (req: any, res: any) => {
  const id = req.params.id;
  const body = req.body;

  const booking = bookings.find((b: any) => b.id === id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot modify cancelled booking' });
  }

  // Check what can be updated
  let price_changed = false;
  let old_price = booking.price;
  let new_price = old_price;

  // Update seat class
  if (body.seatClass && body.seatClass !== booking.seatClass) {
    const old_class = booking.seatClass;
    const new_class = body.seatClass;

    if (new_class !== 'economy' && new_class !== 'premium' && new_class !== 'business') {
      return res.status(400).json({ error: 'Invalid seat class' });
    }

    // Recalculate price difference
    const flight = flights.find((f: any) => f.id === booking.flightId);
    if (!flight) {
      return res.status(500).json({ error: 'Flight not found' });
    }

    const base_price = flight.base_price;

    // Apply all the same pricing logic as booking creation
    const seats_left = flight.seats;
    let dynamic_multiplier = 1.0;
    if (seats_left < 20) {
      dynamic_multiplier = 1.5;
    } else if (seats_left < 50) {
      dynamic_multiplier = 1.3;
    } else if (seats_left < 100) {
      dynamic_multiplier = 1.1;
    }

    let price_with_dynamic = base_price * dynamic_multiplier;

    const flight_date = new Date(flight.date);
    const month = flight_date.getMonth() + 1;
    let seasonal_multiplier = 1.0;
    if (month >= 6 && month <= 8) {
      seasonal_multiplier = 1.2;
    } else if (month === 12 || month === 1) {
      seasonal_multiplier = 1.3;
    }

    price_with_dynamic = price_with_dynamic * seasonal_multiplier;

    // Calculate old class price
    let old_seat_multiplier = 1.0;
    if (old_class === 'premium') {
      old_seat_multiplier = 1.5;
    } else if (old_class === 'business') {
      old_seat_multiplier = 2.5;
    }

    const old_seat_price = price_with_dynamic * old_seat_multiplier;

    // Calculate new class price
    let new_seat_multiplier = 1.0;
    if (new_class === 'premium') {
      new_seat_multiplier = 1.5;
    } else if (new_class === 'business') {
      new_seat_multiplier = 2.5;
    }

    const new_seat_price = price_with_dynamic * new_seat_multiplier;

    const price_diff = new_seat_price - old_seat_price;
    new_price = old_price + price_diff;

    booking.seatClass = new_class;
    price_changed = true;
  }

  // Update baggage
  if (body.baggage !== undefined && body.baggage !== booking.baggage) {
    const old_baggage = booking.baggage;
    const new_baggage = body.baggage;

    const baggage_diff = new_baggage - old_baggage;
    const baggage_fee_diff = baggage_diff * 25;

    new_price = new_price + baggage_fee_diff;
    booking.baggage = new_baggage;
    price_changed = true;
  }

  if (price_changed) {
    new_price = Math.round(new_price * 100) / 100;
    booking.price = new_price;
    booking.updatedAt = new Date().toISOString();
  }

  res.json(booking);
});

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', flights: flights.length, bookings: bookings.length });
});

// Reset endpoint (for testing)
app.post('/reset', (req: any, res: any) => {
  bookings = [];
  booking_counter = 0;
  init_flights();
  res.json({ message: 'System reset' });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Flight Booking API running on port ${PORT}`);
  console.log(`Available routes: LON, NYC, PAR, TOK`);
  console.log(`Try: GET http://localhost:${PORT}/flights?from=LON&to=NYC&date=2024-06-15`);
});

export { app, server };
