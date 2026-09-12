-- AlterTable
ALTER TABLE "MaintenanceBlock" ADD COLUMN     "cost" DECIMAL(10,2),
ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RecurringMaintenanceBlock" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringMaintenanceBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringMaintenanceBlock_courtId_dayOfWeek_idx" ON "RecurringMaintenanceBlock"("courtId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "RecurringMaintenanceBlock" ADD CONSTRAINT "RecurringMaintenanceBlock_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
