-- Stage 8: Teardown Movix — remove vehicle/revenda domain tables

-- Drop FK-dependent tables first
DROP TABLE IF EXISTS "user_stock_attention_preferences" CASCADE;
DROP TABLE IF EXISTS "sales" CASCADE;
DROP TABLE IF EXISTS "contracts" CASCADE;
DROP TABLE IF EXISTS "evaluations" CASCADE;
DROP TABLE IF EXISTS "purchase_evaluations" CASCADE;
DROP TABLE IF EXISTS "service_orders" CASCADE;
DROP TABLE IF EXISTS "warranties" CASCADE;
DROP TABLE IF EXISTS "promissory_notes" CASCADE;
DROP TABLE IF EXISTS "senatran_lookup_audits" CASCADE;
DROP TABLE IF EXISTS "vehicles" CASCADE;

-- Clean surviving tables
ALTER TABLE "payables" DROP COLUMN IF EXISTS "vehicle_id";
ALTER TABLE "storefront_leads" DROP COLUMN IF EXISTS "vehicle_id";

ALTER TABLE "erp_settings" DROP COLUMN IF EXISTS "alert_giro_enabled";
ALTER TABLE "erp_settings" DROP COLUMN IF EXISTS "alert_giro_warn_days";
ALTER TABLE "erp_settings" DROP COLUMN IF EXISTS "alert_giro_crit_days";
ALTER TABLE "erp_settings" DROP COLUMN IF EXISTS "alert_prom_enabled";
ALTER TABLE "erp_settings" DROP COLUMN IF EXISTS "alert_prom_days_before";

-- Drop Movix enums (orphans after table drops)
DROP TYPE IF EXISTS "VehicleStatus";
DROP TYPE IF EXISTS "FuelType";
DROP TYPE IF EXISTS "TransmissionType";
DROP TYPE IF EXISTS "PaymentMethod";
DROP TYPE IF EXISTS "PurchaseEvaluationOutcome";
DROP TYPE IF EXISTS "PurchaseEvaluationReason";
DROP TYPE IF EXISTS "ContractType";
DROP TYPE IF EXISTS "ContractStatus";
DROP TYPE IF EXISTS "ServiceOrderType";
DROP TYPE IF EXISTS "ServiceOrderStatus";
DROP TYPE IF EXISTS "WarrantyType";
DROP TYPE IF EXISTS "WarrantyStatus";
DROP TYPE IF EXISTS "PromissoryNoteStatus";
DROP TYPE IF EXISTS "VehicleLegalSituation";
DROP TYPE IF EXISTS "VehicleCategoryKind";
DROP TYPE IF EXISTS "VehicleCautelar";

-- PayableOrigin: remove compra_veiculo value (recreate enum)
ALTER TYPE "PayableOrigin" RENAME TO "PayableOrigin_old";
CREATE TYPE "PayableOrigin" AS ENUM ('manual', 'outro');
ALTER TABLE "payables" ALTER COLUMN "origin" TYPE "PayableOrigin" USING (
  CASE WHEN "origin"::text = 'compra_veiculo' THEN 'outro'::"PayableOrigin" ELSE "origin"::text::"PayableOrigin" END
);
DROP TYPE "PayableOrigin_old";

-- FinanceEventType: remove promissory_note_due
ALTER TYPE "FinanceEventType" RENAME TO "FinanceEventType_old";
CREATE TYPE "FinanceEventType" AS ENUM ('payable_due');
ALTER TABLE "finance_notification_dispatches" ALTER COLUMN "event_type" TYPE "FinanceEventType" USING 'payable_due'::"FinanceEventType";
DROP TYPE "FinanceEventType_old";
