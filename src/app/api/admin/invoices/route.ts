/**
 * API de Facturación Admin
 * Gestión de facturas para administradores
 *
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { COMPANY_CONFIG } from '@/lib/invoices/pdf-generator';

// Schema de validación
const crearFacturaSchema = z.object({
  orderId: z.string().uuid(),
});

// GET - Listar facturas
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get('busqueda') || '';
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const anulada = searchParams.get('anulada');
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    if (busqueda) {
      where.invoiceNumber = { contains: busqueda, mode: 'insensitive' };
    }

    if (desde || hasta) {
      where.issuedAt = {};
      if (desde) where.issuedAt.gte = new Date(desde);
      if (hasta) where.issuedAt.lte = new Date(hasta);
    }

    if (anulada !== null) {
      where.isCancelled = anulada === 'true';
    }

    const [facturas, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  taxId: true,
                },
              },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    const facturasTraducidas = facturas.map(factura => ({
      id: factura.id,
      invoiceNumber: factura.invoiceNumber,
      anulada: factura.isCancelled,
      emitidaEn: factura.issuedAt?.toISOString(),
      total: factura.total,
      pedido: {
        orderNumber: factura.order?.orderNumber,
        usuario: {
          nombre: factura.order?.user?.name,
          nif: factura.order?.user?.taxId,
        }
      }
    }));

    return NextResponse.json({ 
      success: true, 
      facturas: facturasTraducidas,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error listando facturas:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

// POST - Crear factura
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderId } = crearFacturaSchema.parse(body);

    // Verificar que el pedido existe
    const pedido = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido not found' },
        { status: 404 }
      );
    }

    // Verificar que el pedido está entregado
    if (pedido.status !== 'DELIVERED') {
      return NextResponse.json(
        { success: false, error: 'El pedido debe estar entregado para generar factura' },
        { status: 400 }
      );
    }

    // Verificar que no existe ya una factura
    const facturaExistente = await prisma.invoice.findFirst({
      where: { orderId },
    });

    if (facturaExistente) {
      return NextResponse.json(
        { success: false, error: 'Already exists una factura para este pedido' },
        { status: 400 }
      );
    }

    // Generar número de factura: F-AAAA-NNNNNN
    const year = new Date().getFullYear();
    const ultimaFactura = await prisma.invoice.findFirst({
      where: {
        series: 'F',
      },
      orderBy: { number: 'desc' },
    });

    const numero = ultimaFactura ? ultimaFactura.number + 1 : 1;
    const invoiceNumber = `F-${year}-${String(numero).padStart(6, '0')}`;

    // Calcular totales (IVA 21%)
    const taxableAmount = Number(pedido.subtotal) + Number(pedido.shipping);
    const vatRate = 21;
    const vatAmount = (taxableAmount * vatRate) / 100;
    const total = taxableAmount + vatAmount;

    // Crear factura
    const factura = await prisma.invoice.create({
      data: {
        invoiceNumber,
        series: 'F',
        number: numero,
        orderId,
        // Datos empresa
        companyName: COMPANY_CONFIG.name,
        companyTaxId: COMPANY_CONFIG.taxId,
        companyAddress: COMPANY_CONFIG.address,
        companyCity: COMPANY_CONFIG.city,
        companyProvince: COMPANY_CONFIG.province,
        companyPostalCode: COMPANY_CONFIG.postalCode,
        // Datos cliente
        clientName: pedido.shippingName,
        clientTaxId: pedido.user.taxId || '',
        clientAddress: pedido.shippingAddress,
        clientCity: pedido.shippingCity,
        clientProvince: pedido.shippingProvince,
        clientPostalCode: pedido.shippingPostalCode,
        clientCountry: pedido.shippingCountry,
        // Totales
        subtotal: Number(pedido.subtotal),
        shipping: Number(pedido.shipping),
        taxableAmount,
        vatRate,
        vatAmount,
        total,
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                taxId: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, factura },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creando factura:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}