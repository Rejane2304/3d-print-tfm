/**
 * API Route para Checkout con Stripe
 * 
 * POST /api/checkout - Crear sesión de checkout
 * 
 * Requiere autenticación y carrito con items
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import Stripe from 'stripe';

// Inicializar Stripe (modo test)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

// POST /api/checkout - Crear sesión de checkout
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
  const { shippingAddressId } = body;

  if (!shippingAddressId) {
    return NextResponse.json(
      { success: false, error: 'Dirección de envío requerida' },
      { status: 400 }
    );
  }

  // Buscar usuario con carrito
  const usuario = await prisma.usuario.findUnique({
    where: { email: session.user.email },
    include: {
      carrito: {
        include: {
          items: {
            include: {
              producto: true,
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

  // Verificar que tiene carrito con items
  if (!usuario.carrito || usuario.carrito.items.length === 0) {
    return NextResponse.json(
      { success: false, error: 'El carrito está vacío' },
      { status: 400 }
    );
  }

  // Verificar stock disponible
  for (const item of usuario.carrito.items) {
    if (item.producto.stock < item.cantidad) {
      return NextResponse.json(
        { success: false, error: `Stock insuficiente para ${item.producto.nombre}` },
        { status: 400 }
      );
    }
  }

  // Calcular totales
  const subtotal = Number(usuario.carrito.subtotal);
  const gastosEnvio = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + gastosEnvio;

  try {
    // Crear line items para Stripe
    const lineItems = usuario.carrito.items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.producto.nombre,
          description: `Producto ID: ${item.producto.id}`,
        },
        unit_amount: Math.round(Number(item.precioUnitario) * 100), // Stripe usa céntimos
      },
      quantity: item.cantidad,
    }));

    // Añadir envío si aplica
    if (gastosEnvio > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Envío',
            description: 'Gastos de envío',
          },
          unit_amount: Math.round(gastosEnvio * 100),
        },
        quantity: 1,
      });
    }

    // Crear sesión de Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
      metadata: {
        userId: usuario.id,
        carritoId: usuario.carrito.id,
        shippingAddressId,
      },
    });

    // Obtener dirección de envío
    const direccion = await prisma.direccion.findUnique({
      where: { id: shippingAddressId },
    });

    if (!direccion) {
      return NextResponse.json(
        { success: false, error: 'Dirección de envío no encontrada' },
        { status: 404 }
      );
    }

    // Generar número de pedido
    const year = new Date().getFullYear();
    const count = await prisma.pedido.count();
    const orderNumber = `P-${year}${String(count + 1).padStart(6, '0')}`;

    // Crear pedido en estado PENDIENTE
    const pedido = await prisma.pedido.create({
      data: {
        orderNumber,
        usuarioId: usuario.id,
        estado: 'PENDIENTE',
        subtotal,
        envio: gastosEnvio,
        total,
        shippingAddressId,
        nombreEnvio: direccion.nombre,
        telefonoEnvio: direccion.telefono,
        shippingAddress: direccion.direccion,
        complementoEnvio: direccion.complemento,
        postalCodeEnvio: direccion.postalCode,
        ciudadEnvio: direccion.ciudad,
        provinciaEnvio: direccion.provincia,
        paisEnvio: direccion.pais,
        stripeSessionId: stripeSession.id,
        items: {
          create: usuario.carrito.items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precio: item.precioUnitario,
            subtotal: Number(item.precioUnitario) * item.cantidad,
            nombre: item.producto.nombre,
            precioProducto: item.producto.precio,
            categoria: item.producto.categoria,
            material: item.producto.material,
          })),
        },
      },
    });

    // Vaciar carrito (opcional - lo vaciamos después del pago exitoso)
    // Por ahora dejamos el carrito intacto hasta confirmar el pago

    return NextResponse.json({
      success: true,
      sessionId: stripeSession.id,
      url: stripeSession.url,
      pedidoId: pedido.id,
    });
  } catch (error) {
    console.error('Error creando sesión de Stripe:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear sesión de pago' },
      { status: 500 }
    );
  }
});
