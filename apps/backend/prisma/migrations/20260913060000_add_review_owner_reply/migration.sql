-- AlterTable
ALTER TABLE "Review" ADD COLUMN "ownerReply" TEXT,
ADD COLUMN "ownerRepliedAt" TIMESTAMP(3);
