-- Drop the foreign key constraint from QueueItem to Listing
-- reference_id is now a generic UUID that can point to any model (Listing, Inquiry, Organization)
ALTER TABLE "QueueItem" DROP CONSTRAINT IF EXISTS "QueueItem_Listing_fkey";
