/**
 * Admin Alerts API
 * System alerts management
 *
 * Requires: ADMIN role
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";
import { Prisma, AlertType, AlertSeverity, AlertStatus } from "@prisma/client";
import {
  translateAlertType,
  translateAlertSeverity,
  translateAlertStatus,
  translateErrorMessage,
  translateProductName,
} from "@/lib/i18n";
import { runAllScheduledChecks } from "@/lib/alerts/scheduled-checks";

// Validation schema
const actualizarAlertaSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "IGNORED"]),
  resolutionNotes: z.string().optional(),
});

// GET - List alerts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 },
      );
    }

    // Ejecutar verificaciones programadas al cargar el panel
    await runAllScheduledChecks();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const where: Prisma.AlertWhereInput = {};

    if (type) {
      where.type = type as AlertType;
    }

    if (severity) {
      where.severity = severity as AlertSeverity;
    }

    if (status) {
      where.status = status as AlertStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [alertas, total, pendientes, critica, alta] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              stock: true,
              minStock: true,
              images: {
                where: { isMain: true },
                select: { url: true },
                take: 1,
              },
            },
          },
          resolvedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.alert.count({ where }),
      prisma.alert.count({ where: { status: "PENDING" } }),
      prisma.alert.count({
        where: { status: "PENDING", severity: "CRITICAL" },
      }),
      prisma.alert.count({ where: { status: "PENDING", severity: "HIGH" } }),
    ]);

    // Translate only for UI, keep original values
    const translatedAlertas = alertas.map((alerta) => {
      // Traducir nombre del producto si existe
      const productNameTranslated = alerta.product
        ? translateProductName(alerta.product.slug)
        : null;

      // Reconstruir título y mensaje con nombre traducido
      const titleTranslated = productNameTranslated
        ? alerta.title.replace(alerta.product!.name, productNameTranslated)
        : alerta.title;
      const messageTranslated = productNameTranslated
        ? alerta.message.replace(alerta.product!.name, productNameTranslated)
        : alerta.message;

      return {
        id: alerta.id,
        type: alerta.type,
        typeTranslated: translateAlertType(alerta.type),
        severity: alerta.severity,
        severityTranslated: translateAlertSeverity(alerta.severity),
        status: alerta.status,
        statusTranslated: translateAlertStatus(alerta.status),
        title: titleTranslated,
        message: messageTranslated,
        createdAt: alerta.createdAt,
        resolvedAt: alerta.resolvedAt,
        resolutionNotes: alerta.resolutionNotes,
        product: alerta.product
          ? {
              id: alerta.product.id,
              name: productNameTranslated || alerta.product.name,
              slug: alerta.product.slug,
              stock: alerta.product.stock,
              minStock: alerta.product.minStock,
              image: alerta.product.images[0]?.url || null,
            }
          : null,
        resolvedByUser: alerta.resolvedByUser,
      };
    });

    return NextResponse.json({
      success: true,
      alertas: translatedAlertas,
      total,
      pendientes,
      critica,
      alta,
      pages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error("Error listing alerts:", error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage("Internal error") },
      { status: 500 },
    );
  }
}

// PATCH - Update alert status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validatedData = actualizarAlertaSchema.parse(body);

    const updateData: Prisma.AlertUncheckedUpdateInput = {
      status: validatedData.status,
    };

    // If resolved, save who and when
    if (validatedData.status === "RESOLVED") {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = usuario.id;
      if (validatedData.resolutionNotes) {
        updateData.resolutionNotes = validatedData.resolutionNotes;
      }
    }

    const alerta = await prisma.alert.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        resolvedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const translatedAlerta = {
      ...alerta,
      type: translateAlertType(alerta.type),
      severity: translateAlertSeverity(alerta.severity),
      status: translateAlertStatus(alerta.status),
    };

    return NextResponse.json({ success: true, alerta: translatedAlerta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: translateErrorMessage(error.errors[0].message),
        },
        { status: 400 },
      );
    }
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage("Internal error") },
      { status: 500 },
    );
  }
}
