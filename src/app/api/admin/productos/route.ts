/**
 * API de Productos Admin
 * CRUD de productos para administradores
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';

// Schema de validación
const productoSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string(),
  descripcionCorta: z.string().optional(),
  precio: z.number().positive(),
  precioAnterior: z.number().optional(),
  stock: z.number().int().min(0),
  categoria: z.enum(['DECORACION', 'ACCESORIOS', 'FUNCIONAL', 'ARTICULADOS', 'JUGUETES']),
  material: z.enum(['PLA', 'PETG']),
  dimensiones: z.string().optional(),
  peso: z.number().optional(),
  tiempoImpresion: z.number().optional(),
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
});

// GET - Listar productos
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

    const productos = await prisma.producto.findMany({
      include: {
        imagenes: {
          where: { esPrincipal: true },
          take: 1,
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    return NextResponse.json({ success: true, productos });
  } catch (error) {
    console.error('Error listando productos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// POST - Crear producto
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
    const data = productoSchema.parse(body);

    // Generar slug
    const slug = data.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const producto = await prisma.producto.create({
      data: {
        ...data,
        slug,
        creadoPor: usuario.id,
      },
    });

    return NextResponse.json(
      { success: true, producto },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creando producto:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
