-- CreateTable: ListingMember — users assigned to specific listings
CREATE TABLE "ListingMember" (
    "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID         NOT NULL,
    "user_id"    UUID         NOT NULL,
    "role"       TEXT         NOT NULL DEFAULT 'viewer',
    "added_by"   UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingMember_pkey" PRIMARY KEY ("id")
);

-- Unique: one membership per user per listing
CREATE UNIQUE INDEX "ListingMember_listing_id_user_id_key"
    ON "ListingMember"("listing_id", "user_id");

CREATE INDEX "ListingMember_listing_id_idx" ON "ListingMember"("listing_id");
CREATE INDEX "ListingMember_user_id_idx"    ON "ListingMember"("user_id");

-- FK: listing
ALTER TABLE "ListingMember"
    ADD CONSTRAINT "ListingMember_listing_id_fkey"
    FOREIGN KEY ("listing_id")
    REFERENCES "Listing"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: user
ALTER TABLE "ListingMember"
    ADD CONSTRAINT "ListingMember_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
