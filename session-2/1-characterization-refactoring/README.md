# Flight Booking API - Legacy Code Example

## What is This?

This is a **legacy flight booking API** - intentionally messy code used for training purposes. It's functional but poorly structured, representing realistic legacy code you might encounter in the wild.

## What Does It Do?

A simple flight booking system with:
- **Flight search** - find available flights between cities
- **Booking creation** - book flights with passenger details
- **Pricing calculation** - complex pricing based on multiple factors
- **Booking management** - view, cancel, and modify bookings

## Setup

Install dependencies:

```bash
npm install
```

## Running the API

Start the development server:

```bash
npm run dev
```

Or build and run production version:

```bash
npm run build
npm start
```

The API runs on `http://localhost:3000`

## API Endpoints

### Search Flights

```bash
GET /flights?from=LON&to=NYC&date=2024-06-15

# Example
curl "http://localhost:3000/flights?from=LON&to=NYC&date=2024-06-15"
```

**Query Parameters:**
- `from` - Departure city code (e.g., LON, NYC, PAR, TOK)
- `to` - Arrival city code
- `date` - Flight date (YYYY-MM-DD format)

### Create Booking

```bash
POST /bookings
Content-Type: application/json

{
  "flightId": "FL001",
  "passengerName": "John Doe",
  "passengerEmail": "john@example.com",
  "seatClass": "economy",
  "baggage": 1,
  "discountCode": "SUMMER10"
}

# Example
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "flightId": "FL001",
    "passengerName": "John Doe",
    "passengerEmail": "john@example.com",
    "seatClass": "economy",
    "baggage": 1
  }'
```

### Get Booking

```bash
GET /bookings/:id

# Example
curl http://localhost:3000/bookings/BK-1234567890
```

### Cancel Booking

```bash
DELETE /bookings/:id

# Example
curl -X DELETE http://localhost:3000/bookings/BK-1234567890
```

### Update Booking

```bash
PUT /bookings/:id
Content-Type: application/json

{
  "seatClass": "premium",
  "baggage": 2
}

# Example
curl -X PUT http://localhost:3000/bookings/BK-1234567890 \
  -H "Content-Type: application/json" \
  -d '{"seatClass": "premium"}'
```

## Available Routes

The system has pre-configured routes:
- **LON ↔ NYC** (London to New York)
- **LON ↔ PAR** (London to Paris)
- **NYC ↔ TOK** (New York to Tokyo)
- **PAR ↔ TOK** (Paris to Tokyo)

## Pricing Factors

Prices are calculated based on:
- **Base price** by route
- **Dynamic pricing** - fewer seats = higher price
- **Seasonal adjustment** - summer (Jun-Aug) is more expensive
- **Seat class** - economy < premium < business
- **Baggage fees** - £25 per bag
- **Discount codes** - various promotional codes

## Testing

The project is set up with Jest and Supertest for API testing:

```bash
npm test
```

## Exercise Notes

This code is intentionally messy:
- Everything in a single 600+ line file
- Mixed concerns (HTTP, business logic, data storage)
- Deep nesting and complex conditionals
- Liberal use of `any` types
- Code duplication
- Global mutable state
- Poor naming conventions

**Your task** is to characterize this code with tests, then refactor it while keeping tests green!
