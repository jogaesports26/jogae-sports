-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aboutDescription" TEXT,
ADD COLUMN     "coverPhotoUrl" TEXT,
ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[];
