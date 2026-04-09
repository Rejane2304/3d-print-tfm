/**
 * API de Upload de Imágenes - Admin
 * POST /api/admin/upload - Recibe imagen base64 y la guarda
 * 
 * Guarda las imágenes en public/images/products/[slug]/
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { image, filename, slug } = body;

    if (!image || !filename || !slug) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
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

    const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
    const base64Data = base64Match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'products', slug);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generar nombre único con extensión correcta
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFilename = `${timestamp}-${sanitizedFilename.replace(/\.[^.]+$/, '')}.${ext}`;
    const filePath = path.join(uploadDir, finalFilename);

    // Guardar archivo
    await writeFile(filePath, buffer);

    // Retornar URL relativa
    const url = `/images/products/${slug}/${finalFilename}`;

    return NextResponse.json({
      success: true,
      url,
      filename: finalFilename,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir imagen' },
      { status: 500 }
    );
  }
}
