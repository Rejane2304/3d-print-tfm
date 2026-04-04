-- Add PayPal fields to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paypalOrderId" VARCHAR(255) UNIQUE;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paypalCaptureId" VARCHAR(255);

-- Add PayPal fields to payments table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paypalOrderId" VARCHAR(255) UNIQUE;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paypalCaptureId" VARCHAR(255) UNIQUE;