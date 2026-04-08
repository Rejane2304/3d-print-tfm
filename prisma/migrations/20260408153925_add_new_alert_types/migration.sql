-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AlertType" ADD VALUE 'NEW_ORDER';
ALTER TYPE "AlertType" ADD VALUE 'NEGATIVE_REVIEW';
ALTER TYPE "AlertType" ADD VALUE 'HIGH_VALUE_ORDER';
ALTER TYPE "AlertType" ADD VALUE 'NEW_USER';
ALTER TYPE "AlertType" ADD VALUE 'COUPON_EXPIRING';
