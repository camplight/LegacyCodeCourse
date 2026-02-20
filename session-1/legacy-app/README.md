# BugBase - Issue Tracking System

A lightweight issue/ticket tracking system built with Node.js and SQLite.

## Features

- Create and manage tickets with priorities, statuses, and tags
- Project organization
- User management
- Activity tracking
- Dashboard and reports

## Getting Started

### Prerequisites

- Node.js installed
- npm

### Installation

```bash
npm install
```

### Running the app

```bash
npm run dev
```

The server will start on http://localhost:3000.

### Running Tests

```bash
npm test
```

### Docker

You can also run BugBase using Docker:

```bash
docker-compose up
```

## API Endpoints

### Tickets
- `GET /api/tickets` - List all tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project

### Reports
- `GET /api/reports/dashboard` - Dashboard summary

## Authentication

Use the `x-api-key` header or Bearer token for authentication.

## Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

## License

ISC
