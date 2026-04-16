-- Add token and expires_at to TeamInvite for secure invite link flow
ALTER TABLE "TeamInvite" ADD COLUMN IF NOT EXISTS "token" TEXT UNIQUE;
ALTER TABLE "TeamInvite" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
