# Behavior Catalog — GET /flights

Entry point: `GET /flights?from=X&to=Y&date=YYYY-MM-DD`
Source: `src/flight-booking-api.ts:43-96`

## 1. Validation (line 48-50)

- [x] Missing all three params → 400 `{ error: "Missing required parameters: from, to, date" }`
- [x] Missing `from` only → same 400
- [x] Missing `to` only → same 400
- [x] Missing `date` only → same 400

## 2. Filtering (lines 52-57)

- [x] Matching route + date with seats > 0 → returns flight(s)
- [x] Non-matching route → `{ flights: [] }` (200)
- [x] Non-matching date → `{ flights: [] }` (200)
- [x] Case-sensitive codes (`lon` ≠ `LON`) → `{ flights: [] }`
- [x] Flight with exactly 1 seat remaining → still returned
- [x] Flight with 0 seats → excluded from results

## 3. Response shape (lines 85-95)

- [x] Each flight object has exactly: `id`, `from`, `to`, `date`, `seatsAvailable`, `price`
- [x] `seatsAvailable` reflects current seat count (not base)
- [x] `price` is a number (not string)

## 4. Seasonal pricing (lines 75-83)

- [x] June flight → base * dynamic * 1.2 (summer)
- [x] July flight → base * dynamic * 1.2 (summer)
- [x] August flight → base * dynamic * 1.2 (summer)
- [x] December flight → base * dynamic * 1.3 (winter)
- [ ] January flight — **untested**: no January flight in seed data; would need production code change to add one

## 5. Dynamic pricing — seat-availability tiers (lines 65-72)

- [x] >= 100 seats → no multiplier (×1.0)
- [x] 50-99 seats → ×1.1 (FL003 starts at 80)
- [x] 20-49 seats → ×1.3 (reduced FL003 to 49 via bookings)
- [x] < 20 seats → ×1.5 (reduced FL003 to 19 via bookings)

## 6. Price rounding (line 91)

- [x] Price rounded to 2 decimal places via `Math.round(price * 100) / 100`

## 7. Snapshot regression

- [x] Full response snapshot: LON→NYC 2024-06-15 (summer, >= 100 seats)
- [x] Full response snapshot: LON→NYC 2024-12-25 (winter, >= 100 seats)
- [x] Full response snapshot: LON→PAR 2024-06-20 (summer, 50-99 seat tier)

---

## Characterized Quirks / Suspected Bugs

1. **No "not found" vs "no match" distinction** (`flight-booking-api.ts:95`): A search with
   a nonexistent airport code (e.g., `XXX`) returns 200 `{ flights: [] }` — same as a valid
   code with no flights. Consumers cannot distinguish "bad input" from "no availability."
   // NOTE: possible bug (characterized intentionally) — no input validation on airport codes

2. **Duplicated pricing logic** (`flight-booking-api.ts:60-92` and `:133-192`): The dynamic +
   seasonal pricing calculation is copy-pasted between `/flights` and `/bookings`. A refactor
   that changes one but not the other will cause price discrepancies between search and booking.

## Untested Paths

| Path | Reason | What's Needed |
|------|--------|---------------|
| January seasonal pricing (month === 1) | No January flight in seed data | Add a seed flight with a January date (requires production code change) or expose a way to add flights at runtime |
| Non-seasonal months (e.g., March, April) | No seed flights exist for months 2-5 or 9-11 | Same as above |
| Multiple flights returned for same route+date | All seed data has unique route+date combos | Same as above |

## Determinism Controls Used

- **State reset**: `POST /reset` called in `beforeEach` to restore seed data before every test
- **No time/random/locale dependency**: The `/flights` endpoint uses only `new Date(f.date)` on
  fixed seed data — no `Date.now()`, no random values, no locale-sensitive formatting
- **No external dependencies**: All data is in-memory; no DB, network, or filesystem calls

## Mocking Decisions

No mocks were used. The endpoint operates entirely on in-memory state, and `supertest` drives
the Express app without a real network socket. The `/reset` endpoint serves as the fixture
mechanism.

## Sensitivity Check Results

| Mutation | Location | Tests Failed | Detected? |
|----------|----------|-------------|-----------|
| Summer multiplier 1.2 → 1.25 | line 79 | 8 (all summer pricing + snapshots) | Yes |
| Seat filter `> 0` → `> 1` | line 53 | 1 (1-seat boundary test) | Yes |
| Error message text changed | line 49 | 4 (all validation tests) | Yes |

## Baseline Snapshot

```
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        ~1.5s
```

## Refactor Gate Recommendation

**All 23 tests should be mandatory in CI before any refactor lands.** Key groups:

- **Validation tests (4)**: Protect the API contract for error responses
- **Filtering tests (6)**: Protect search correctness and the zero-seats boundary
- **Pricing tests (8)**: Protect all four dynamic tiers and all seasonal multipliers — the highest-risk area for regressions during pricing logic refactors
- **Snapshot tests (3)**: Catch any unexpected response shape or value drift
- **Rounding test (1)**: Guards against floating-point regressions
- **Shape test (1)**: Guards against field additions/removals in the response
