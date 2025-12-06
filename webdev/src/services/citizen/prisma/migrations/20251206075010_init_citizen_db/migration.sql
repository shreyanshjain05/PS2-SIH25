-- CreateTable
CREATE TABLE "citizen" (
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
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "citizen_userId_key" ON "citizen"("userId");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
