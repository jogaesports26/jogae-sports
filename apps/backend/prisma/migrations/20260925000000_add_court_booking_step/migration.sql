-- AlterTable
ALTER TABLE "Court" ADD COLUMN "maxBookingMinutes" INTEGER,
ADD COLUMN "bookingStepMinutes" INTEGER NOT NULL DEFAULT 30;
