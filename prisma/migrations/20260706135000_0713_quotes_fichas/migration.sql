-- Orçamentos, body models e fichas técnicas (cycle 0713) — prerequisite de production_orders
CREATE TYPE "QuoteStatus" AS ENUM ('rascunho', 'enviado', 'aprovado', 'convertido', 'cancelado');

CREATE TYPE "BodyCoverStyle" AS ENUM ('tampa_plana', 'tampa_arqueada', 'tampa_basculante');

CREATE TYPE "BodyFloorType" AS ENUM ('assoalho_madeira', 'assoalho_aco', 'assoalho_aluminio');

CREATE TYPE "BodyFinishType" AS ENUM ('pintura', 'verniz', 'lamina_natural');

CREATE TABLE "body_models" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DECIMAL(14,2) NOT NULL,
    "price_per_m2" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_models_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotes" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "quote_number" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'rascunho',
    "client_id" INTEGER NOT NULL,
    "body_model_id" INTEGER,
    "length_m" DECIMAL(8,2) NOT NULL,
    "width_m" DECIMAL(8,2) NOT NULL,
    "height_m" DECIMAL(8,2) NOT NULL,
    "cover_style" "BodyCoverStyle" NOT NULL,
    "floor_type" "BodyFloorType" NOT NULL,
    "finish_type" "BodyFinishType" NOT NULL,
    "options_json" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "margin_percent" DECIMAL(5,2),
    "payment_terms" TEXT,
    "delivery_days" INTEGER,
    "notes" TEXT,
    "valid_until" DATE,
    "approved_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "created_by_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_items" (
    "id" SERIAL NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "item_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "unit_price" DECIMAL(14,2) NOT NULL,
    "total_price" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "technical_sheets" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "quote_id" INTEGER NOT NULL,
    "sheet_number" TEXT,
    "bom_json" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technical_sheets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "body_models_document_id_key" ON "body_models"("document_id");

CREATE UNIQUE INDEX "quotes_document_id_key" ON "quotes"("document_id");

CREATE UNIQUE INDEX "quotes_quote_number_key" ON "quotes"("quote_number");

CREATE INDEX "quotes_status_idx" ON "quotes"("status");

CREATE INDEX "quotes_client_id_idx" ON "quotes"("client_id");

CREATE INDEX "quote_items_quote_id_idx" ON "quote_items"("quote_id");

CREATE UNIQUE INDEX "technical_sheets_document_id_key" ON "technical_sheets"("document_id");

CREATE UNIQUE INDEX "technical_sheets_quote_id_key" ON "technical_sheets"("quote_id");

ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "quotes" ADD CONSTRAINT "quotes_body_model_id_fkey" FOREIGN KEY ("body_model_id") REFERENCES "body_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "technical_sheets" ADD CONSTRAINT "technical_sheets_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
