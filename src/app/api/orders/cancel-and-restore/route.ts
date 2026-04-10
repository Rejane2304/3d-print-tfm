/**
 * API Route - Cancel Order and Restore Stock
 * POST /api/orders/cancel-and-restore
 * Cancela un pedido pendiente y restaura el stock reservado
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { createOrderCancelledAlert } from "@/lib/alerts/alert-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID requerido" },
        { status: 400 },
      );
    }

    // Buscar el pedido
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        status: "PENDING",
        user: { email: session.user.email },
      },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado o ya procesado" },
        { status: 404 },
      );
    }

    // Get user for inventory movement
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Ejecutar en transacción: restaurar stock + cancelar pedido + movimientos
    await prisma.$transaction(async (tx) => {
      // 1. Restaurar stock de cada producto Y registrar movimiento
      for (const item of order.items) {
        if (!item.productId) continue;

        const product = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        // Registrar movimiento de inventario IN (devolución)
        await tx.inventoryMovement.create({
          data: {
            id: crypto.randomUUID(),
            productId: item.productId,
            orderId: orderId,
            createdBy: user.id,
            type: "IN",
            quantity: item.quantity,
            previousStock: product.stock - item.quantity, // antes del incremento
            newStock: product.stock,
            reason: `Cancelación de pedido - ${order.orderNumber}`,
            reference: orderId,
          },
        });
      }

      // 2. Cancelar el pedido
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: "Payment cancelled by user",
        },
      });

      // 3. Cancelar el pago asociado si existe
      await tx.payment.updateMany({
        where: { orderId: orderId },
        data: {
          status: "FAILED",
        },
      });
    });

    // Create alert for cancelled order
    try {
      const orderNumber = order.orderNumber || `N/A-${orderId.slice(0, 8)}`;
      await createOrderCancelledAlert(orderId, orderNumber);
    } catch (alertError) {
      console.error("Error creating order cancelled alert:", alertError);
    }

    return NextResponse.json({
      success: true,
      message: "Pedido cancelado y stock restaurado correctamente",
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Error al cancelar el pedido" },
      { status: 500 },
    );
  }
}
