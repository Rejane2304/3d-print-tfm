/**
 * API de Upload de Imágenes - Admin
 * POST /api/admin/upload - Recibe imagen base64 y la guarda en el sistema de archivos
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// POST /api/admin/upload
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { image, filename, slug } = body;

    if (!image) {
      return NextResponse.json({ success: false, error: 'Falta la imagen' }, { status: 400 });
    }

    // Validar que es una imagen base64 válida
    const base64Match = image.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ success: false, error: 'Formato de imagen inválido' }, { status: 400 });
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generar nombre de archivo seguro
    const ext = mimeType === 'jpeg' ? 'jpg' : mimeType;
    const safeSlug = slug?.replaceAll(/[^a-z0-9]/gi, '-') || 'product';
    const safeFilename = filename?.replaceAll(/[^a-zA-Z0-9.-]/g, '') || `image.${ext}`;
    const timestamp = Date.now();
    const finalFilename = `${safeSlug}-${timestamp}-${safeFilename}`;

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), 'public', 'images', 'products');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Guardar archivo
    const filePath = join(uploadDir, finalFilename);
    await writeFile(filePath, buffer);

    // Retornar URL relativa
    const url = `/images/products/${finalFilename}`;

    return NextResponse.json({
      success: true,
      url,
      filename: finalFilename,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ success: false, error: 'Error al procesar imagen' }, { status: 500 });
  }
}
