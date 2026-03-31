-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CLIENTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('DECORACION', 'ACCESORIOS', 'FUNCIONAL', 'ARTICULADOS', 'JUGUETES');

-- CreateEnum
CREATE TYPE "Material" AS ENUM ('PLA', 'PETG', 'ABS', 'TPU');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TARJETA', 'BIZUM', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO', 'PARCIAL');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'CANCELACION', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('STOCK_BAJO', 'SIN_STOCK', 'PEDIDO_RETRASADO', 'PAGO_FALLIDO', 'ERROR_SISTEMA');

-- CreateEnum
CREATE TYPE "SeveridadAlerta" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'RESUELTA', 'IGNORADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "nif" VARCHAR(20),
    "nombreFiscal" VARCHAR(200),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "emailVerificado" TIMESTAMP(3),
    "ultimoAcceso" TIMESTAMP(3),
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direcciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "destinatario" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "direccion" VARCHAR(255) NOT NULL,
    "complemento" VARCHAR(100),
    "codigoPostal" VARCHAR(10) NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "provincia" VARCHAR(100) NOT NULL,
    "pais" VARCHAR(50) NOT NULL DEFAULT 'España',
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "descripcionCorta" VARCHAR(255),
    "precio" DECIMAL(10,2) NOT NULL,
    "precioAnterior" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 5,
    "categoria" "Categoria" NOT NULL,
    "material" "Material" NOT NULL,
    "dimensiones" VARCHAR(50),
    "peso" DECIMAL(8,2),
    "tiempoImpresion" INTEGER,
    "metaTitulo" VARCHAR(200),
    "metaDescripcion" VARCHAR(300),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes_producto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "nombreArchivo" VARCHAR(255) NOT NULL,
    "tamano" INTEGER,
    "mimeType" VARCHAR(50),
    "textoAlt" VARCHAR(255) NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "urlSmall" VARCHAR(500),
    "urlMedium" VARCHAR(500),
    "urlLarge" VARCHAR(500),
    "subidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagenes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "numeroPedido" VARCHAR(20) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "envio" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2),
    "total" DECIMAL(10,2) NOT NULL,
    "direccionEnvioId" TEXT,
    "nombreEnvio" VARCHAR(100) NOT NULL,
    "telefonoEnvio" VARCHAR(20) NOT NULL,
    "direccionEnvio" VARCHAR(255) NOT NULL,
    "complementoEnvio" VARCHAR(100),
    "codigoPostalEnvio" VARCHAR(10) NOT NULL,
    "ciudadEnvio" VARCHAR(100) NOT NULL,
    "provinciaEnvio" VARCHAR(100) NOT NULL,
    "paisEnvio" VARCHAR(50) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'TARJETA',
    "notasCliente" TEXT,
    "notasInternas" TEXT,
    "fechaEnvio" TIMESTAMP(3),
    "numeroSeguimiento" VARCHAR(100),
    "transportista" VARCHAR(100),
    "fechaEntrega" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "confirmadoEn" TIMESTAMP(3),
    "preparandoEn" TIMESTAMP(3),
    "enviadoEn" TIMESTAMP(3),
    "entregadoEn" TIMESTAMP(3),
    "canceladoEn" TIMESTAMP(3),
    "canceladoPor" TEXT,
    "motivoCancelacion" TEXT,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "material" "Material" NOT NULL,
    "imagenUrl" VARCHAR(500),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "montoReembolsado" DECIMAL(10,2),
    "metodo" "MetodoPago" NOT NULL DEFAULT 'TARJETA',
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "stripePaymentIntentId" VARCHAR(255),
    "stripeClientSecret" VARCHAR(255),
    "stripeChargeId" VARCHAR(255),
    "errorMensaje" TEXT,
    "fechaProcesado" TIMESTAMP(3),
    "fechaReembolso" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stockAnterior" INTEGER NOT NULL,
    "stockNuevo" INTEGER NOT NULL,
    "motivo" VARCHAR(255) NOT NULL,
    "referencia" VARCHAR(100),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT NOT NULL,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "severidad" "SeveridadAlerta" NOT NULL DEFAULT 'MEDIA',
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "productoId" TEXT,
    "pedidoId" TEXT,
    "usuarioId" TEXT,
    "estado" "EstadoAlerta" NOT NULL DEFAULT 'PENDIENTE',
    "resueltaEn" TIMESTAMP(3),
    "resueltaPor" TEXT,
    "notasResolucion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "esDeCliente" BOOLEAN NOT NULL DEFAULT true,
    "adjuntos" JSONB,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "leidoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "numeroFactura" VARCHAR(50) NOT NULL,
    "serie" VARCHAR(10) NOT NULL DEFAULT 'F',
    "numero" INTEGER NOT NULL,
    "empresaNombre" VARCHAR(200) NOT NULL,
    "empresaNif" VARCHAR(20) NOT NULL,
    "empresaDireccion" VARCHAR(255) NOT NULL,
    "empresaCiudad" VARCHAR(100) NOT NULL,
    "empresaProvincia" VARCHAR(100) NOT NULL,
    "empresaCodigoPostal" VARCHAR(10) NOT NULL,
    "clienteNombre" VARCHAR(200) NOT NULL,
    "clienteNif" VARCHAR(20) NOT NULL,
    "clienteDireccion" VARCHAR(255) NOT NULL,
    "clienteCiudad" VARCHAR(100) NOT NULL,
    "clienteProvincia" VARCHAR(100) NOT NULL,
    "clienteCodigoPostal" VARCHAR(10) NOT NULL,
    "clientePais" VARCHAR(50) NOT NULL,
    "baseImponible" DECIMAL(10,2) NOT NULL,
    "tipoIva" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "cuotaIva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "pdfUrl" VARCHAR(500),
    "anulada" BOOLEAN NOT NULL DEFAULT false,
    "anuladaEn" TIMESTAMP(3),
    "motivoAnulacion" TEXT,
    "emitidaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_envios" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "envioGratisDesde" DECIMAL(10,2),
    "diasMinimos" INTEGER NOT NULL DEFAULT 3,
    "diasMaximos" INTEGER NOT NULL DEFAULT 5,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "esDefecto" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_envios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" TEXT NOT NULL,
    "nombreEmpresa" VARCHAR(200) NOT NULL,
    "nifEmpresa" VARCHAR(20) NOT NULL,
    "direccionEmpresa" VARCHAR(255) NOT NULL,
    "ciudadEmpresa" VARCHAR(100) NOT NULL,
    "provinciaEmpresa" VARCHAR(100) NOT NULL,
    "codigoPostalEmpresa" VARCHAR(10) NOT NULL,
    "telefonoEmpresa" VARCHAR(20) NOT NULL,
    "emailEmpresa" VARCHAR(255) NOT NULL,
    "tipoIvaDefecto" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "umbralStockBajo" INTEGER NOT NULL DEFAULT 5,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "actualizadoPor" TEXT,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_verificacion" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "accion" VARCHAR(100) NOT NULL,
    "entidad" VARCHAR(50) NOT NULL,
    "entidadId" VARCHAR(255) NOT NULL,
    "datosAnteriores" JSONB,
    "datosNuevos" JSONB,
    "usuarioId" TEXT,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "usuarios_activo_idx" ON "usuarios"("activo");

-- CreateIndex
CREATE INDEX "usuarios_creadoEn_idx" ON "usuarios"("creadoEn");

-- CreateIndex
CREATE INDEX "direcciones_usuarioId_idx" ON "direcciones"("usuarioId");

-- CreateIndex
CREATE INDEX "direcciones_esPrincipal_idx" ON "direcciones"("esPrincipal");

-- CreateIndex
CREATE UNIQUE INDEX "productos_slug_key" ON "productos"("slug");

-- CreateIndex
CREATE INDEX "productos_categoria_idx" ON "productos"("categoria");

-- CreateIndex
CREATE INDEX "productos_activo_idx" ON "productos"("activo");

-- CreateIndex
CREATE INDEX "productos_destacado_idx" ON "productos"("destacado");

-- CreateIndex
CREATE INDEX "productos_stock_idx" ON "productos"("stock");

-- CreateIndex
CREATE INDEX "productos_precio_idx" ON "productos"("precio");

-- CreateIndex
CREATE INDEX "productos_creadoEn_idx" ON "productos"("creadoEn");

-- CreateIndex
CREATE INDEX "imagenes_producto_productoId_idx" ON "imagenes_producto"("productoId");

-- CreateIndex
CREATE INDEX "imagenes_producto_esPrincipal_idx" ON "imagenes_producto"("esPrincipal");

-- CreateIndex
CREATE UNIQUE INDEX "imagenes_producto_productoId_orden_key" ON "imagenes_producto"("productoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numeroPedido_key" ON "pedidos"("numeroPedido");

-- CreateIndex
CREATE INDEX "pedidos_usuarioId_idx" ON "pedidos"("usuarioId");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE INDEX "pedidos_creadoEn_idx" ON "pedidos"("creadoEn");

-- CreateIndex
CREATE INDEX "pedidos_numeroPedido_idx" ON "pedidos"("numeroPedido");

-- CreateIndex
CREATE INDEX "items_pedido_pedidoId_idx" ON "items_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "items_pedido_productoId_idx" ON "items_pedido"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_pedidoId_key" ON "pagos"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_stripePaymentIntentId_key" ON "pagos"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "pagos_usuarioId_idx" ON "pagos"("usuarioId");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE INDEX "pagos_creadoEn_idx" ON "pagos"("creadoEn");

-- CreateIndex
CREATE INDEX "movimientos_inventario_productoId_idx" ON "movimientos_inventario"("productoId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_pedidoId_idx" ON "movimientos_inventario"("pedidoId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tipo_idx" ON "movimientos_inventario"("tipo");

-- CreateIndex
CREATE INDEX "movimientos_inventario_creadoEn_idx" ON "movimientos_inventario"("creadoEn");

-- CreateIndex
CREATE INDEX "alertas_tipo_idx" ON "alertas"("tipo");

-- CreateIndex
CREATE INDEX "alertas_estado_idx" ON "alertas"("estado");

-- CreateIndex
CREATE INDEX "alertas_severidad_idx" ON "alertas"("severidad");

-- CreateIndex
CREATE INDEX "alertas_productoId_idx" ON "alertas"("productoId");

-- CreateIndex
CREATE INDEX "alertas_creadoEn_idx" ON "alertas"("creadoEn");

-- CreateIndex
CREATE INDEX "mensajes_pedido_pedidoId_idx" ON "mensajes_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "mensajes_pedido_creadoEn_idx" ON "mensajes_pedido"("creadoEn");

-- CreateIndex
CREATE INDEX "mensajes_pedido_esDeCliente_idx" ON "mensajes_pedido"("esDeCliente");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_pedidoId_key" ON "facturas"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numeroFactura_key" ON "facturas"("numeroFactura");

-- CreateIndex
CREATE INDEX "facturas_numeroFactura_idx" ON "facturas"("numeroFactura");

-- CreateIndex
CREATE INDEX "facturas_clienteNif_idx" ON "facturas"("clienteNif");

-- CreateIndex
CREATE INDEX "facturas_emitidaEn_idx" ON "facturas"("emitidaEn");

-- CreateIndex
CREATE INDEX "configuracion_envios_activo_idx" ON "configuracion_envios"("activo");

-- CreateIndex
CREATE INDEX "configuracion_envios_esDefecto_idx" ON "configuracion_envios"("esDefecto");

-- CreateIndex
CREATE INDEX "configuracion_envios_orden_idx" ON "configuracion_envios"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_sessionToken_key" ON "sesiones"("sessionToken");

-- CreateIndex
CREATE INDEX "sesiones_userId_idx" ON "sesiones"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_verificacion_token_key" ON "tokens_verificacion"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_verificacion_identifier_token_key" ON "tokens_verificacion"("identifier", "token");

-- CreateIndex
CREATE INDEX "logs_auditoria_accion_idx" ON "logs_auditoria"("accion");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidad_idx" ON "logs_auditoria"("entidad");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidadId_idx" ON "logs_auditoria"("entidadId");

-- CreateIndex
CREATE INDEX "logs_auditoria_creadoEn_idx" ON "logs_auditoria"("creadoEn");

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_producto" ADD CONSTRAINT "imagenes_producto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_direccionEnvioId_fkey" FOREIGN KEY ("direccionEnvioId") REFERENCES "direcciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_resueltaPor_fkey" FOREIGN KEY ("resueltaPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_pedido" ADD CONSTRAINT "mensajes_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_pedido" ADD CONSTRAINT "mensajes_pedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
