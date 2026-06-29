-- Convert all DateTime columns from `timestamp without time zone` to
-- `timestamptz` so stored values are absolute UTC instants, independent of
-- the database session timezone.
--
-- Existing rows were written as UTC wall-clock time (the app pins
-- process.env.TZ = 'UTC' and Prisma normalizes to UTC), so we reinterpret the
-- naive values as UTC via `AT TIME ZONE 'UTC'` during the type change.

-- User
ALTER TABLE "User"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- Role
ALTER TABLE "Role"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- Permission
ALTER TABLE "Permission"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- RefreshToken
ALTER TABLE "RefreshToken"
  ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "revokedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "revokedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AuditLog
ALTER TABLE "AuditLog"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- Client
ALTER TABLE "Client"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- WhatsAppNumber
ALTER TABLE "WhatsAppNumber"
  ALTER COLUMN "purchaseDate" SET DATA TYPE TIMESTAMPTZ(3) USING "purchaseDate" AT TIME ZONE 'UTC',
  ALTER COLUMN "lastPing" SET DATA TYPE TIMESTAMPTZ(3) USING "lastPing" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- OnboardingStep
ALTER TABLE "OnboardingStep"
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- Message
ALTER TABLE "Message"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- WebhookEvent
ALTER TABLE "WebhookEvent"
  ALTER COLUMN "processedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "processedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- whatsapp_messages
ALTER TABLE "whatsapp_messages"
  ALTER COLUMN "sendTime" SET DATA TYPE TIMESTAMPTZ(3) USING "sendTime" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdOn" SET DATA TYPE TIMESTAMPTZ(3) USING "createdOn" AT TIME ZONE 'UTC';
