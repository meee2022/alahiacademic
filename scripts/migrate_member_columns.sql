-- Add missing columns to Member table
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "dateOfBirth" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
