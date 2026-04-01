/**
 * API de Mensaje Individual Admin
 * Eliminar mensaje específico
 * 
 * Requiere: Ser el autor del mensaje
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

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 401 }
      );
    }

    // Solo admin puede eliminar mensajes
    if (usuario.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar que el mensaje existe
    const mensaje = await prisma.mensajePedido.findUnique({
      where: { id: params.id },
    });

    if (!mensaje) {
      return NextResponse.json(
        { success: false, error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el mensaje
    await prisma.mensajePedido.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando mensaje:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
