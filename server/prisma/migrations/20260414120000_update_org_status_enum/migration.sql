-- AlterEnum
ALTER TYPE "OrgStatus" RENAME TO "OrgStatus_old";

CREATE TYPE "OrgStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');

ALTER TABLE "Organization" ALTER COLUMN status DROP DEFAULT;

UPDATE "Organization" SET status = 'SUBMITTED'::"OrgStatus" WHERE status = 'KYC_SUBMITTED'::"OrgStatus_old";

ALTER TABLE "Organization" ALTER COLUMN status TYPE "OrgStatus" USING status::text::"OrgStatus";

ALTER TABLE "Organization" ALTER COLUMN status SET DEFAULT 'PENDING'::"OrgStatus";

DROP TYPE "OrgStatus_old";
