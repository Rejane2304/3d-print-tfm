-- AlterTable
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "taxableAmount";

-- AlterIndex
DROP INDEX IF EXISTS "invoices_orderId_key";
CREATE UNIQUE INDEX "invoices_orderId_key" ON "invoices"("orderId");
