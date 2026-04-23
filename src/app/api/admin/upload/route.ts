/**
 * API de Upload de Imágenes - Admin
 * POST /api/admin/upload - Recibe imagen base64 y la guarda en el sistema de archivos
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
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

    const { image, filename: _unusedFilename, slug } = body;

    if (!image) {
      return NextResponse.json({ success: false, error: 'Falta la imagen' }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Falta el slug del producto' }, { status: 400 });
    }

    // Validar que es una imagen base64 válida
    const base64Match = image.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ success: false, error: 'Formato de imagen inválido' }, { status: 400 });
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generar nombre de archivo seguro con índice incremental
    const ext = mimeType === 'jpeg' ? 'jpg' : mimeType;
    const safeSlug = slug.replaceAll(/[^a-z0-9]/gi, '-');

    // Crear directorio de la subcarpeta del producto
    const uploadDir = join(process.cwd(), 'public', 'images', 'products', safeSlug);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Contar archivos existentes para generar índice incremental
    let index = 1;
    try {
      const existingFiles = readdirSync(uploadDir);
      // Buscar archivos que sigan el patrón {slug}-{numero}.{ext}
      const slugFiles = existingFiles.filter(f => f.startsWith(`${safeSlug}-`));
      if (slugFiles.length > 0) {
        // Extraer índices de los archivos existentes usando RegExp.exec()
        const regex = new RegExp(String.raw`^${safeSlug}-(\d+)\.`);
        const indices = slugFiles.map(f => {
          const match = regex.exec(f);
          return match ? Number.parseInt(match[1], 10) : 0;
        });
        index = Math.max(...indices) + 1;
      }
    } catch {
      // Si no se puede leer el directorio, usar índice 1
      index = 1;
    }

    const finalFilename = `${safeSlug}-${index}.${ext}`;

    // Guardar archivo
    const filePath = join(uploadDir, finalFilename);
    await writeFile(filePath, buffer);

    // Retornar URL relativa incluyendo la subcarpeta
    const url = `/images/products/${safeSlug}/${finalFilename}`;

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
