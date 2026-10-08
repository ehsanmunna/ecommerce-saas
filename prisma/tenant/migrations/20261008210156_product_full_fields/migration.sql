-- AlterTable: add new columns
ALTER TABLE "products" ADD COLUMN "sku" TEXT;
ALTER TABLE "products" ADD COLUMN "short_description" TEXT;
ALTER TABLE "products" ADD COLUMN "regular_price" DECIMAL(10,2);
ALTER TABLE "products" ADD COLUMN "sale_price" DECIMAL(10,2);
ALTER TABLE "products" ADD COLUMN "stock_quantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "main_image" TEXT;
ALTER TABLE "products" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

-- Backfill
UPDATE "products" SET "regular_price" = "price";
UPDATE "products" SET "status" = CASE WHEN "is_active" THEN 'active' ELSE 'draft' END;
UPDATE "products" SET "sku" = 'SKU-' || "id" WHERE "sku" IS NULL;

-- Enforce NOT NULL / defaults
ALTER TABLE "products" ALTER COLUMN "regular_price" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "sku" SET NOT NULL;

-- Drop old columns
ALTER TABLE "products" DROP COLUMN "price";
ALTER TABLE "products" DROP COLUMN "is_active";

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
