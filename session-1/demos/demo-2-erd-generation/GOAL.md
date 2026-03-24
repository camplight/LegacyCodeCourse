# Demo 2: ERD Generation Tool

## Goal

Demonstrate that AI can generate **deterministic documentation tools** by creating a script that reads the SQLite schema and outputs a Mermaid ERD diagram. Emphasize: running the script twice gives identical output, unlike asking an LLM twice.

## Duration

~5-6 minutes

## Setup

Ensure the database exists with seed data:

```bash
cd session-1/legacy-app
npm install
npm run seed
```

## Steps

### Step 1: Ask Claude Code to Generate the Tool

Use this prompt (or similar):

```
Generate a script called `generate-erd.js` that reads the SQLite database schema and outputs a Mermaid ERD diagram. It should:
- Connect to `bugbase.db` using better-sqlite3
- Read table definitions from `sqlite_master`
- Use `PRAGMA table_info(tablename)` to get columns and types
- Use `PRAGMA foreign_key_list(tablename)` to get foreign key relationships
- Output valid Mermaid `erDiagram` syntax to stdout
- Include column names and types in each entity
- Show all relationships with proper cardinality
```

### Step 2: Run the Generated Tool

```bash
node generate-erd.js
```

Copy the Mermaid output.

### Step 3: Render the ERD

Paste the output into one of:
- [mermaid.live](https://mermaid.live)
- VS Code with Mermaid extension
- Any Mermaid renderer

The diagram should show:
- 8 tables: users, projects, tickets, comments, tags, ticket_tags, attachments, activity_log
- 1:many relationships (users → tickets, projects → tickets, etc.)
- Many-to-many via junction table (ticket_tags)
- Self-referential relationship (tickets.parent_id → tickets.id)
- Multiple FKs to same table (tickets.reporter_id and tickets.assignee_id both → users)

### Step 4: Demonstrate Determinism

**Run the script again** — identical output. Then ask the LLM the same question directly ("draw me an ERD of this database") and note how the response varies in format, detail, and accuracy.

## Takeaway

**Deterministic tooling > generative answers** for documentation. The script produces the same diagram every time, can be versioned, and updates automatically when the schema changes. The LLM is the tool-builder, not the tool itself.

## What the Audience Learns

- How to use SQLite PRAGMAs for schema introspection
- Mermaid syntax for ERD diagrams
- The distinction between using AI to generate tools vs. generate content
- Why documentation tools are more valuable than documentation
