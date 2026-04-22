-- Drop the FK constraint on TeamInvite.email → User.email
-- This was blocking invites to new (unregistered) users.
-- The email field is now a plain string; user lookup is done in application code.
ALTER TABLE "TeamInvite" DROP CONSTRAINT IF EXISTS "TeamInvite_email_fkey";
