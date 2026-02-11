# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

**CRITICAL OVERRIDE**: This repository contains training materials for a course on transforming legacy systems with AI assistance. The code examples are **intentionally messy, hard to maintain, and violate clean code practices**. This is NOT a production codebase - it's educational material demonstrating problematic legacy code patterns.

**DO NOT apply standard software quality practices** from global CLAUDE.md guidelines when working in this repository. The goal is to create realistic legacy code examples that:
- Build and execute successfully
- Are difficult to maintain and extend
- Demonstrate real-world technical debt
- Serve as "before" examples for transformation demonstrations

## Repository Structure

```
/
├── session-1/    # Independent session materials
├── session-2/    # Independent session materials
├── session-3/    # Independent session materials
└── session-4/    # Independent session materials
```

Each session directory is **independent** and may contain:
- Standalone code examples
- Full-fledged systems to transform
- Varies by what legacy patterns are being demonstrated

## Technology Stack

- **Primary**: Node.js / TypeScript
- **Build tools, package managers, testing frameworks**: Varies by example
- Different sessions may showcase different legacy technology stacks
- Tooling choices reflect realistic legacy system scenarios

## Guidelines for Creating Legacy Code Examples

When adding code to this repository, you should:

### ✅ DO (Intentionally):
- Write messy, poorly organized code
- Use inconsistent naming conventions
- Create large functions with multiple responsibilities
- Add deep nesting and complex conditionals
- Duplicate code across multiple locations
- Use mutable state and side effects freely
- Skip tests or write minimal, brittle tests
- Add unclear or misleading comments
- Use `any` types in TypeScript liberally
- Create tight coupling between components
- Mix concerns (business logic, UI, data access)
- Leave TODOs, commented-out code, and dead code
- Use global variables and shared mutable state
- Create circular dependencies
- Ignore error handling or use generic catch-all handlers

### ❌ DON'T:
- Follow TDD practices (unless demonstrating legacy test suites)
- Write clean, functional code with immutable data
- Apply SOLID principles
- Create well-structured, maintainable code
- Follow the clean code guidelines from global CLAUDE.md

### The Goal:
Create **working but problematic code** that:
1. Builds successfully
2. Executes and produces expected output
3. Demonstrates real legacy code challenges
4. Provides good material for transformation demonstrations

## Common Patterns (To Be Discovered)

As the course develops, patterns for organizing legacy examples may emerge. This section will be updated accordingly.

## Development Commands

Commands will be defined per-session based on the specific example's tooling. Check individual session directories for:
- `package.json` scripts (if Node.js/npm)
- Build instructions
- Run instructions
- Any session-specific tooling

## Notes for Future Updates

- As transformation patterns emerge, document them here
- If specific legacy anti-patterns prove particularly useful for teaching, catalog them
- Session-specific conventions should be documented in session directories
- Update this file as the course structure evolves
