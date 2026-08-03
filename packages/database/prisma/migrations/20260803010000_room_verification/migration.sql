-- CreateEnum
CREATE TYPE "RoomVerificationStatus" AS ENUM ('PENDING', 'VERIFIED');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "streamKey" TEXT NOT NULL,
ADD COLUMN     "verificationStatus" "RoomVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verificationToken" TEXT NOT NULL,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ALTER COLUMN "imvuRoomId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "rooms_verificationToken_key" ON "rooms"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_streamKey_key" ON "rooms"("streamKey");

