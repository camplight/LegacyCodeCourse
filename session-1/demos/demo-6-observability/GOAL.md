# Demo 6: Observability Evaluation Tool

## Goal

Demonstrate tool-based evaluation of observability practices. Generate a script that scans the codebase for logging, monitoring, health checks, error handling patterns — producing a repeatable baseline report.

## Duration

~5-6 minutes

## Setup

```bash
cd session-1/legacy-app
npm install
```

## Steps

### Step 1: Ask Claude Code to Generate the Tool

Use this prompt:

```
Generate a script called `evaluate-observability.js` that analyzes the observability posture of this codebase. It should scan for:
- Logging library usage (morgan, winston, pino, console.log, etc.)
- Log levels used (info, warn, error, debug)
- Whether logging is structured (JSON) or unstructured (plain text)
- Correlation ID / request ID patterns
- Health check endpoints and what they check
- Metrics endpoints or instrumentation
- Error handling patterns (try/catch, error middleware, unhandled rejection handlers)
- Console.log/console.error usage (count and locations)
Output a structured JSON report to stdout.
```

### Step 2: Run the Generated Tool

```bash
node evaluate-observability.js
```

Review the JSON report.

### Step 3: Discuss Findings

The tool should discover:
- **Logging**: `morgan` in `'dev'` format (not structured JSON)
- **Console statements**: 5-6 scattered `console.log` with inconsistent messages, 1 `console.error`
- **No structured logging**: No winston, pino, or JSON log format
- **No log levels**: No configurable log level (despite `.env.example` missing `LOG_LEVEL`)
- **No correlation IDs**: No request ID generation or propagation
- **Health check**: `/health` returns `{ status: "ok" }` — no dependency checks (DB, etc.)
- **No metrics**: No Prometheus, StatsD, or any metrics instrumentation
- **No tracing**: No OpenTelemetry or distributed tracing
- **Error handling**: Generic catch blocks, one global error handler, inconsistent error logging
- **No centralized error handling**: Each route handles errors independently

### Step 4: Discuss the Baseline

This report is now a **baseline** for improvement planning:
- What's the gap between current state and production-ready?
- Which improvements have the highest ROI?
- How do we track progress as we improve?

## Takeaway

**Tool-based evaluation gives a repeatable baseline** for improvement planning. Run the tool before and after changes to measure progress. The report format is consistent, shareable, and diffable.

## What the Audience Learns

- What constitutes good observability (structured logging, correlation IDs, health checks, metrics)
- How to systematically assess a codebase's observability posture
- The gap between "has logging" and "is observable"
- How to create measurable improvement plans from tool output
