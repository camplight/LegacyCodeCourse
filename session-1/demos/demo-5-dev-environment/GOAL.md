# Demo 5: Dev Environment Setup

## Goal

Demonstrate how AI cross-references code and documentation to set up a dev environment — especially when the README is incomplete or outdated. Show that **code doesn't lie**, even when docs do.

## Duration

~5-6 minutes

## Setup

For this demo, pretend you've just cloned the repository. Start from the `legacy-app/` directory with no `node_modules/`.

```bash
cd session-1/legacy-app
rm -rf node_modules
```

## Steps

### Step 1: Ask Claude Code for Help

Use this prompt:

> I just cloned this project. Help me set up the dev environment and get the application running.

### Step 2: Observe How Claude Code Works

Watch how Claude Code:

1. **Reads the README** — finds `npm run dev` as the run command
2. **Reads `package.json`** — discovers the actual script is `npm run start:dev`, not `npm run dev`
3. **Notices the discrepancy** — README is wrong
4. **Runs `npm install`** — installs dependencies
5. **Reads `.env.example`** — finds some env vars, but misses `LOG_LEVEL` and `CORS_ORIGIN` that the code reads
6. **Discovers the database** — finds `bugbase.db` already exists (committed to git) OR discovers `npm run seed` is needed
7. **Checks the frontend** — realizes `npm run build:client` is needed before the frontend works, but the README doesn't mention this
8. **Notes the Docker reference** — README mentions `docker-compose up` but no `docker-compose.yml` exists

### Step 3: Discuss the Findings

Key discrepancies Claude Code should surface:
- README says `npm run dev` but script is `npm run start:dev`
- README mentions Docker setup that doesn't exist
- `.env.example` is missing `LOG_LEVEL` and `CORS_ORIGIN` variables
- No mention that `npm run build:client` is needed for the frontend
- No mention of Node.js version requirement (needs 18+)
- Backend and frontend share one `package.json` but run separately
- The relationship between `bugbase.db` (committed) and `npm run seed` is unclear

### Step 4: Get It Running

Follow Claude Code's corrected instructions to actually start the server:

```bash
npm install
npm run start:dev
```

Verify it works on http://localhost:3000.

## Takeaway

**Documentation goes stale; code doesn't lie.** AI cross-references README, package.json, source code, env files, and config to build a complete picture. This is exactly how experienced developers onboard — but AI does it faster and doesn't miss things.

## What the Audience Learns

- How AI handles contradictory documentation vs. code
- The value of cross-referencing multiple files for onboarding
- Common patterns in stale documentation (wrong script names, missing setup steps, phantom Docker configs)
- That AI can be a more reliable onboarding guide than outdated docs
