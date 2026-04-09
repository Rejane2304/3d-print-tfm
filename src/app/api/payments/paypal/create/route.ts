/**
 * API Route - Create PayPal Payment
 * POST /api/payments/paypal/create
 * Creates a PayPal order for payment and stores paypalOrderId
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage } from '@/lib/i18n';

// PayPal API base URLs
const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal OAuth access token
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de PayPal no configuradas');
  }

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('PayPal token error:', errorData);
    throw new Error('Error al obtener token de acceso de PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayPal order via API
 */
async function createPayPalOrder(
  accessToken: string,
  orderData: {
    orderId: string;
    orderNumber: string;
    total: number;
    shipping: number;
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
  }
): Promise<{ id: string; links: Array<{ rel: string; href: string }> }> {
  // Calcular el total de items
  const itemsTotal = orderData.items.reduce((sum, item) => 
    sum + (item.unitPrice * item.quantity), 0
  );
  
  // El total debe ser exacto: items + shipping
  const calculatedTotal = itemsTotal + orderData.shipping;
  
  // Asegurar que tenemos al menos 2 decimales
  const itemTotalStr = itemsTotal.toFixed(2);
  const shippingStr = orderData.shipping.toFixed(2);
  const totalStr = calculatedTotal.toFixed(2);
  
  const requestBody = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: orderData.orderId,
      description: `Pedido ${orderData.orderNumber}`,
      amount: {
        currency_code: 'EUR',
        value: totalStr,
        breakdown: {
          item_total: {
            currency_code: 'EUR',
            value: itemTotalStr,
          },
          shipping: {
            currency_code: 'EUR',
            value: shippingStr,
          },
        },
      },
      items: orderData.items.map((item, index) => ({
        name: item.name.substring(0, 127),
        quantity: item.quantity.toString(),
        unit_amount: {
          currency_code: 'EUR',
          value: item.unitPrice.toFixed(2),
        },
        sku: `ITEM-${index + 1}`,
        category: 'PHYSICAL_GOODS',
      })),
      shipping: {
        name: {
          full_name: orderData.shippingAddress.name,
        },
        address: {
          address_line_1: orderData.shippingAddress.address.substring(0, 100),
          admin_area_2: orderData.shippingAddress.city,
          postal_code: orderData.shippingAddress.postalCode,
          country_code: orderData.shippingAddress.country === 'Spain' ? 'ES' : 'ES',
        },
      },
    }],
    application_context: {
      brand_name: '3D Print TFM',
      landing_page: 'LOGIN',
      shipping_preference: 'SET_PROVIDED_ADDRESS',
      user_action: 'PAY_NOW',
      return_url: `${process.env.NEXTAUTH_URL}/checkout/success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
    },
  };

  console.log('PayPal request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
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
    
    console.error('PayPal error response:', JSON.stringify(errorData, null, 2));
    
    // Traducir errores comunes de PayPal
    let errorMessage = 'Error al crear el pedido de PayPal';
    
    if (errorData.details && errorData.details.length > 0) {
      const detail = errorData.details[0];
      if (detail.issue === 'ITEM_TOTAL_MISMATCH') {
        errorMessage = 'El total de los items no coincide con el importe del pedido';
      } else if (detail.issue === 'AMOUNT_MISMATCH') {
        errorMessage = 'El importe total no es correcto';
      } else if (detail.issue === 'INVALID_CURRENCY_CODE') {
        errorMessage = 'Moneda no válida';
      } else if (detail.issue === 'MISSING_REQUIRED_PARAMETER') {
        errorMessage = `Falta el parámetro requerido: ${detail.field}`;
      } else {
        errorMessage = detail.description || errorData.message || 'Error en la validación del pedido';
      }
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Get request body
    const body = await req.json();
    const { orderId, paymentId } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // 3. Get order data with verification
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
        address: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Verify order belongs to authenticated user
    if (order.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar que hay items
    if (!order.items || order.items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido no tiene items' },
        { status: 400 }
      );
    }

    // 4. Get PayPal access token (OAuth)
    const accessToken = await getPayPalAccessToken();

    // 5. Create PayPal order
    const paypalOrder = await createPayPalOrder(accessToken, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      shipping: Number(order.shipping),
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
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paypalOrderId: paypalOrder.id,
        status: 'PROCESSING',
      },
    });

    // Also update order with paypalOrderId for reference
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paypalOrderId: paypalOrder.id,
      },
    });

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
    console.error('Error creating PayPal payment:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}