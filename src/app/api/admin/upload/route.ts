/**
 * API de Upload de Imágenes - Admin
 * POST /api/admin/upload - Recibe imagen base64 y la valida
 * 
 * En Vercel (serverless), las imágenes se guardan como base64 en la BD
 * En desarrollo local, se pueden guardar en el sistema de archivos
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// POST /api/admin/upload
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Falta la imagen' },
        { status: 400 }
      );
    }

    // Validar que es una imagen base64 válida
    const base64Match = image.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json(
        { success: false, error: 'Formato de imagen inválido' },
        { status: 400 }
      );
    }

    // La imagen ya está en base64, la retornamos directamente
    // Se guardará en la BD cuando se cree el producto
    return NextResponse.json({
      success: true,
      url: image, // Retornamos el base64 completo como URL
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar imagen' },
      { status: 500 }
    );
  }
}
