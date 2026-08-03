-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "genreTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "uploadedById" TEXT;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

