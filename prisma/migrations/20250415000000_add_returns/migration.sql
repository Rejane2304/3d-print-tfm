-- Migration: Add Returns System
-- Created: 2025-04-15

-- Create ReturnStatus enum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- Create Return table
CREATE TABLE "returns" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- Create ReturnItem table
CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "returns_orderId_idx" ON "returns"("orderId");
CREATE INDEX "returns_userId_idx" ON "returns"("userId");
CREATE INDEX "returns_status_idx" ON "returns"("status");
CREATE INDEX "return_items_returnId_idx" ON "return_items"("returnId");
CREATE INDEX "return_items_productId_idx" ON "return_items"("productId");

-- Add foreign key constraints
ALTER TABLE "returns" ADD CONSTRAINT "returns_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "returns" ADD CONSTRAINT "returns_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "return_items" ADD CONSTRAINT "return_items_returnId_fkey" 
    FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "return_items" ADD CONSTRAINT "return_items_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON "returns"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
