-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ACTIVE', 'INACTIVE', 'ERROR');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wabaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppNumber" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "voipProvider" TEXT,
    "countryCode" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "businessManagerId" TEXT,
    "wabaId" TEXT,
    "phoneNumberId" TEXT,
    "ycloudAccountId" TEXT,
    "connectionStatus" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "webhookUrl" TEXT,
    "webhookVerifyToken" TEXT,
    "lastPing" TIMESTAMP(3),
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingStep" (
    "id" TEXT NOT NULL,
    "numberId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "numberId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "senderNumber" TEXT NOT NULL,
    "messageBody" TEXT,
    "status" TEXT NOT NULL,
    "ycloudMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_wabaId_key" ON "Client"("wabaId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppNumber_phoneNumber_key" ON "WhatsAppNumber"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppNumber_phoneNumberId_key" ON "WhatsAppNumber"("phoneNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingStep_numberId_stepNumber_key" ON "OnboardingStep"("numberId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Message_ycloudMessageId_key" ON "Message"("ycloudMessageId");

-- AddForeignKey
ALTER TABLE "WhatsAppNumber" ADD CONSTRAINT "WhatsAppNumber_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_numberId_fkey" FOREIGN KEY ("numberId") REFERENCES "WhatsAppNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_numberId_fkey" FOREIGN KEY ("numberId") REFERENCES "WhatsAppNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
