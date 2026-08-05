-- CreateEnum
CREATE TYPE "GuardianLicensePlan" AS ENUM ('DAY_1', 'WEEK_1', 'MONTH_1', 'MONTH_3', 'YEAR_1');

-- CreateEnum
CREATE TYPE "GuardianLicenseSource" AS ENUM ('CREDIT_PURCHASE', 'MANUAL_GRANT');

-- CreateTable
CREATE TABLE "guardian_licenses" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "plan" "GuardianLicensePlan" NOT NULL,
    "source" "GuardianLicenseSource" NOT NULL,
    "creditsCost" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardian_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guardian_licenses_roomId_expiresAt_idx" ON "guardian_licenses"("roomId", "expiresAt");

-- AddForeignKey
ALTER TABLE "guardian_licenses" ADD CONSTRAINT "guardian_licenses_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_licenses" ADD CONSTRAINT "guardian_licenses_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
