-- AlterTable
ALTER TABLE "User" ADD COLUMN     "establishmentSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_establishmentSlug_key" ON "User"("establishmentSlug");
