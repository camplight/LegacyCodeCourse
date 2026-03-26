# Behavior Catalog — Booking Endpoints

Source: `src/flight-booking-api.ts`

---

## 1. POST /bookings — Create Booking (lines 41–164)

### Validation
- [x] Missing `flightId` → 400 "Flight ID is required"
- [x] Missing `passengerName` → 400 "Passenger name is required"
- [x] Missing `passengerEmail` → 400 "Passenger email is required"
- [x] Email without `@` → 400 "Invalid email format"
- [x] Email without `.` → 400 "Invalid email format"
- [x] `"@."` passes email validation (quirk)
- [x] Non-existent flight ID → 404 "Flight not found"
- [x] Flight with 0 seats → 400 "No seats available"
- [x] Invalid seat class → 400 "Invalid seat class"
- [x] Missing `seatClass` defaults to `'economy'`

### Pricing
- [x] Economy: base × dynamic × seasonal × 1.0
- [x] Premium: base × dynamic × seasonal × 1.5
- [x] Business: base × dynamic × seasonal × 2.5
- [x] Baggage: +$25 per bag
- [x] Missing baggage treated as 0
- [x] SUMMER10 discount (10%)
- [x] WINTER20 discount (20%)
- [x] EARLYBIRD discount (15%)
- [x] STUDENT discount (25%)
- [x] Invalid discount code silently ignored (quirk)
- [x] Discount applied AFTER baggage fees are added (quirk)
- [x] Winter seasonal pricing (December flight)

### Response & Side Effects
- [x] Returns 201 with full booking object
- [x] Booking ID matches pattern `BK-{timestamp}-{counter}`
- [x] `bookedAt` is valid ISO 8601 string
- [x] `discountCode` is null when not provided
- [x] Flight seats decremented by 1
- [x] Unique IDs with incrementing counter

## 2. GET /bookings/:id (lines 167–177)

- [x] Booking found → 200 with full booking object
- [x] Booking not found → 404 "Booking not found"
- [x] Returned object matches creation response exactly

## 3. DELETE /bookings/:id — Cancel (lines 180–231)

### Validation
- [x] Booking not found → 404 "Booking not found"
- [x] Already cancelled → 400 "Booking already cancelled"

### Refund Policy
- [x] ≤ 24h since booking → 100% refund
- [x] Exactly 24h since booking → 100% refund (boundary)
- [x] > 24h since booking AND > 7 days until flight → 80% refund
- [x] > 24h since booking AND ≤ 7 days until flight → $0 refund

### Response & Side Effects
- [x] Response shape: `{ message, refundAmount, booking }`
- [x] `booking.status` set to `'cancelled'`
- [x] `booking.cancelledAt` is valid ISO 8601 string
- [x] `booking.refundAmount` matches top-level `refundAmount`
- [x] Flight seats restored (+1)

## 4. PUT /bookings/:id — Update (lines 234–341)

### Validation
- [x] Booking not found → 404 "Booking not found"
- [x] Cancelled booking → 400 "Cannot modify cancelled booking"
- [x] Invalid seat class → 400 "Invalid seat class"

### Seat Class Changes
- [x] Economy → premium: price increases
- [x] Economy → business: price increases
- [x] Premium → economy: price decreases
- [x] Same seat class sent → no change, no `updatedAt`

### Baggage Changes
- [x] Add bags → price increases ($25/bag)
- [x] Remove bags → price decreases ($25/bag)
- [x] Same baggage count → no change, no `updatedAt`

### Combined & Edge Cases
- [x] Both seat class + baggage in one request → both applied
- [x] Empty body → returns booking unchanged, no `updatedAt`
- [x] `updatedAt` set only when price changes
- [x] Seat class price diff uses CURRENT seat availability, not booking-time (quirk)

---

## Characterized Quirks / Suspected Bugs

1. **`"@."` passes email validation** (`flight-booking-api.ts:60`):
   `!email.includes('@') || !email.includes('.')` only checks for presence of both
   characters — no structural validation. Any string with `@` and `.` passes.
   // NOTE: possible bug (characterized intentionally)

2. **Invalid discount code silently ignored** (`flight-booking-api.ts:128`):
   `if (DISCOUNT_CODES[code])` is falsy for unknown codes, so the discount block is
   skipped. The response still includes `discountCode: "BOGUS"` with full price.
   // NOTE: possible bug (characterized intentionally)

3. **Discount applied after baggage fees** (`flight-booking-api.ts:123-131`):
   `total_price = price_after_seat + baggage_fee`, then discount on `total_price`.
   Discount reduces baggage cost too. May or may not be intentional.
   // NOTE: possible bug (characterized intentionally)

4. **Seat class update uses current availability** (`flight-booking-api.ts:271`):
   When upgrading seat class on an existing booking, the price difference is calculated
   using the flight's CURRENT seat count (dynamic pricing), not the availability at
   original booking time. If seats were sold since, the multiplier may differ, leading
   to a different upgrade cost than expected.
   // NOTE: possible bug (characterized intentionally)

5. **Flight not found during update → 500** (`flight-booking-api.ts:265`):
   Returns HTTP 500 "Flight not found" instead of 404. This path is difficult to
   trigger since a valid booking always references an existing flight, but a data
   inconsistency could hit it.
   // NOTE: possible bug (characterized intentionally)

## Untested Paths

| Path | Reason | What's Needed |
|------|--------|---------------|
| Flight-not-found on PUT update (500 path) | Cannot trigger without data inconsistency — booking creation validates flight exists | Would need to delete a flight after booking (no API exists for this) |
| Refund at exactly 7 days before flight boundary | Complex time setup with narrow window | Could add with more precise fake timer setup |
| Negative baggage count | Not tested — `baggage: -1` would yield negative fee, reducing price | Add test if business logic matters |
| Concurrent bookings race condition | In-memory state has no locking | Would need parallel request harness |

## Determinism Controls Used

- **State reset**: `POST /reset` in `beforeEach` restores seed data every test
- **Fake timers**: `jest.useFakeTimers()` with `jest.setSystemTime()` for refund tier
  tests — only `Date`/`Date.now()` are faked; `setImmediate`/`nextTick` left real to
  avoid interfering with Express/Node event loop
- **Nondeterministic fields**: Booking IDs asserted with regex `/^BK-\d+-\d+$/`;
  timestamps asserted as valid ISO strings, not exact values
- **No ordering dependency**: Each test creates its own bookings from clean state

## Mocking Decisions

**No mocks**. All endpoints operate on in-memory state. `jest.useFakeTimers()` is
used to control `Date.now()` for refund calculation — this is nondeterminism control,
not mocking an external dependency.

## Sensitivity Check Results

| # | Mutation | Location | Tests Failed | Detected? |
|---|----------|----------|-------------|-----------|
| 1 | Business seat multiplier 2.5 → 3.0 | line 110 | 1 (business price) | Yes |
| 2 | Refund 24h threshold → 12h | line 205 | 1 (24h boundary) | Yes |
| 3 | Baggage fee $25 → $30 | line 121 | 3 (baggage, discount+baggage, bag removal) | Yes |

## Baseline Snapshot

```
Test Suites: 1 passed, 1 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        ~1.6s
```

## Refactor Gate Recommendation

**All 52 tests should be mandatory in CI before any booking refactor lands.**

Priority groups by risk:

1. **Pricing tests (12)** — highest risk: money calculations, discount logic,
   seat class multipliers. Any regression here means wrong charges.
2. **Refund policy tests (4)** — high risk: time-dependent refund tiers with
   real money implications. Fake timer tests are critical.
3. **Validation tests (10)** — medium risk: protect API contract and error codes.
4. **Update tests (11)** — medium risk: complex price recalculation with current
   availability. The "current availability quirk" test is especially important.
5. **Side effect tests (5)** — seat count management, booking persistence.
6. **GET/basic tests (10)** — lower risk but quick to run, ensure CRUD works.
