-- CreateEnum
CREATE TYPE "UsedBodyStatus" AS ENUM ('disponivel', 'reservada', 'vendida', 'em_reforma');

-- CreateEnum
CREATE TYPE "UsedBodyCondition" AS ENUM ('excelente', 'bom', 'regular', 'ruim');

-- CreateTable
CREATE TABLE "used_bodies" (
    "id" SERIAL NOT NULL,
    "document_id" TEXT,
    "title" TEXT NOT NULL,
    "length_m" DECIMAL(8,2) NOT NULL,
    "width_m" DECIMAL(8,2) NOT NULL,
    "height_m" DECIMAL(8,2),
    "condition" "UsedBodyCondition" NOT NULL,
    "entry_value" DECIMAL(14,2) NOT NULL,
    "sale_value" DECIMAL(14,2),
    "status" "UsedBodyStatus" NOT NULL DEFAULT 'disponivel',
    "observations" TEXT,
    "main_photo_url" TEXT,
    "gallery_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supplier_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "used_bodies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "used_body_status_history" (
    "id" SERIAL NOT NULL,
    "used_body_id" INTEGER NOT NULL,
    "from_status" "UsedBodyStatus",
    "to_status" "UsedBodyStatus" NOT NULL,
    "changed_by_user_id" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "used_body_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "used_bodies_document_id_key" ON "used_bodies"("document_id");

-- CreateIndex
CREATE INDEX "used_bodies_status_idx" ON "used_bodies"("status");

-- CreateIndex
CREATE INDEX "used_body_status_history_used_body_id_idx" ON "used_body_status_history"("used_body_id");

-- AddForeignKey
ALTER TABLE "used_bodies" ADD CONSTRAINT "used_bodies_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_body_status_history" ADD CONSTRAINT "used_body_status_history_used_body_id_fkey" FOREIGN KEY ("used_body_id") REFERENCES "used_bodies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_body_status_history" ADD CONSTRAINT "used_body_status_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
