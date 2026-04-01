/**
 * API de Alerta Individual Admin
 * Eliminar alerta específica
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar que la alerta existe
    const alerta = await prisma.alerta.findUnique({
      where: { id: params.id },
    });

    if (!alerta) {
      return NextResponse.json(
        { success: false, error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la alerta
    await prisma.alerta.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando alerta:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}