import express from 'express';
import bodyParser from 'body-parser';
import { InMemoryFlightRepository } from './adapters/in-memory-flight-repository';
import { InMemoryBookingRepository } from './adapters/in-memory-booking-repository';
import { searchFlights } from './domain/search-flights';
import { createBooking } from './domain/create-booking';
import { cancelBooking } from './domain/cancel-booking';
import { updateBooking } from './domain/update-booking';

const app = express();
app.use(bodyParser.json());

const flightRepository = new InMemoryFlightRepository();
const bookingRepository = new InMemoryBookingRepository();

// Search flights
app.get('/flights', (req: any, res: any) => {
  const from = req.query.from;
  const to = req.query.to;
  const date = req.query.date;

  if (!from || !to || !date) {
    return res.status(400).json({ error: 'Missing required parameters: from, to, date' });
  }

  const results = searchFlights(from, to, date, flightRepository);
  res.json({ flights: results });
});

// Create booking
app.post('/bookings', (req: any, res: any) => {
  const result: any = createBooking(req.body, flightRepository, bookingRepository, new Date());
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  res.status(201).json(result.data);
});

// Get booking
app.get('/bookings/:id', (req: any, res: any) => {
  const booking = bookingRepository.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  res.json(booking);
});

// Cancel booking
app.delete('/bookings/:id', (req: any, res: any) => {
  const result: any = cancelBooking(req.params.id, bookingRepository, flightRepository, new Date());
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json({
    message: 'Booking cancelled',
    refundAmount: result.data.refundAmount,
    booking: result.data.booking,
  });
});

// Update booking
app.put('/bookings/:id', (req: any, res: any) => {
  const result: any = updateBooking(
    req.params.id, req.body, bookingRepository, flightRepository, new Date()
  );
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  res.json(result.data);
});

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', flights: flightRepository.count(), bookings: bookingRepository.count() });
});

// Reset (for testing)
app.post('/reset', (req: any, res: any) => {
  bookingRepository.reset();
  flightRepository.reset();
  res.json({ message: 'System reset' });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Flight Booking API running on port ${PORT}`);
  console.log(`Available routes: LON, NYC, PAR, TOK`);
  console.log(`Try: GET http://localhost:${PORT}/flights?from=LON&to=NYC&date=2024-06-15`);
});

export { app, server };
