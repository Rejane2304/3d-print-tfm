-- Migration: Add dimension fields (widthCm, heightCm, depthCm) and remove old dimensions string field
-- Created: 2026-04-05

-- Add new dimension fields
ALTER TABLE "products" ADD COLUMN "widthCm" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN "heightCm" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN "depthCm" DOUBLE PRECISION;

-- Migrate data from old dimensions column to new fields
-- Extract dimensions in format "width x height x depth" or "width x depth x height"
UPDATE "products" SET 
    "widthCm" = CAST(SPLIT_PART("dimensions", 'x', 1) AS FLOAT),
    "heightCm" = CAST(SPLIT_PART("dimensions", 'x', 2) AS FLOAT),
    "depthCm" = CAST(SPLIT_PART("dimensions", 'x', 3) AS FLOAT)
WHERE "dimensions" IS NOT NULL AND "dimensions" LIKE '%x%x%';

-- Drop old dimensions column
ALTER TABLE "products" DROP COLUMN "dimensions";
