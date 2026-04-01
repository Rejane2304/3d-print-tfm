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

// Datos de la empresa (fijos para el TFM)
const DATOS_EMPRESA = {
  nombre: '3D Print TFM S.L.',
  nif: 'B12345678',
  direccion: 'Calle Impresión 3D, 123',
  ciudad: 'Madrid',
  provincia: 'Madrid',
  postalCode: '28001',
};

// Schema de validación
const crearFacturaSchema = z.object({
  pedidoId: z.string().uuid(),
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

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get('busqueda') || '';
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (busqueda) {
      where.invoiceNumber = { contains: busqueda, mode: 'insensitive' };
    }
    
    if (desde || hasta) {
      where.emitidaEn = {};
      if (desde) where.emitidaEn.gte = new Date(desde);
      if (hasta) where.emitidaEn.lte = new Date(hasta);
    }

    const [facturas, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: {
          pedido: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                  nif: true,
                },
              },
            },
          },
        },
        orderBy: { emitidaEn: 'desc' },
        skip,
        take: limit,
      }),
      prisma.factura.count({ where }),
    ]);

    return NextResponse.json({ 
      success: true, 
      facturas,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error listando facturas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
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

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { pedidoId } = crearFacturaSchema.parse(body);

    // Verificar que el pedido existe
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        usuario: true,
        items: true,
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el pedido está entregado
    if (pedido.estado !== 'ENTREGADO') {
      return NextResponse.json(
        { success: false, error: 'El pedido debe estar entregado para generar factura' },
        { status: 400 }
      );
    }

    // Verificar que no existe ya una factura
    const facturaExistente = await prisma.factura.findFirst({
      where: { pedidoId },
    });

    if (facturaExistente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una factura para este pedido' },
        { status: 400 }
      );
    }

    // Generar número de factura: F-AAAA-NNNNNN
    const year = new Date().getFullYear();
    const ultimaFactura = await prisma.factura.findFirst({
      where: {
        serie: 'F',
      },
      orderBy: { numero: 'desc' },
    });

    const numero = ultimaFactura ? ultimaFactura.numero + 1 : 1;
    const invoiceNumber = `F-${year}-${String(numero).padStart(6, '0')}`;

    // Calcular totales (IVA 21%)
    const baseImponible = Number(pedido.subtotal) + Number(pedido.envio);
    const tipoIva = 21;
    const cuotaIva = (baseImponible * tipoIva) / 100;
    const total = baseImponible + cuotaIva;

    // Crear factura
    const factura = await prisma.factura.create({
      data: {
        invoiceNumber,
        serie: 'F',
        numero,
        pedidoId,
        // Datos empresa
        empresaNombre: DATOS_EMPRESA.nombre,
        empresaNif: DATOS_EMPRESA.nif,
        empresaDireccion: DATOS_EMPRESA.direccion,
        empresaCiudad: DATOS_EMPRESA.ciudad,
        empresaProvincia: DATOS_EMPRESA.provincia,
        empresaCodigoPostal: DATOS_EMPRESA.postalCode,
        // Datos cliente
        clienteNombre: pedido.nombreEnvio,
        clienteNif: pedido.usuario.nif || '',
        clienteDireccion: pedido.shippingAddress,
        clienteCiudad: pedido.ciudadEnvio,
        clienteProvincia: pedido.provinciaEnvio,
        clienteCodigoPostal: pedido.postalCodeEnvio,
        clientePais: pedido.paisEnvio,
        // Totales
        baseImponible,
        tipoIva,
        cuotaIva,
        total,
      },
      include: {
        pedido: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                nif: true,
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
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}