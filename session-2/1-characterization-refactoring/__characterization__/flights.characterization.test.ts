/**
 * Characterization tests for GET /flights endpoint.
 *
 * These tests lock the current externally observable behavior of the
 * /flights search endpoint as a safety net for future refactors.
 * Assertions encode *observed* behavior, including quirks.
 */

import request from 'supertest';
import { app, server } from '../src/flight-booking-api';

afterAll((done) => {
  server.close(done);
});

beforeEach(async () => {
  // Reset all global state to a known baseline before every test
  await request(app).post('/reset');
});

// ---------------------------------------------------------------------------
// Helper: bulk-book a flight to reduce its seat count
// ---------------------------------------------------------------------------
async function reduceSeatsByBooking(flightId: string, count: number) {
  for (let i = 0; i < count; i++) {
    await request(app)
      .post('/bookings')
      .send({
        flightId,
        passengerName: `Seat Filler ${i}`,
        passengerEmail: `filler${i}@test.com`,
        seatClass: 'economy',
      });
  }
}

// ===========================================================================
// 1. VALIDATION — missing required parameters
// ===========================================================================

describe('GET /flights — validation', () => {
  it('returns 400 when all query params are missing', async () => {
    const res = await request(app).get('/flights');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Missing required parameters: from, to, date',
    });
  });

  it('returns 400 when "from" is missing', async () => {
    const res = await request(app).get('/flights?to=NYC&date=2024-06-15');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing required parameters: from, to, date');
  });

  it('returns 400 when "to" is missing', async () => {
    const res = await request(app).get('/flights?from=LON&date=2024-06-15');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing required parameters: from, to, date');
  });

  it('returns 400 when "date" is missing', async () => {
    const res = await request(app).get('/flights?from=LON&to=NYC');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing required parameters: from, to, date');
  });
});

// ===========================================================================
// 2. FILTERING — matching and non-matching criteria
// ===========================================================================

describe('GET /flights — filtering', () => {
  it('returns matching flight for LON→NYC on 2024-06-15', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-06-15'
    );
    expect(res.status).toBe(200);
    expect(res.body.flights).toHaveLength(1);
    expect(res.body.flights[0].id).toBe('FL001');
  });

  it('returns empty array when no flights match the route', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=TOK&date=2024-06-15'
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ flights: [] });
  });

  it('returns empty array when no flights match the date', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-01-01'
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ flights: [] });
  });

  it('is case-sensitive — lowercase codes return no results', async () => {
    const res = await request(app).get(
      '/flights?from=lon&to=nyc&date=2024-06-15'
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ flights: [] });
  });

  it('includes flight with exactly 1 seat remaining', async () => {
    // FL003: LON→PAR, 2024-06-20, starts with 80 seats — book 79
    await reduceSeatsByBooking('FL003', 79);

    const res = await request(app).get(
      '/flights?from=LON&to=PAR&date=2024-06-20'
    );
    expect(res.status).toBe(200);
    expect(res.body.flights).toHaveLength(1);
    expect(res.body.flights[0].seatsAvailable).toBe(1);
  });

  it('excludes flights with zero seats available', async () => {
    // FL003: LON→PAR, 2024-06-20, starts with 80 seats — book all 80
    await reduceSeatsByBooking('FL003', 80);

    const res = await request(app).get(
      '/flights?from=LON&to=PAR&date=2024-06-20'
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ flights: [] });
  });
});

// ===========================================================================
// 3. RESPONSE SHAPE
// ===========================================================================

describe('GET /flights — response shape', () => {
  it('returns correct fields for each flight result', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-06-15'
    );

    const flight = res.body.flights[0];
    expect(Object.keys(flight).sort()).toEqual(
      ['date', 'from', 'id', 'price', 'seatsAvailable', 'to'].sort()
    );
    expect(flight).toMatchObject({
      id: 'FL001',
      from: 'LON',
      to: 'NYC',
      date: '2024-06-15',
      seatsAvailable: 150,
    });
    expect(typeof flight.price).toBe('number');
  });
});

// ===========================================================================
// 4. PRICING — seasonal adjustments
// ===========================================================================

describe('GET /flights — seasonal pricing', () => {
  // FL001: LON→NYC, 2024-06-15, 150 seats, base $450
  // Dynamic: 150 >= 100 → ×1.0 → $450
  // Seasonal: June → ×1.2 → $540
  it('applies summer multiplier (×1.2) for June flight', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-06-15'
    );
    expect(res.body.flights[0].price).toBe(540);
  });

  // FL005: NYC→TOK, 2024-07-10, 200 seats, base $850
  // Dynamic: 200 >= 100 → ×1.0 → $850
  // Seasonal: July → ×1.2 → $1020
  it('applies summer multiplier (×1.2) for July flight', async () => {
    const res = await request(app).get(
      '/flights?from=NYC&to=TOK&date=2024-07-10'
    );
    expect(res.body.flights[0].price).toBe(1020);
  });

  // FL007: PAR→TOK, 2024-08-05, 120 seats, base $720
  // Dynamic: 120 >= 100 → ×1.0 → $720
  // Seasonal: August → ×1.2 → $864
  it('applies summer multiplier (×1.2) for August flight', async () => {
    const res = await request(app).get(
      '/flights?from=PAR&to=TOK&date=2024-08-05'
    );
    expect(res.body.flights[0].price).toBe(864);
  });

  // FL009: LON→NYC, 2024-12-25, 150 seats, base $450
  // Dynamic: 150 >= 100 → ×1.0 → $450
  // Seasonal: December → ×1.3 → $585
  it('applies winter multiplier (×1.3) for December flight', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-12-25'
    );
    expect(res.body.flights[0].price).toBe(585);
  });
});

// ===========================================================================
// 5. PRICING — dynamic (seat-availability) tiers
// ===========================================================================

describe('GET /flights — dynamic pricing tiers', () => {
  // FL003: LON→PAR, 2024-06-20, 80 seats, base $120
  // Dynamic: 50 <= 80 < 100 → ×1.1 → $132
  // Seasonal: June → ×1.2 → $158.40
  it('applies ×1.1 multiplier when 50–99 seats remain', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=PAR&date=2024-06-20'
    );
    expect(res.body.flights[0].seatsAvailable).toBe(80);
    expect(res.body.flights[0].price).toBe(158.4);
  });

  // Reduce FL003 from 80 → 49 seats (book 31)
  // Dynamic: 20 <= 49 < 50 → ×1.3 → $156
  // Seasonal: June → ×1.2 → $187.20
  it('applies ×1.3 multiplier when 20–49 seats remain', async () => {
    await reduceSeatsByBooking('FL003', 31);

    const res = await request(app).get(
      '/flights?from=LON&to=PAR&date=2024-06-20'
    );
    expect(res.body.flights[0].seatsAvailable).toBe(49);
    expect(res.body.flights[0].price).toBe(187.2);
  });

  // Reduce FL003 from 80 → 19 seats (book 61)
  // Dynamic: 19 < 20 → ×1.5 → $180
  // Seasonal: June → ×1.2 → $216
  it('applies ×1.5 multiplier when fewer than 20 seats remain', async () => {
    await reduceSeatsByBooking('FL003', 61);

    const res = await request(app).get(
      '/flights?from=LON&to=PAR&date=2024-06-20'
    );
    expect(res.body.flights[0].seatsAvailable).toBe(19);
    expect(res.body.flights[0].price).toBe(216);
  });

  // FL001: LON→NYC, 2024-06-15, 150 seats (>= 100)
  // Dynamic: ×1.0 → $450
  // Seasonal: June → ×1.2 → $540
  it('applies no dynamic multiplier when >= 100 seats remain', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-06-15'
    );
    expect(res.body.flights[0].seatsAvailable).toBe(150);
    expect(res.body.flights[0].price).toBe(540);
  });
});

// ===========================================================================
// 6. PRICING — rounding
// ===========================================================================

describe('GET /flights — price rounding', () => {
  it('rounds price to two decimal places', async () => {
    // FL003: 120 * 1.1 * 1.2 = 158.4 — already clean
    const res = await request(app).get(
      '/flights?from=LON&to=PAR&date=2024-06-20'
    );
    const price = res.body.flights[0].price;
    // Verify it's a number with at most 2 decimal places
    expect(price).toBe(Math.round(price * 100) / 100);
  });
});

// ===========================================================================
// 7. SNAPSHOT — full response for regression detection
// ===========================================================================

describe('GET /flights — snapshot regression', () => {
  it('returns full expected response for LON→NYC 2024-06-15', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-06-15'
    );
    expect(res.body).toEqual({
      flights: [
        {
          id: 'FL001',
          from: 'LON',
          to: 'NYC',
          date: '2024-06-15',
          seatsAvailable: 150,
          price: 540,
        },
      ],
    });
  });

  it('returns full expected response for LON→NYC 2024-12-25 (winter)', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=NYC&date=2024-12-25'
    );
    expect(res.body).toEqual({
      flights: [
        {
          id: 'FL009',
          from: 'LON',
          to: 'NYC',
          date: '2024-12-25',
          seatsAvailable: 150,
          price: 585,
        },
      ],
    });
  });

  it('returns full expected response for LON→PAR 2024-06-20 (80-seat tier)', async () => {
    const res = await request(app).get(
      '/flights?from=LON&to=PAR&date=2024-06-20'
    );
    expect(res.body).toEqual({
      flights: [
        {
          id: 'FL003',
          from: 'LON',
          to: 'PAR',
          date: '2024-06-20',
          seatsAvailable: 80,
          price: 158.4,
        },
      ],
    });
  });
});
