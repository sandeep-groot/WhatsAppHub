# WhatsApp Hub — Backend Service

NestJS API for WhatsApp Hub.

## Stack

- NestJS 11 + TypeScript
- PostgreSQL + Prisma 6
- JWT access tokens + opaque refresh tokens (rotation)
- Zod validation (`nestjs-zod`) + OpenAPI at `/docs`

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Setup

```bash
cp .env.example .env
# Edit DATABASE_URL and JWT secrets (min 32 characters)

npm install
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

API base: `http://localhost:3001/v1`  
Swagger: `http://localhost:3001/docs`

### Default seed admin

- Email: `admin@groot.com`
- Password: `ChangeMe123!`

Override with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

## Endpoints

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/v1/health` | Public | — |
| GET | `/v1/health/live` | Public | — |
| GET | `/v1/health/ready` | Public | — |
| POST | `/v1/auth/login` | Public | — |
| POST | `/v1/auth/refresh` | Public | — |
| POST | `/v1/auth/logout` | Bearer | Any |
| GET | `/v1/auth/me` | Bearer | Any |
| GET | `/v1/users` | Bearer | ADMIN |
| POST | `/v1/users` | Bearer | ADMIN |
| GET | `/v1/audit-logs` | Bearer | All roles |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build |
| `npm run prisma:migrate` | Create/apply migrations (dev) |
| `npm run prisma:seed` | Seed roles, permissions, admin |
| `npm run prisma:generate` | Regenerate Prisma client |

## Project structure

See `src/` — `config`, `common`, `database`, `modules` (health, auth, users, audit). M2+ adds clients, projects, assets, webhooks, queue, etc.
