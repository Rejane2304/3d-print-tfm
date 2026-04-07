-- CreateTable
CREATE TABLE "shipping_zones" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "regions" VARCHAR(100)[],
    "postalCodePrefixes" VARCHAR(10)[],
    "baseCost" DECIMAL(10,2) NOT NULL,
    "freeShippingThreshold" DECIMAL(10,2),
    "estimatedDaysMin" INTEGER NOT NULL DEFAULT 3,
    "estimatedDaysMax" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_store" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "room" TEXT NOT NULL,
    "userId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "retries" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "websocket_connections" (
    "id" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "userId" TEXT,
    "rooms" TEXT[],
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPing" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "websocket_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipping_zones_isActive_idx" ON "shipping_zones"("isActive");

-- CreateIndex
CREATE INDEX "shipping_zones_country_idx" ON "shipping_zones"("country");

-- CreateIndex
CREATE INDEX "shipping_zones_displayOrder_idx" ON "shipping_zones"("displayOrder");

-- CreateIndex
CREATE INDEX "event_store_type_timestamp_idx" ON "event_store"("type", "timestamp");

-- CreateIndex
CREATE INDEX "event_store_room_idx" ON "event_store"("room");

-- CreateIndex
CREATE INDEX "event_store_delivered_timestamp_idx" ON "event_store"("delivered", "timestamp");

-- CreateIndex
CREATE INDEX "event_store_expiresAt_idx" ON "event_store"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "websocket_connections_socketId_key" ON "websocket_connections"("socketId");

-- CreateIndex
CREATE INDEX "websocket_connections_userId_idx" ON "websocket_connections"("userId");

-- CreateIndex
CREATE INDEX "websocket_connections_isActive_idx" ON "websocket_connections"("isActive");
