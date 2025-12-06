-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "business";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "citizen";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "gov";

-- CreateTable
CREATE TABLE "citizen"."citizen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen"."document" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."business" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usageLimit" INTEGER NOT NULL DEFAULT 1000,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gov"."audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "ipAddress" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "citizen_userId_key" ON "citizen"."citizen"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "business_userId_key" ON "business"."business"("userId");

-- AddForeignKey
ALTER TABLE "citizen"."document" ADD CONSTRAINT "document_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizen"."citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
