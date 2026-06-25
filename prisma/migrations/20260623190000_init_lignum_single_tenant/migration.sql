-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'authenticated', 'public', 'sales', 'finance', 'read_only');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('disponivel', 'repasse', 'reservado', 'vendido', 'removido', 'standby_nao_compra');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('flex', 'gasolina', 'diesel', 'eletrico', 'hibrido');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('manual', 'automatico', 'cvt');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('financiamento', 'a_vista', 'cartao', 'troca', 'pix', 'promissoria');

-- CreateEnum
CREATE TYPE "PurchaseEvaluationOutcome" AS ENUM ('pendente', 'nao_comprado', 'comprado');

-- CreateEnum
CREATE TYPE "PurchaseEvaluationReason" AS ENUM ('preco', 'estado', 'documentacao', 'desistencia', 'outro');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('compra_venda', 'financiamento', 'consorcio', 'locacao');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('rascunho', 'pendente_assinatura', 'assinado', 'cancelado');

-- CreateEnum
CREATE TYPE "ServiceOrderType" AS ENUM ('manutencao', 'revisao', 'funilaria', 'eletrica', 'mecanica', 'estetica', 'outros');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('aguardando', 'andamento', 'concluida', 'cancelada');

-- CreateEnum
CREATE TYPE "WarrantyType" AS ENUM ('motor_cambio', 'completa', 'motor', 'acessorios', 'outros');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('ativa', 'vencendo', 'expirada', 'cancelada');

-- CreateEnum
CREATE TYPE "PromissoryNoteStatus" AS ENUM ('aberta', 'paga', 'vencida', 'cancelada');

-- CreateEnum
CREATE TYPE "PayableStatus" AS ENUM ('aberta', 'paga', 'vencida', 'cancelada');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "PayableOrigin" AS ENUM ('manual', 'compra_veiculo', 'outro');

-- CreateEnum
CREATE TYPE "FinanceEventType" AS ENUM ('promissory_note_due', 'payable_due');

-- CreateEnum
CREATE TYPE "VehicleLegalSituation" AS ENUM ('regular', 'irregular', 'com_restricao');

-- CreateEnum
CREATE TYPE "VehicleCategoryKind" AS ENUM ('carro', 'moto', 'onibus', 'jet_ski', 'outros');

-- CreateEnum
CREATE TYPE "VehicleCautelar" AS ENUM ('nao', 'leilao', 'sinistro', 'leilao_sinistro', 'outras_restricoes');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'sales',
    "lgpd_consent_version" TEXT,
    "lgpd_consent_at" TIMESTAMP(3),
    "show_dashboard_attention_stripe" BOOLEAN NOT NULL DEFAULT true,
    "finance_event_notify_days_before_override" INTEGER,
    "session_revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT,
    "year_manufacture" INTEGER NOT NULL,
    "year_model" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "color" TEXT,
    "fuel" "FuelType",
    "transmission" "TransmissionType",
    "fipe_price" DECIMAL(14,2),
    "purchase_price" DECIMAL(14,2) NOT NULL,
    "estimated_maintenance_cost" DECIMAL(14,2),
    "selling_price" DECIMAL(14,2),
    "minimum_selling_price" DECIMAL(14,2),
    "status" "VehicleStatus" NOT NULL,
    "observations" TEXT,
    "doors_count" INTEGER,
    "last_licensing_date" DATE,
    "purchase_entry_at" TIMESTAMP(3),
    "purchase_entry_mileage" INTEGER,
    "purchase_supplier_id" INTEGER,
    "purchase_payment_json" JSONB,
    "main_photo_url" TEXT,
    "gallery_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachment_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "buyer_id" INTEGER,
    "renavam" TEXT NOT NULL DEFAULT '',
    "chassis" TEXT NOT NULL DEFAULT '',
    "legal_situation" "VehicleLegalSituation" NOT NULL DEFAULT 'regular',
    "category_kind" "VehicleCategoryKind" NOT NULL DEFAULT 'carro',
    "cautelar" "VehicleCautelar" NOT NULL DEFAULT 'nao',
    "species_category" TEXT,
    "registration_city" TEXT,
    "registration_uf" TEXT,
    "listing_title" TEXT,
    "official_extra_fields" JSONB,
    "senatran_field_provenance" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stock_attention_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "snoozed_until" TIMESTAMP(3),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stock_attention_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "full_name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "person_type" "PersonType",
    "rg" TEXT,
    "marital_status" TEXT,
    "profession" TEXT,
    "zip_code" TEXT,
    "nationality" TEXT,
    "neighborhood" TEXT,
    "street" TEXT,
    "city" TEXT,
    "street_number" TEXT,
    "address_complement" TEXT,
    "birth_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_documents" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "external_url" TEXT,
    "document_file_url" TEXT,
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "sale_date" DATE NOT NULL,
    "final_price" DECIMAL(14,2) NOT NULL,
    "payment_method" "PaymentMethod",
    "financing_bank" TEXT,
    "notes" TEXT,
    "vehicle_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "seller_user_id" INTEGER,
    "seller_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "contract_type" "ContractType" NOT NULL,
    "contract_value" DECIMAL(14,2) NOT NULL,
    "contract_date" DATE NOT NULL,
    "status" "ContractStatus" NOT NULL,
    "special_clauses" TEXT,
    "witness_1_name" TEXT,
    "witness_1_document" TEXT,
    "witness_2_name" TEXT,
    "witness_2_document" TEXT,
    "vehicle_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "score" DOUBLE PRECISION,
    "observations" TEXT,
    "technical_notes" TEXT,
    "checklist_json" JSONB,
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vehicle_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_evaluations" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "vehicle_id" INTEGER NOT NULL,
    "client_id" INTEGER,
    "outcome" "PurchaseEvaluationOutcome" NOT NULL,
    "reason_code" "PurchaseEvaluationReason",
    "reason_detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "workshop_name" TEXT NOT NULL,
    "service_type" "ServiceOrderType" NOT NULL,
    "service_type_other_text" TEXT,
    "status" "ServiceOrderStatus" NOT NULL,
    "entry_date" DATE NOT NULL,
    "due_date" DATE,
    "responsible" TEXT,
    "description" TEXT,
    "parts_json" JSONB,
    "labor_json" JSONB,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vehicle_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranties" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "warranty_type" "WarrantyType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "coverage_value" DECIMAL(14,2) NOT NULL,
    "status" "WarrantyStatus" NOT NULL,
    "notes" TEXT,
    "vehicle_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promissory_notes" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "installment_number" INTEGER NOT NULL,
    "total_installments" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "PromissoryNoteStatus" NOT NULL,
    "payment_date" DATE,
    "notes" TEXT,
    "client_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promissory_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "company_name" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "zip_code" TEXT,
    "neighborhood" TEXT,
    "street" TEXT,
    "city" TEXT,
    "street_number" TEXT,
    "address_complement" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payables" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "origin" "PayableOrigin" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "PayableStatus" NOT NULL DEFAULT 'aberta',
    "payment_date" DATE,
    "notes" TEXT,
    "vehicle_id" INTEGER,
    "supplier_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "remind_at" TIMESTAMP(3),
    "owner_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_notification_dispatches" (
    "id" SERIAL NOT NULL,
    "event_type" "FinanceEventType" NOT NULL,
    "event_id" INTEGER NOT NULL,
    "owner_user_id" INTEGER NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_notification_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "company_name" TEXT NOT NULL DEFAULT '',
    "company_tax_id" TEXT NOT NULL DEFAULT '',
    "company_state_reg" TEXT NOT NULL DEFAULT '',
    "company_address" TEXT NOT NULL DEFAULT '',
    "company_city" TEXT NOT NULL DEFAULT '',
    "company_state" TEXT NOT NULL DEFAULT '',
    "company_zip" TEXT NOT NULL DEFAULT '',
    "company_phone" TEXT NOT NULL DEFAULT '',
    "company_email" TEXT NOT NULL DEFAULT '',
    "alert_giro_enabled" BOOLEAN NOT NULL DEFAULT true,
    "alert_giro_warn_days" INTEGER NOT NULL DEFAULT 30,
    "alert_giro_crit_days" INTEGER NOT NULL DEFAULT 45,
    "alert_prom_enabled" BOOLEAN NOT NULL DEFAULT true,
    "alert_prom_days_before" INTEGER NOT NULL DEFAULT 7,
    "alert_docs_enabled" BOOLEAN NOT NULL DEFAULT true,
    "alert_email_digest_enabled" BOOLEAN NOT NULL DEFAULT true,
    "finance_event_notify_days_before" INTEGER NOT NULL DEFAULT 1,
    "inbox_pre_event_popup_minutes" INTEGER NOT NULL DEFAULT 30,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "erp_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senatran_lookup_audits" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plate_normalized" TEXT NOT NULL,
    "renavam_query" TEXT,
    "provider" TEXT NOT NULL,
    "cost" DECIMAL(14,4) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_code" TEXT,
    "cached_response" BOOLEAN NOT NULL DEFAULT false,
    "snapshot_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "senatran_lookup_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storefront_leads" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "vehicle_id" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'crm',
    "consent_text" TEXT NOT NULL,
    "consent_at" TIMESTAMP(3) NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storefront_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_document_id_key" ON "vehicles"("document_id");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_plate_idx" ON "vehicles"("plate");

-- CreateIndex
CREATE INDEX "vehicles_buyer_id_idx" ON "vehicles"("buyer_id");

-- CreateIndex
CREATE INDEX "vehicles_purchase_supplier_id_idx" ON "vehicles"("purchase_supplier_id");

-- CreateIndex
CREATE INDEX "user_stock_attention_preferences_user_id_idx" ON "user_stock_attention_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_stock_attention_preferences_user_id_vehicle_id_key" ON "user_stock_attention_preferences"("user_id", "vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_document_id_key" ON "clients"("document_id");

-- CreateIndex
CREATE INDEX "clients_document_idx" ON "clients"("document");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_documents_document_id_key" ON "client_documents"("document_id");

-- CreateIndex
CREATE INDEX "client_documents_client_id_idx" ON "client_documents"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_document_id_key" ON "sales"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_vehicle_id_key" ON "sales"("vehicle_id");

-- CreateIndex
CREATE INDEX "sales_client_id_idx" ON "sales"("client_id");

-- CreateIndex
CREATE INDEX "sales_seller_user_id_idx" ON "sales"("seller_user_id");

-- CreateIndex
CREATE INDEX "sales_sale_date_idx" ON "sales"("sale_date");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_document_id_key" ON "contracts"("document_id");

-- CreateIndex
CREATE INDEX "contracts_vehicle_id_idx" ON "contracts"("vehicle_id");

-- CreateIndex
CREATE INDEX "contracts_client_id_idx" ON "contracts"("client_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_document_id_key" ON "evaluations"("document_id");

-- CreateIndex
CREATE INDEX "evaluations_vehicle_id_idx" ON "evaluations"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_evaluations_document_id_key" ON "purchase_evaluations"("document_id");

-- CreateIndex
CREATE INDEX "purchase_evaluations_vehicle_id_idx" ON "purchase_evaluations"("vehicle_id");

-- CreateIndex
CREATE INDEX "purchase_evaluations_client_id_idx" ON "purchase_evaluations"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_document_id_key" ON "service_orders"("document_id");

-- CreateIndex
CREATE INDEX "service_orders_vehicle_id_idx" ON "service_orders"("vehicle_id");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "warranties_document_id_key" ON "warranties"("document_id");

-- CreateIndex
CREATE INDEX "warranties_vehicle_id_idx" ON "warranties"("vehicle_id");

-- CreateIndex
CREATE INDEX "warranties_client_id_idx" ON "warranties"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "promissory_notes_document_id_key" ON "promissory_notes"("document_id");

-- CreateIndex
CREATE INDEX "promissory_notes_client_id_idx" ON "promissory_notes"("client_id");

-- CreateIndex
CREATE INDEX "promissory_notes_vehicle_id_idx" ON "promissory_notes"("vehicle_id");

-- CreateIndex
CREATE INDEX "promissory_notes_due_date_idx" ON "promissory_notes"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_document_id_key" ON "suppliers"("document_id");

-- CreateIndex
CREATE INDEX "suppliers_company_name_idx" ON "suppliers"("company_name");

-- CreateIndex
CREATE UNIQUE INDEX "payables_document_id_key" ON "payables"("document_id");

-- CreateIndex
CREATE INDEX "payables_due_date_idx" ON "payables"("due_date");

-- CreateIndex
CREATE INDEX "payables_status_idx" ON "payables"("status");

-- CreateIndex
CREATE INDEX "payables_origin_idx" ON "payables"("origin");

-- CreateIndex
CREATE INDEX "payables_vehicle_id_idx" ON "payables"("vehicle_id");

-- CreateIndex
CREATE INDEX "payables_supplier_id_idx" ON "payables"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_notifications_document_id_key" ON "user_notifications"("document_id");

-- CreateIndex
CREATE INDEX "user_notifications_owner_user_id_idx" ON "user_notifications"("owner_user_id");

-- CreateIndex
CREATE INDEX "user_notifications_read_idx" ON "user_notifications"("read");

-- CreateIndex
CREATE INDEX "user_notifications_remind_at_idx" ON "user_notifications"("remind_at");

-- CreateIndex
CREATE INDEX "finance_notification_dispatches_owner_user_id_idx" ON "finance_notification_dispatches"("owner_user_id");

-- CreateIndex
CREATE INDEX "finance_notification_dispatches_scheduled_for_idx" ON "finance_notification_dispatches"("scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "finance_notification_dispatches_event_type_event_id_owner_u_key" ON "finance_notification_dispatches"("event_type", "event_id", "owner_user_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "senatran_lookup_audits_user_id_created_at_idx" ON "senatran_lookup_audits"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "senatran_lookup_audits_created_at_idx" ON "senatran_lookup_audits"("created_at");

-- CreateIndex
CREATE INDEX "storefront_leads_vehicle_id_idx" ON "storefront_leads"("vehicle_id");

-- CreateIndex
CREATE INDEX "storefront_leads_created_at_idx" ON "storefront_leads"("created_at");

-- CreateIndex
CREATE INDEX "storefront_leads_read_at_idx" ON "storefront_leads"("read_at");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_purchase_supplier_id_fkey" FOREIGN KEY ("purchase_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stock_attention_preferences" ADD CONSTRAINT "user_stock_attention_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stock_attention_preferences" ADD CONSTRAINT "user_stock_attention_preferences_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_evaluations" ADD CONSTRAINT "purchase_evaluations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_evaluations" ADD CONSTRAINT "purchase_evaluations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promissory_notes" ADD CONSTRAINT "promissory_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promissory_notes" ADD CONSTRAINT "promissory_notes_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_notification_dispatches" ADD CONSTRAINT "finance_notification_dispatches_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "senatran_lookup_audits" ADD CONSTRAINT "senatran_lookup_audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_leads" ADD CONSTRAINT "storefront_leads_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

