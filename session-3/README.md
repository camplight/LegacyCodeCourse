# Session 3: Adding New Features to Legacy Systems

## Overview

This session teaches how to add new features to legacy code using two contrasting approaches, plus how to use AI-generated micro-tools for strategic test coverage and modular migration planning.

**Application:** ClinicFlow — a medical clinic appointment & patient management API
**Tech stack:** TypeScript + Express + in-memory data (no database dependency)

## Getting Started

```bash
cd legacy-system
npm install
npm run build
npm test
npm start        # Starts API on port 3000
```

## Generating Git History

The legacy system ships with a script that generates ~80 backdated commits over 18 months, simulating realistic development history:

```bash
cd legacy-system
# Remove existing git history if present
rm -rf .git
# Run the history generator
bash ../scripts/create-git-history.sh
```

This history is required for Demo 3 (test coverage strategy) and Demo 4 (migration planning), which analyze commit patterns.

## System Architecture

| Module | LOC | Coverage | Commits | Bug Ratio | Quality |
|--------|:---:|:--------:|:-------:|:---------:|---------|
| `appointment-scheduler.ts` | ~230 | 0% | 22 | 36% | God module — does everything |
| `notification-service.ts` | ~100 | 0% | 18 | 55% | Buggy, unreliable |
| `patient-registry.ts` | ~130 | 40% | 12 | 25% | Moderate mess |
| `billing-service.ts` | ~120 | 60% | 10 | 40% | Moderate quality |
| `reporting.ts` | ~110 | 0% | 8 | 25% | Coupled to everything |
| `doctor-schedule.ts` | ~100 | 75% | 6 | 17% | OK quality |
| `prescription-manager.ts` | ~90 | 90% | 4 | 0% | Decent, stable |

## Demos

### Demo 1: Refactor-Then-Feature
**Target:** `appointment-scheduler.ts` (god module)
**Feature:** Recurring appointments (weekly/monthly repeat)
**Approach:** Characterize → Refactor → TDD
**When to use:** When you CAN invest in refactoring before adding a feature

### Demo 2: Isolate-and-Build
**Target:** `notification-service.ts` (buggy, high-risk module)
**Feature:** Notification preferences (email/SMS/both/none)
**Approach:** Sprout Class pattern — build new module, one-line integration
**When to use:** When you CAN'T refactor — the module is too risky to touch

### Demo 3: Test Coverage Strategy
**Goal:** Generate micro-tools that answer "which files should we test first?"
**Tools created:** Test gap analyzer, change risk analyzer, priority calculator
**Key insight:** Data-driven testing priorities beat intuition

### Demo 4: Migration Planning
**Goal:** Generate micro-tools that map coupling and plan migration order
**Tools created:** Coupling analyzer (with Mermaid diagram), migration planner
**Key insight:** Start from stable edges, work inward toward tangled core

## Session Connections

- **Session 2 → Session 3:** Session-2 taught isolation patterns (Sprout Class, Wrap Class, Branch by Abstraction). Demo 2 puts Sprout Class into practice on a real feature.
- **Session 3 → Session 4:** Session-3 introduces coupling analysis and test prioritization micro-tools. Session-4 builds on this with cyclomatic complexity, full risk scoring, and business-value alignment.

## API Endpoints

### Patients
- `POST /api/patients` — Register new patient
- `GET /api/patients` — List all (or search with `?search=`)
- `GET /api/patients/:id` — Get patient by ID
- `PUT /api/patients/:id` — Update patient
- `DELETE /api/patients/:id` — Deactivate patient
- `POST /api/patients/:id/medical-history` — Add medical history entry

### Doctors
- `POST /api/doctors` — Register doctor
- `GET /api/doctors` — List all (or filter with `?specialty=`)
- `GET /api/doctors/:id` — Get doctor by ID
- `POST /api/doctors/:id/schedule` — Set schedule for a day
- `GET /api/doctors/:id/schedule` — Get week schedule
- `GET /api/doctors/:id/available-slots?date=YYYY-MM-DD` — Get available slots

### Appointments
- `POST /api/appointments` — Schedule appointment
- `GET /api/appointments?date=|doctorId=|patientId=` — Query appointments
- `GET /api/appointments/:id` — Get appointment by ID
- `PUT /api/appointments/:id/reschedule` — Reschedule
- `PUT /api/appointments/:id/cancel` — Cancel
- `PUT /api/appointments/:id/complete` — Mark complete
- `PUT /api/appointments/:id/no-show` — Mark no-show

### Billing
- `GET /api/billing/invoices/:id` — Get invoice
- `GET /api/billing/patients/:patientId/invoices` — Patient invoices
- `PUT /api/billing/invoices/:id/pay` — Mark paid
- `PUT /api/billing/invoices/:id/cancel` — Cancel invoice

### Prescriptions
- `POST /api/prescriptions` — Create prescription
- `GET /api/prescriptions/:id` — Get prescription
- `GET /api/patients/:patientId/prescriptions` — Patient prescriptions
- `PUT /api/prescriptions/:id/cancel` — Cancel prescription
- `POST /api/prescriptions/:id/renew` — Renew prescription
- `GET /api/prescriptions/check-interactions?patientId=&medication=` — Check drug interactions

### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD` — Daily report
- `GET /api/reports/appointments` — Appointment statistics
- `GET /api/reports/revenue` — Revenue report
- `GET /api/reports/notifications` — Notification delivery stats
- `GET /api/reports/overview` — System overview
