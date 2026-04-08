/**
 * Characterization tests for the booking endpoints:
 *   POST   /bookings
 *   GET    /bookings/:id
 *   DELETE /bookings/:id
 *   PUT    /bookings/:id
 *
 * These tests lock externally observable behavior as a safety net for refactors.
 * Assertions encode *observed* behavior, including quirks.
 */

import request from 'supertest';
import { app, server } from '../src/flight-booking-api';

afterAll((done) => {
  server.close(done);
});

beforeEach(async () => {
  await request(app).post('/reset');
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_BOOKING = {
  flightId: 'FL001', // LON→NYC, 2024-06-15, 150 seats, base $450
  passengerName: 'Jane Doe',
  passengerEmail: 'jane@example.com',
  seatClass: 'economy',
};

async function createBooking(overrides: Record<string, any> = {}) {
  return request(app)
    .post('/bookings')
    .send({ ...VALID_BOOKING, ...overrides });
}

// ===================================================================
// POST /bookings — Validation
// ===================================================================

describe('POST /bookings — validation', () => {
  it('returns 400 when flightId is missing', async () => {
    const res = await createBooking({ flightId: undefined });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Flight ID is required' });
  });

  it('returns 400 when passengerName is missing', async () => {
    const res = await createBooking({ passengerName: undefined });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Passenger name is required' });
  });

  it('returns 400 when passengerEmail is missing', async () => {
    const res = await createBooking({ passengerEmail: undefined });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Passenger email is required' });
  });

  it('returns 400 when email has no @ sign', async () => {
    const res = await createBooking({ passengerEmail: 'jane.example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid email format' });
  });

  it('returns 400 when email has no dot', async () => {
    const res = await createBooking({ passengerEmail: 'jane@example' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid email format' });
  });

  // NOTE: possible bug (characterized intentionally) — "@." passes email validation
  it('accepts "@." as a valid email', async () => {
    const res = await createBooking({ passengerEmail: '@.' });
    expect(res.status).toBe(201);
  });

  it('returns 404 when flight does not exist', async () => {
    const res = await createBooking({ flightId: 'NOPE' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Flight not found' });
  });

  it('returns 400 when no seats available', async () => {
    // FL003 has 80 seats — book them all, then try one more
    for (let i = 0; i < 80; i++) {
      await createBooking({
        flightId: 'FL003',
        passengerEmail: `fill${i}@test.com`,
      });
    }
    const res = await createBooking({
      flightId: 'FL003',
      passengerEmail: 'overflow@test.com',
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'No seats available' });
  });

  it('returns 400 for invalid seat class', async () => {
    const res = await createBooking({ seatClass: 'first' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid seat class' });
  });

  it('defaults seatClass to economy when not provided', async () => {
    const res = await createBooking({ seatClass: undefined });
    expect(res.status).toBe(201);
    expect(res.body.seatClass).toBe('economy');
  });
});

// ===================================================================
// POST /bookings — Pricing
// ===================================================================

describe('POST /bookings — pricing', () => {
  // FL001: base $450, dynamic ×1.0 (150 seats), seasonal ×1.2 (June)
  // Economy base: 450 * 1.0 * 1.2 = $540

  it('calculates economy price correctly', async () => {
    const res = await createBooking({ seatClass: 'economy' });
    expect(res.body.price).toBe(540);
  });

  it('calculates premium price (×1.5 seat multiplier)', async () => {
    const res = await createBooking({ seatClass: 'premium' });
    expect(res.body.price).toBe(810);
  });

  it('calculates business price (×2.5 seat multiplier)', async () => {
    const res = await createBooking({ seatClass: 'business' });
    expect(res.body.price).toBe(1350);
  });

  it('adds $25 per bag for baggage', async () => {
    const res = await createBooking({ baggage: 2 });
    // 540 + (2 × 25) = 590
    expect(res.body.price).toBe(590);
    expect(res.body.baggage).toBe(2);
  });

  it('treats missing baggage as 0', async () => {
    const res = await createBooking({});
    expect(res.body.baggage).toBe(0);
    expect(res.body.price).toBe(540);
  });

  it('applies SUMMER10 discount (10%)', async () => {
    const res = await createBooking({ discountCode: 'SUMMER10' });
    // 540 * 0.90 = 486
    expect(res.body.price).toBe(486);
  });

  it('applies WINTER20 discount (20%)', async () => {
    const res = await createBooking({ discountCode: 'WINTER20' });
    // 540 * 0.80 = 432
    expect(res.body.price).toBe(432);
  });

  it('applies EARLYBIRD discount (15%)', async () => {
    const res = await createBooking({ discountCode: 'EARLYBIRD' });
    // 540 * 0.85 = 459
    expect(res.body.price).toBe(459);
  });

  it('applies STUDENT discount (25%)', async () => {
    const res = await createBooking({ discountCode: 'STUDENT' });
    // 540 * 0.75 = 405
    expect(res.body.price).toBe(405);
  });

  // NOTE: possible bug (characterized intentionally) — invalid discount code silently ignored
  it('silently ignores invalid discount code (no error, no discount)', async () => {
    const res = await createBooking({ discountCode: 'BOGUS' });
    expect(res.status).toBe(201);
    expect(res.body.price).toBe(540);
    expect(res.body.discountCode).toBe('BOGUS');
  });

  // NOTE: possible bug (characterized intentionally) — discount applied AFTER baggage fees
  it('applies discount to total including baggage fees', async () => {
    const res = await createBooking({ baggage: 2, discountCode: 'SUMMER10' });
    // (540 + 50) * 0.90 = 531
    expect(res.body.price).toBe(531);
  });

  it('uses winter seasonal pricing for December flight', async () => {
    // FL009: LON→NYC, 2024-12-25, 150 seats, base $450
    // 450 * 1.0 * 1.3 = 585
    const res = await createBooking({ flightId: 'FL009' });
    expect(res.body.price).toBe(585);
  });
});

// ===================================================================
// POST /bookings — Response shape and side effects
// ===================================================================

describe('POST /bookings — response & side effects', () => {
  it('returns 201 with all expected fields', async () => {
    const res = await createBooking();
    expect(res.status).toBe(201);

    const b = res.body;
    expect(b.id).toMatch(/^BK-\d+-\d+$/);
    expect(b.flightId).toBe('FL001');
    expect(b.flight).toEqual({ from: 'LON', to: 'NYC', date: '2024-06-15' });
    expect(b.passengerName).toBe('Jane Doe');
    expect(b.passengerEmail).toBe('jane@example.com');
    expect(b.seatClass).toBe('economy');
    expect(b.baggage).toBe(0);
    expect(b.price).toBe(540);
    expect(b.discountCode).toBeNull();
    expect(b.status).toBe('confirmed');
    expect(new Date(b.bookedAt).toISOString()).toBe(b.bookedAt);
  });

  it('stores discountCode in response even when null', async () => {
    const res = await createBooking({});
    expect(res.body.discountCode).toBeNull();
  });

  it('decrements flight seats by 1 per booking', async () => {
    await createBooking();
    // Check via the /flights search endpoint
    const search = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-06-15'
    );
    expect(search.body.flights[0].seatsAvailable).toBe(149);
  });

  it('assigns unique booking IDs with incrementing counter', async () => {
    const r1 = await createBooking({ passengerEmail: 'a@b.com' });
    const r2 = await createBooking({ passengerEmail: 'c@d.com' });
    expect(r1.body.id).not.toBe(r2.body.id);
    // Both match the pattern
    expect(r1.body.id).toMatch(/^BK-\d+-\d+$/);
    expect(r2.body.id).toMatch(/^BK-\d+-\d+$/);
  });
});

// ===================================================================
// GET /bookings/:id
// ===================================================================

describe('GET /bookings/:id', () => {
  it('returns the booking when found', async () => {
    const created = await createBooking();
    const id = created.body.id;

    const res = await request(app).get(`/bookings/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.passengerName).toBe('Jane Doe');
  });

  it('returns 404 when booking does not exist', async () => {
    const res = await request(app).get('/bookings/BK-0-0');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Booking not found' });
  });

  it('returns the full booking object unchanged', async () => {
    const created = await createBooking();
    const fetched = await request(app).get(`/bookings/${created.body.id}`);
    expect(fetched.body).toEqual(created.body);
  });
});

// ===================================================================
// DELETE /bookings/:id — Cancel booking
// ===================================================================

describe('DELETE /bookings/:id — basic', () => {
  it('returns 404 when booking does not exist', async () => {
    const res = await request(app).delete('/bookings/BK-0-0');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Booking not found' });
  });

  it('returns 400 when booking is already cancelled', async () => {
    const created = await createBooking();
    await request(app).delete(`/bookings/${created.body.id}`);
    const res = await request(app).delete(`/bookings/${created.body.id}`);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Booking already cancelled' });
  });

  it('returns correct response shape', async () => {
    const created = await createBooking();
    const res = await request(app).delete(`/bookings/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Booking cancelled');
    expect(typeof res.body.refundAmount).toBe('number');
    expect(res.body.booking.status).toBe('cancelled');
    expect(
      new Date(res.body.booking.cancelledAt).toISOString()
    ).toBe(res.body.booking.cancelledAt);
  });

  it('restores 1 flight seat on cancellation', async () => {
    const created = await createBooking();
    // After booking: 149 seats
    await request(app).delete(`/bookings/${created.body.id}`);
    // After cancel: 150 seats restored
    const search = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-06-15'
    );
    expect(search.body.flights[0].seatsAvailable).toBe(150);
  });

  it('sets refundAmount on the booking object', async () => {
    const created = await createBooking();
    const res = await request(app).delete(`/bookings/${created.body.id}`);
    expect(res.body.booking.refundAmount).toBe(res.body.refundAmount);
  });
});

// ===================================================================
// DELETE /bookings/:id — Refund policy (time-dependent)
// ===================================================================

describe('DELETE /bookings/:id — refund tiers', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'clearImmediate', 'nextTick'] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('gives full refund when cancelled within 24 hours of booking', async () => {
    jest.setSystemTime(new Date('2024-06-01T00:00:00Z'));
    const created = await createBooking();
    // 12 hours later — still within 24h window
    jest.setSystemTime(new Date('2024-06-01T12:00:00Z'));
    const res = await request(app).delete(`/bookings/${created.body.id}`);
    expect(res.body.refundAmount).toBe(created.body.price);
  });

  it('gives 80% refund when > 24h since booking AND > 7 days until flight', async () => {
    // FL001 flies 2024-06-15
    jest.setSystemTime(new Date('2024-06-01T00:00:00Z'));
    const created = await createBooking(); // price = 540

    // 25 hours later — past 24h window, but 13+ days until flight
    jest.setSystemTime(new Date('2024-06-02T01:00:00Z'));
    const res = await request(app).delete(`/bookings/${created.body.id}`);
    // 540 * 0.8 = 432
    expect(res.body.refundAmount).toBe(432);
  });

  it('gives $0 refund when > 24h since booking AND ≤ 7 days until flight', async () => {
    // FL001 flies 2024-06-15
    jest.setSystemTime(new Date('2024-06-10T00:00:00Z'));
    const created = await createBooking(); // price = 540

    // 36 hours later — past 24h window, only ~3.5 days until flight
    jest.setSystemTime(new Date('2024-06-11T12:00:00Z'));
    const res = await request(app).delete(`/bookings/${created.body.id}`);
    expect(res.body.refundAmount).toBe(0);
  });

  it('gives full refund at exactly 24 hours since booking', async () => {
    jest.setSystemTime(new Date('2024-06-01T00:00:00Z'));
    const created = await createBooking();

    // Exactly 24 hours later — boundary: hours_since_booking <= 24
    jest.setSystemTime(new Date('2024-06-02T00:00:00Z'));
    const res = await request(app).delete(`/bookings/${created.body.id}`);
    expect(res.body.refundAmount).toBe(created.body.price);
  });
});

// ===================================================================
// PUT /bookings/:id — Update booking
// ===================================================================

describe('PUT /bookings/:id — validation', () => {
  it('returns 404 when booking does not exist', async () => {
    const res = await request(app)
      .put('/bookings/BK-0-0')
      .send({ seatClass: 'premium' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Booking not found' });
  });

  it('returns 400 when trying to update a cancelled booking', async () => {
    const created = await createBooking();
    await request(app).delete(`/bookings/${created.body.id}`);

    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ seatClass: 'premium' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Cannot modify cancelled booking' });
  });

  it('returns 400 for invalid seat class', async () => {
    const created = await createBooking();
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ seatClass: 'first' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid seat class' });
  });
});

describe('PUT /bookings/:id — seat class changes', () => {
  // FL001 after 1 booking: 149 seats (≥100 → dynamic ×1.0), June → seasonal ×1.2
  // base_with_multipliers = 450 * 1.0 * 1.2 = 540

  it('upgrades economy → premium (price increases)', async () => {
    const created = await createBooking({ seatClass: 'economy' }); // $540
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ seatClass: 'premium' });
    // diff = (540 * 1.5) - (540 * 1.0) = 810 - 540 = 270
    // new = 540 + 270 = 810
    expect(res.status).toBe(200);
    expect(res.body.seatClass).toBe('premium');
    expect(res.body.price).toBe(810);
  });

  it('upgrades economy → business (price increases)', async () => {
    const created = await createBooking({ seatClass: 'economy' }); // $540
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ seatClass: 'business' });
    // diff = (540 * 2.5) - (540 * 1.0) = 1350 - 540 = 810
    // new = 540 + 810 = 1350
    expect(res.body.seatClass).toBe('business');
    expect(res.body.price).toBe(1350);
  });

  it('downgrades premium → economy (price decreases)', async () => {
    const created = await createBooking({ seatClass: 'premium' }); // $810
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ seatClass: 'economy' });
    // diff = (540 * 1.0) - (540 * 1.5) = 540 - 810 = -270
    // new = 810 + (-270) = 540
    expect(res.body.seatClass).toBe('economy');
    expect(res.body.price).toBe(540);
  });

  it('does not change price when same seat class is sent', async () => {
    const created = await createBooking({ seatClass: 'economy' });
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ seatClass: 'economy' });
    expect(res.body.price).toBe(created.body.price);
    expect(res.body.updatedAt).toBeUndefined();
  });
});

describe('PUT /bookings/:id — baggage changes', () => {
  it('increases price when adding bags', async () => {
    const created = await createBooking({ baggage: 0 }); // $540
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ baggage: 2 });
    // 540 + (2 * 25) = 590
    expect(res.body.baggage).toBe(2);
    expect(res.body.price).toBe(590);
  });

  it('decreases price when removing bags', async () => {
    const created = await createBooking({ baggage: 3 }); // 540 + 75 = 615
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ baggage: 1 });
    // 615 + (1 - 3) * 25 = 615 - 50 = 565
    expect(res.body.baggage).toBe(1);
    expect(res.body.price).toBe(565);
  });

  it('does not change price when same baggage count is sent', async () => {
    const created = await createBooking({ baggage: 1 });
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ baggage: 1 });
    expect(res.body.price).toBe(created.body.price);
    expect(res.body.updatedAt).toBeUndefined();
  });
});

describe('PUT /bookings/:id — combined & edge cases', () => {
  it('applies both seat class and baggage changes in one request', async () => {
    const created = await createBooking({ seatClass: 'economy', baggage: 0 }); // $540
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ seatClass: 'premium', baggage: 2 });
    // Seat diff: 810 - 540 = 270 → 540 + 270 = 810
    // Bag diff: 2 * 25 = 50 → 810 + 50 = 860
    expect(res.body.seatClass).toBe('premium');
    expect(res.body.baggage).toBe(2);
    expect(res.body.price).toBe(860);
  });

  it('returns booking unchanged when body is empty', async () => {
    const created = await createBooking();
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.price).toBe(created.body.price);
    expect(res.body.seatClass).toBe('economy');
    expect(res.body.updatedAt).toBeUndefined();
  });

  it('sets updatedAt only when price changes', async () => {
    const created = await createBooking();
    expect(created.body.updatedAt).toBeUndefined();

    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ seatClass: 'premium' });
    expect(res.body.updatedAt).toBeDefined();
    expect(new Date(res.body.updatedAt).toISOString()).toBe(res.body.updatedAt);
  });

  // NOTE: possible bug (characterized intentionally) — price diff uses CURRENT seat
  // availability, not availability at booking time. If seats have been sold since,
  // the dynamic multiplier may differ.
  it('recalculates seat class price diff using current seat availability', async () => {
    // FL003: 80 seats, base $120, dynamic ×1.1, seasonal ×1.2
    // Book 31 seats to drop to 49 (×1.3 tier) AFTER creating original booking
    const created = await createBooking({
      flightId: 'FL003',
      seatClass: 'economy',
    });
    // Price at booking: 120 * 1.1 * 1.2 = 158.40 (80 seats, ×1.1 tier)
    expect(created.body.price).toBe(158.4);

    // Book 31 more to drop FL003 to 48 seats (×1.3 tier)
    for (let i = 0; i < 31; i++) {
      await createBooking({
        flightId: 'FL003',
        passengerEmail: `fill${i}@test.com`,
      });
    }

    // Now upgrade original booking — price diff uses CURRENT availability (48 seats, ×1.3)
    const res = await request(app)
      .put(`/bookings/${created.body.id}`)
      .send({ seatClass: 'premium' });

    // base_w_dynamic_seasonal at update time: 120 * 1.3 * 1.2 = 187.2
    // old_seat_price = 187.2 * 1.0 = 187.2
    // new_seat_price = 187.2 * 1.5 = 280.8
    // diff = 280.8 - 187.2 = 93.6
    // new_price = 158.40 + 93.6 = 252
    expect(res.body.price).toBe(252);
  });
});
