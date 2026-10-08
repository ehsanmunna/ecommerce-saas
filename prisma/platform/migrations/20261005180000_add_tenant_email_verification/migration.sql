-- AlterEnum
ALTER TYPE "TenantStatus" ADD VALUE 'PENDING_VERIFICATION';

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "email_verified_at" TIMESTAMP(3),
ADD COLUMN "verification_token_hash" TEXT,
ADD COLUMN "verification_expires_at" TIMESTAMP(3),
ADD COLUMN "last_verification_sent_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_verification_token_hash_key" ON "tenants"("verification_token_hash");
