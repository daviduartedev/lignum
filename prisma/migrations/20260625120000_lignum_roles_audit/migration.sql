-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('login_success', 'login_failure', 'user_created', 'user_updated', 'user_deactivated', 'user_reactivated', 'user_role_changed', 'user_password_reset', 'erp_setting_updated');

-- Migrate Role enum to Lignum papéis (swap type — evita ADD VALUE + UPDATE na mesma transacção)
CREATE TYPE "Role_new" AS ENUM ('admin', 'vendedor', 'financeiro', 'producao', 'read_only');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE "role"::text
    WHEN 'admin' THEN 'admin'::"Role_new"
    WHEN 'sales' THEN 'vendedor'::"Role_new"
    WHEN 'authenticated' THEN 'vendedor'::"Role_new"
    WHEN 'finance' THEN 'financeiro'::"Role_new"
    WHEN 'public' THEN 'read_only'::"Role_new"
    WHEN 'read_only' THEN 'read_only'::"Role_new"
    ELSE 'vendedor'::"Role_new"
  END
);

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'vendedor';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" "AuditAction" NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");
CREATE INDEX "audit_logs_resource_type_created_at_idx" ON "audit_logs"("resource_type", "created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
