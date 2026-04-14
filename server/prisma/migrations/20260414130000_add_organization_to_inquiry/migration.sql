-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN "organization_id" UUID;

-- CreateIndex
CREATE INDEX "Inquiry_organization_id_idx" ON "Inquiry"("organization_id");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
