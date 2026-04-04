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
import { authOptions } from '@/lib/auth/auth-options';

// GET /api/cart - Get user's cart
export const GET = withErrorHandler(async (req: NextRequest) => {
  // Verify authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Buscar usuario y su carrito
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      cart: {
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isMain: true },
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

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Usuario not found' },
      { status: 404 }
    );
  }

  // If no cart, return empty structure
  if (!user.cart) {
    return NextResponse.json({
      success: true,
      cart: {
        id: null,
        items: [],
        subtotal: 0,
        totalItems: 0,
      },
    });
  }

  // Calcular totales
  const cart = user.cart;
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  return NextResponse.json({
    success: true,
    cart: {
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: Number(item.product.price),
          stock: item.product.stock,
          image: item.product.images[0]?.url || null,
        },
      })),
      subtotal,
      totalItems,
    },
  });
});

// POST /api/cart - Add product to cart
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
  const { productId, quantity = 1 } = body;

  // Validaciones
  if (!productId) {
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
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { cart: true },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Usuario not found' },
      { status: 404 }
    );
  }

  // Buscar producto
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return NextResponse.json(
      { success: false, error: 'Producto not found' },
      { status: 404 }
    );
  }

  if (!product.isActive) {
    return NextResponse.json(
      { success: false, error: 'Producto no disponible' },
      { status: 400 }
    );
  }

  if (product.stock < quantity) {
    return NextResponse.json(
      { success: false, error: 'Insufficient stock' },
      { status: 400 }
    );
  }

  // Crear carrito si no existe
  let cart = user.cart;
  cart ??= await prisma.cart.create({
    data: {
      userId: user.id,
      subtotal: 0,
    },
  });

  // Check if product is already in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: product.id,
    },
  });

  if (existingItem) {
    // Actualizar cantidad
    const newQuantity = existingItem.quantity + quantity;
    
    if (product.stock < newQuantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock para la cantidad total' },
        { status: 400 }
      );
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    // Crear nuevo item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: quantity,
        unitPrice: product.price,
      },
    });
  }

  // Recalcular subtotal del carrito
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: true },
  });

  const newSubtotal = items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  await prisma.cart.update({
    where: { id: cart.id },
    data: { subtotal: newSubtotal },
  });

  return NextResponse.json({
    success: true,
    message: 'Producto añadido al carrito',
  }, { status: 201 });
});
