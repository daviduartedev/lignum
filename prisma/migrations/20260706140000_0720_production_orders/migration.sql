-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('aguardando', 'andamento', 'concluida', 'cancelada');

-- CreateTable
CREATE TABLE "production_orders" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "order_number" TEXT,
    "quote_id" INTEGER NOT NULL,
    "technical_sheet_id" INTEGER NOT NULL,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'aguardando',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_order_employees" (
    "production_order_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_order_employees_pkey" PRIMARY KEY ("production_order_id","employee_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_document_id_key" ON "production_orders"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_order_number_key" ON "production_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_quote_id_key" ON "production_orders"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_technical_sheet_id_key" ON "production_orders"("technical_sheet_id");

-- CreateIndex
CREATE INDEX "production_orders_status_idx" ON "production_orders"("status");

-- CreateIndex
CREATE INDEX "production_order_employees_employee_id_idx" ON "production_order_employees"("employee_id");

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_technical_sheet_id_fkey" FOREIGN KEY ("technical_sheet_id") REFERENCES "technical_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_employees" ADD CONSTRAINT "production_order_employees_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
