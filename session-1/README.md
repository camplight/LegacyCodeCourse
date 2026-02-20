# Session 1: AI-Assisted Legacy Code Exploration

## Overview

This session teaches how to use AI tools (Claude Code) to **read, explore, and understand** legacy systems — the critical first step before any transformation effort. Through 8 concise demos, participants learn practical techniques for using AI as a force multiplier when onboarding to unfamiliar codebases.

## Duration

~2 hours total (theory + demos)
- ~45 minutes of demos (8 demos, ~5-6 minutes each)
- Remaining time for theory, discussion, and Q&A

## The Legacy App: BugBase

All demos target a single legacy Node.js application — **BugBase**, a ticket/issue tracking system. It features:

- **Backend**: Express.js API with SQLite (better-sqlite3)
- **Frontend**: Vanilla JS bundled with webpack
- **Database**: 8 tables with realistic relationships
- **Mixed languages**: JavaScript and TypeScript in the same project
- **Intentional problems**: Inconsistent conventions, security issues, missing tests, outdated dependencies, incomplete documentation

### Quick Start

```bash
cd legacy-app
npm install
npm run start:dev    # Start the server (note: README says "npm run dev" — it's wrong)
npm test             # Run the sparse test suite
npm run build:client # Build the frontend
```

## Demo Sequence

| # | Demo | Key Technique | Takeaway |
|---|------|--------------|----------|
| 1 | [Test Evaluation Tool](demos/demo-1-test-evaluation/GOAL.md) | Generate analysis scripts | Deterministic tools > one-off answers |
| 2 | [ERD Generation Tool](demos/demo-2-erd-generation/GOAL.md) | Schema introspection → Mermaid | Deterministic tooling > generative answers for docs |
| 3 | [Linter Setup](demos/demo-3-linter-setup/GOAL.md) | Triage-based linting | Linting legacy code = triage, not fix-everything |
| 4 | [Webpack Visualization](demos/demo-4-webpack-visualization/GOAL.md) | Config parsing → flowchart | AI makes complex configs readable |
| 5 | [Dev Environment Setup](demos/demo-5-dev-environment/GOAL.md) | Cross-referencing docs vs code | Docs lie; code doesn't |
| 6 | [Observability Evaluation](demos/demo-6-observability/GOAL.md) | Observability baseline tool | Repeatable baselines for improvement planning |
| 7 | [Security Audit](demos/demo-7-security-audit/GOAL.md) | npm audit + AI code scanning | Right tool for the job; AI fills gaps |
| 8 | [Standards & Skills](demos/demo-8-standards-skills/GOAL.md) | Convention discovery | Descriptive before prescriptive |

## Key Themes

1. **Tools over answers**: AI generates reusable scripts, not one-off responses
2. **Determinism matters**: Scripts produce identical output on every run
3. **Triage, not perfection**: Legacy code improvement is incremental
4. **Cross-referencing**: AI reads multiple files to build understanding
5. **Right tool for the job**: AI complements purpose-built tools, doesn't replace them
6. **Describe before prescribing**: Understand what exists before mandating change

## Prerequisites

- Node.js 18+
- npm
- Claude Code (or similar AI coding assistant)
- Mermaid renderer (mermaid.live or VS Code extension) for demos 2 and 4

## Relationship to Other Sessions

- **Session 1** (this): Exploration and understanding
- **Session 2**: Characterization testing and isolation patterns
- **Session 3–4**: Transformation techniques (TBD)
