# WhatsApp Hub Backend Service

This repository contains the NestJS backend for the WhatsApp Hub platform. It exposes a REST API under the `/v1` prefix, serves Swagger documentation at `/docs`, and uses PostgreSQL with Prisma for persistence.

## What this service provides

- Authentication and authorization with JWT access/refresh tokens
- User, role, audit, client, WhatsApp number, webhook, and language-code management
- Swagger/OpenAPI documentation
- Prisma-based database migrations and seed data
- CORS, cookie-based auth support, and environment-based configuration

## Tech stack

- Node.js 20+
- NestJS 11 + TypeScript
- PostgreSQL 14+
- Prisma 6
- Zod validation via `nestjs-zod`
- Swagger UI at `/docs`

## Prerequisites

Before starting, make sure you have:

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL 14 or newer
- A database created for the application

## 1. Initial setup

### Clone and install dependencies

```bash
npm install
```

### Create environment configuration

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

The application expects the following environment variables:

```env
NODE_ENV=development
PORT=3001

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whatsapp_hub?schema=public

JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

BSP_PROVIDER=ycloud
NUMBER_PROVIDER=twilio

PUBLIC_API_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Important notes:

- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be at least 32 characters long.
- `DATABASE_URL` must point to an existing PostgreSQL database.
- `PUBLIC_API_URL` is used by Swagger for the server URL dropdown.
- `CORS_ORIGINS` is a comma-separated list of allowed frontend origins.

Optional provider credentials:

```env
YCLOUD_API_KEY=
YCLOUD_API_BASE_URL=https://api.ycloud.com/v2
YCLOUD_SOLUTION_ID=
YCLOUD_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

## 2. Database setup

Generate the Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

If you want to seed the application with roles, permissions, webhook event types, language codes, and the default admin user, run:

```bash
npm run prisma:seed
```

## 3. Run locally

Start the development server:

```bash
npm run start:dev
```

The service will be available at:

- API base URL: http://localhost:3001/v1
- Swagger docs: http://localhost:3001/docs
- Health check: http://localhost:3001/v1/health

## 4. Default seed admin

The seed process creates a default admin account:

- Email: `admin@praxion.local`
- Password: `ChangeMe123!`

You can override these values with:

```bash
SEED_ADMIN_EMAIL=your@email.com
SEED_ADMIN_PASSWORD=your-strong-password
```

## 5. Deployment guide

### Build for production

```bash
npm run build
```

### Production start command

```bash
npm run start:prod
```

### Production prerequisites

Before deploying, ensure that all required environment variables are set in your hosting platform:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PUBLIC_API_URL`
- `CORS_ORIGINS`

### Recommended deployment steps

1. Build the application with `npm run build`.
2. Set production environment variables in your host (Render, Railway, VPS, container platform, etc.).
3. Run database migrations:

```bash
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
```

4. Start the app with:

```bash
npm run start:prod
```

If your deployment platform uses a different startup command, point it to the compiled NestJS entrypoint or the `npm run start:prod` script.

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start the app in watch mode |
| `npm run start:prod` | Start the built application |
| `npm run build` | Compile the NestJS application |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:migrate` | Create and apply migrations in development |
| `npm run prisma:seed` | Seed roles, permissions, webhook catalog, language codes, and admin user |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

## Main API endpoints

A few important routes:

- `GET /v1/health`
- `GET /v1/health/live`
- `GET /v1/health/ready`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `GET /v1/auth/me`
- `GET /v1/users`
- `GET /v1/audit-logs`

## Project layout

The main source folders are:

- `src/app.module.ts` — application root module
- `src/main.ts` — bootstrap and Swagger/CORS setup
- `src/config/` — environment, Swagger, and configuration helpers
- `src/modules/` — controllers/services for auth, users, health, integrations, webhooks, WhatsApp, and more
- `src/database/prisma/` — Prisma schema, migrations, and seed logic
