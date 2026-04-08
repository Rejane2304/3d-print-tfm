-- AlterTable
ALTER TABLE "alerts" ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "reviewId" TEXT;

-- CreateIndex
CREATE INDEX "alerts_orderId_idx" ON "alerts"("orderId");

-- CreateIndex
CREATE INDEX "alerts_reviewId_idx" ON "alerts"("reviewId");

-- CreateIndex
CREATE INDEX "alerts_userId_idx" ON "alerts"("userId");

-- CreateIndex
CREATE INDEX "alerts_couponId_idx" ON "alerts"("couponId");
