-- AlterTable
ALTER TABLE "room_members" ADD COLUMN "imvuDisplayName" TEXT;

-- CreateTable
CREATE TABLE "imvu_bot_credentials" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imvu_bot_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imvu_bot_credentials_roomId_key" ON "imvu_bot_credentials"("roomId");

-- AddForeignKey
ALTER TABLE "imvu_bot_credentials" ADD CONSTRAINT "imvu_bot_credentials_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
