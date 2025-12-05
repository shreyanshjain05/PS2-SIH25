/*
  Warnings:

  - Added the required column `updatedAt` to the `api_key` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "api_key" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRefillAt" TIMESTAMP(3),
ADD COLUMN     "lastRequest" TIMESTAMP(3),
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "prefix" TEXT,
ADD COLUMN     "rateLimitEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rateLimitMax" INTEGER,
ADD COLUMN     "rateLimitTimeWindow" INTEGER,
ADD COLUMN     "refillAmount" INTEGER,
ADD COLUMN     "refillInterval" INTEGER,
ADD COLUMN     "remaining" INTEGER,
ADD COLUMN     "requestCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "start" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
