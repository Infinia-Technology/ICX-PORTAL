-- Remove NDA fields from Organization table
-- These fields are no longer part of the product requirements.

ALTER TABLE "Organization" DROP COLUMN IF EXISTS "nda_required";
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "nda_signed";
