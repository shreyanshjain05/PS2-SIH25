-- CreateTable
CREATE TABLE "usage_log" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "usage_log" ADD CONSTRAINT "usage_log_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
