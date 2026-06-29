-- CreateTable
CREATE TABLE "language_codes" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "language_codes_code_key" ON "language_codes"("code");

-- CreateIndex
CREATE INDEX "language_codes_language_idx" ON "language_codes"("language");
