/**
 * API Route para el carrito de compras
 * 
 * GET /api/cart - Obtener carrito del usuario autenticado
 * POST /api/cart - Añadir producto al carrito
 * 
 * Requiere autenticación (session token)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/cart - Ver carrito del usuario
export const GET = withErrorHandler(async (req: NextRequest) => {
  // Verificar autenticación
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Buscar usuario y su carrito
  const usuario = await prisma.usuario.findUnique({
    where: { email: session.user.email },
    include: {
      carrito: {
        include: {
          items: {
            include: {
              producto: {
                include: {
                  imagenes: {
                    where: { esPrincipal: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!usuario) {
    return NextResponse.json(
      { success: false, error: 'Usuario no encontrado' },
      { status: 404 }
    );
  }

  // Si no tiene carrito, devolver estructura vacía
  if (!usuario.carrito) {
    return NextResponse.json({
      success: true,
      carrito: {
        id: null,
        items: [],
        subtotal: 0,
        totalItems: 0,
      },
    });
  }

  // Calcular totales
  const carrito = usuario.carrito;
  const totalItems = carrito.items.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotal = carrito.items.reduce(
    (sum, item) => sum + Number(item.precioUnitario) * item.cantidad,
    0
  );

  return NextResponse.json({
    success: true,
    carrito: {
      id: carrito.id,
      items: carrito.items.map((item) => ({
        id: item.id,
        productoId: item.productoId,
        quantity: item.cantidad,
        unitPrice: Number(item.precioUnitario),
        producto: {
          id: item.producto.id,
          nombre: item.producto.nombre,
          slug: item.producto.slug,
          price: Number(item.producto.precio),
          stock: item.producto.stock,
          imagen: item.producto.imagenes[0]?.url || null,
        },
      })),
      subtotal,
      totalItems,
    },
  });
});

// POST /api/cart - Añadir producto al carrito
export const POST = withErrorHandler(async (req: NextRequest) => {
  // Verificar autenticación
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Obtener datos del body
  const body = await req.json();
  const { productoId, quantity = 1 } = body;

  // Validaciones
  if (!productoId) {
    return NextResponse.json(
      { success: false, error: 'Producto requerido' },
      { status: 400 }
    );
  }

  if (quantity <= 0) {
    return NextResponse.json(
      { success: false, error: 'Cantidad debe ser mayor a 0' },
      { status: 400 }
    );
  }

  // Buscar usuario
  const usuario = await prisma.usuario.findUnique({
    where: { email: session.user.email },
    include: { carrito: true },
  });

  if (!usuario) {
    return NextResponse.json(
      { success: false, error: 'Usuario no encontrado' },
      { status: 404 }
    );
  }

  // Buscar producto
  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
  });

  if (!producto) {
    return NextResponse.json(
      { success: false, error: 'Producto no encontrado' },
      { status: 404 }
    );
  }

  if (!producto.activo) {
    return NextResponse.json(
      { success: false, error: 'Producto no disponible' },
      { status: 400 }
    );
  }

  if (producto.stock < quantity) {
    return NextResponse.json(
      { success: false, error: 'Stock insuficiente' },
      { status: 400 }
    );
  }

  // Crear carrito si no existe
  let carrito = usuario.carrito;
  if (!carrito) {
    carrito = await prisma.carrito.create({
      data: {
        usuarioId: usuario.id,
        subtotal: 0,
      },
    });
  }

  // Verificar si el producto ya está en el carrito
  const itemExistente = await prisma.itemCarrito.findFirst({
    where: {
      carritoId: carrito.id,
      productoId: producto.id,
    },
  });

  if (itemExistente) {
    // Actualizar cantidad
    const nuevaCantidad = itemExistente.cantidad + quantity;
    
    if (producto.stock < nuevaCantidad) {
      return NextResponse.json(
        { success: false, error: 'Stock insuficiente para la cantidad total' },
        { status: 400 }
      );
    }

    await prisma.itemCarrito.update({
      where: { id: itemExistente.id },
      data: { cantidad: nuevaCantidad },
    });
  } else {
    // Crear nuevo item
    await prisma.itemCarrito.create({
      data: {
        carritoId: carrito.id,
        productoId: producto.id,
        cantidad: quantity,
        precioUnitario: producto.precio,
      },
    });
  }

  // Recalcular subtotal del carrito
  const items = await prisma.itemCarrito.findMany({
    where: { carritoId: carrito.id },
    include: { producto: true },
  });

  const nuevoSubtotal = items.reduce(
    (sum, item) => sum + Number(item.precioUnitario) * item.cantidad,
    0
  );

  await prisma.carrito.update({
    where: { id: carrito.id },
    data: { subtotal: nuevoSubtotal },
  });

  return NextResponse.json({
    success: true,
    message: 'Producto añadido al carrito',
  }, { status: 201 });
});
