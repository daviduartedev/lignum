-- ErpSetting.quotePricingJson (orçamentos paramétricos — cycle 0713)
ALTER TABLE "erp_settings" ADD COLUMN IF NOT EXISTS "quote_pricing_json" JSONB NOT NULL DEFAULT '{}';
