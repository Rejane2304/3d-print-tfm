/**
 * API Route - Create PayPal Payment
 * POST /api/payments/paypal/create
 * Creates a PayPal order for payment and stores paypalOrderId
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { createPaymentFailedAlert } from '@/lib/alerts/alert-service';
import type { Decimal } from '@prisma/client/runtime/library';

// PayPal API base URLs
// FORZAR modo Sandbox - PayPal en producción es solo para test
const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal OAuth access token
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de PayPal no configuradas');
  }

  // Configuración de depuración disponible en logs del servidor si es necesario

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al obtener token de acceso de PayPal: ${errorText}`);
  }

  const data = await response.json();

  // Token de PayPal obtenido

  return data.access_token;
}

/**
 * Create PayPal order via API
 */
// Build PayPal items from order items (deprecated - VAT now included in prices)

function _buildPayPalItems(items: Array<{ name: string; quantity: number; unitPrice: number }>, vatAmountStr: string) {
  const productItems = items.map((item, index) => ({
    name: item.name.substring(0, 127),
    quantity: item.quantity.toString(),
    unit_amount: {
      currency_code: 'EUR' as const,
      value: item.unitPrice.toFixed(2),
    },
    sku: `ITEM-${index + 1}`,
    category: 'PHYSICAL_GOODS' as const,
  }));

  const vatItem = {
    name: 'IVA (21%)',
    quantity: '1',
    unit_amount: {
      currency_code: 'EUR' as const,
      value: vatAmountStr,
    },
    sku: 'TAX-IVA-21',
    category: 'PHYSICAL_GOODS' as const,
  };

  return [...productItems, vatItem];
}

// Translate PayPal error response
function translatePayPalError(errorData: {
  details?: Array<{ issue: string; field?: string; description?: string }>;
  message?: string;
}): string {
  if (!errorData.details || errorData.details.length === 0) {
    return errorData.message ?? 'Error al crear el pedido de PayPal';
  }

  const detail = errorData.details[0];
  const errorMap: Record<string, string> = {
    ITEM_TOTAL_MISMATCH: 'El total de los items no coincide con el importe del pedido',
    AMOUNT_MISMATCH: 'El importe total no es correcto',
    INVALID_CURRENCY_CODE: 'Moneda no válida',
  };

  if (detail.issue === 'MISSING_REQUIRED_PARAMETER') {
    return `Falta el parámetro requerido: ${detail.field}`;
  }

  return errorMap[detail.issue] ?? detail.description ?? errorData.message ?? 'Error en la validación del pedido';
}

async function createPayPalOrder(
  accessToken: string,
  orderData: {
    orderId: string;
    orderNumber: string;
    total: number;
    shipping: number;
    discount: number;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
    shippingAddress: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
    };
  },
): Promise<{ id: string; links: Array<{ rel: string; href: string }> }> {
  // Calcular totales exactos para PayPal (sin IVA separado para evitar errores de redondeo)
  const itemsTotal = orderData.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = orderData.discount || 0;
  const shipping = orderData.shipping;

  // El total debe coincidir exactamente: items - discount + shipping
  const calculatedTotal = itemsTotal - discount + shipping;

  // Asegurar 2 decimales
  const itemsTotalStr = itemsTotal.toFixed(2);
  const shippingStr = shipping.toFixed(2);
  const totalStr = calculatedTotal.toFixed(2);
  const discountStr = discount.toFixed(2);

  // Items para PayPal (precios sin IVA, el total ya incluye todo)
  const paypalItems = orderData.items.map((item, index) => ({
    name: item.name.substring(0, 127),
    quantity: item.quantity.toString(),
    unit_amount: {
      currency_code: 'EUR' as const,
      value: item.unitPrice.toFixed(2),
    },
    sku: `ITEM-${index + 1}`,
    category: 'PHYSICAL_GOODS' as const,
  }));

  const requestBody = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: orderData.orderId,
        description: `Pedido ${orderData.orderNumber}`,
        amount: {
          currency_code: 'EUR',
          value: totalStr,
          breakdown: {
            item_total: {
              currency_code: 'EUR',
              value: itemsTotalStr,
            },
            shipping: {
              currency_code: 'EUR',
              value: shippingStr,
            },
            discount: {
              currency_code: 'EUR',
              value: discountStr,
            },
          },
        },
        items: paypalItems,
        shipping: {
          name: {
            full_name: orderData.shippingAddress.name,
          },
          address: {
            address_line_1: orderData.shippingAddress.address.substring(0, 100),
            admin_area_2: orderData.shippingAddress.city,
            postal_code: orderData.shippingAddress.postalCode,
            country_code: 'ES',
          },
        },
      },
    ],
    application_context: {
      brand_name: '3D Print TFM',
      landing_page: 'LOGIN',
      shipping_preference: 'SET_PROVIDED_ADDRESS',
      user_action: 'PAY_NOW',
      return_url: `${process.env.NEXTAUTH_URL}/checkout/success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout?orderId=${orderData.orderId}&cancelled=true`,
    },
  };

  // Request de PayPal preparado

  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: await response.text() };
    }

    throw new Error(translatePayPalError(errorData));
  }

  return response.json();
}

// Get order with verification
interface OrderResult {
  success: boolean;
  order?: {
    id: string;
    orderNumber: string;
    total: Decimal;
    shipping: Decimal;
    discount: Decimal | null;
    items: Array<{ name: string; quantity: number; price: Decimal }>;
    shippingName: string | null;
    shippingAddress: string;
    shippingCity: string;
    shippingPostalCode: string;
    shippingCountry: string;
    user: { name: string | null };
  };
  error?: string;
  status?: number;
}

async function getOrderForPayPal(orderId: string, userEmail: string): Promise<OrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
      items: {
        select: {
          name: true,
          quantity: true,
          price: true,
        },
      },
      payment: true,
      shippingAddressData: true,
    },
  });

  if (!order) {
    return { success: false, error: 'Pedido no encontrado', status: 404 };
  }

  if (order.user.email !== userEmail) {
    return { success: false, error: 'No autorizado', status: 403 };
  }

  if (!order.items || order.items.length === 0) {
    return { success: false, error: 'El pedido no tiene items', status: 400 };
  }

  return { success: true, order };
}

// Update payment and order with PayPal order ID
async function updatePaymentWithPayPalOrder(paymentId: string, orderId: string, paypalOrderId: string) {
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      paypalOrderId,
      status: 'PROCESSING',
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { paypalOrderId },
  });
}

// Create alert for failed payment
async function createFailedPaymentAlert(orderId: string, errorMessage: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true },
    });
    if (order) {
      await createPaymentFailedAlert(orderId, order.orderNumber, errorMessage);
    }
  } catch {
    // Alert creation failed - silently continue
  }
}

export async function POST(req: NextRequest) {
  let requestBody: { orderId?: string; paymentId?: string } = {};

  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Get request body (solo se lee UNA VEZ)
    requestBody = await req.json();
    const { orderId, paymentId } = requestBody;

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // 3. Get order data with verification
    const orderResult = await getOrderForPayPal(orderId, session.user.email);
    if (!orderResult.success || !orderResult.order) {
      return NextResponse.json({ error: orderResult.error }, { status: orderResult.status });
    }
    const order = orderResult.order;

    // 4. Get PayPal access token (OAuth)
    const accessToken = await getPayPalAccessToken();

    // 5. Create PayPal order
    const paypalOrder = await createPayPalOrder(accessToken, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      shipping: Number(order.shipping),
      discount: Number(order.discount || 0),
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price),
      })),
      shippingAddress: {
        name: order.shippingName || order.user.name || 'Cliente',
        address: order.shippingAddress,
        city: order.shippingCity,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
    });

    // 6. Update payment with paypalOrderId
    await updatePaymentWithPayPalOrder(paymentId, orderId, paypalOrder.id);

    // 7. Get approval URL from PayPal response
    const approvalLink = paypalOrder.links.find(link => link.rel === 'approve');
    const paypalApprovalUrl = approvalLink?.href;

    if (!paypalApprovalUrl) {
      throw new Error('No se encontró la URL de aprobación en la respuesta de PayPal');
    }

    // 8. Return success with approval URL
    return NextResponse.json({
      success: true,
      url: paypalApprovalUrl,
      paypalOrderId: paypalOrder.id,
    });
  } catch (error) {
    // Create alert for failed payment (usar requestBody guardado, NO volver a leer req.json())
    const { orderId } = requestBody;
    if (orderId) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      await createFailedPaymentAlert(orderId, errorMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
