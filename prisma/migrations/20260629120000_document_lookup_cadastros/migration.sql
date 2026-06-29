-- AlterTable
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "registration_status" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "registration_status" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "document_lookup_audits" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "document_normalized" TEXT NOT NULL,
    "document_kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "cost" DECIMAL(14,4) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_code" TEXT,
    "cached_response" BOOLEAN NOT NULL DEFAULT false,
    "snapshot_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_lookup_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_lookup_audits_user_id_created_at_idx" ON "document_lookup_audits"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "document_lookup_audits_created_at_idx" ON "document_lookup_audits"("created_at");

DO $$ BEGIN
  ALTER TABLE "document_lookup_audits" ADD CONSTRAINT "document_lookup_audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
