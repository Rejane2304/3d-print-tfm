/**
 * API Route para registro de usuarios
 * POST /api/auth/register
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db/prisma';
import { registroSchema } from '@/lib/validators';
import { withErrorHandler } from '@/lib/errors/api-wrapper';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  
  // Validar datos de entrada
  const result = registroSchema.safeParse(body);
  
  if (!result.success) {
    const errores = result.error.errors.map(err => err.message).join(', ');
    return NextResponse.json(
      { success: false, error: errores },
      { status: 400 }
    );
  }
  
  const { nombre, email, password, telefono } = result.data;
  
  // Verificar si el email ya existe
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase() },
  });
  
  if (usuarioExistente) {
    return NextResponse.json(
      { success: false, error: 'Ya existe un usuario con este email' },
      { status: 409 }
    );
  }
  
  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Crear usuario
  const usuario = await prisma.usuario.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      nombre,
      telefono,
      rol: 'CLIENTE',
      activo: true,
    },
  });
  
  // Crear dirección vacía para el usuario (opcional)
  // El usuario la completará en su perfil
  
  return NextResponse.json(
    { 
      success: true, 
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
      }
    },
    { status: 201 }
  );
});
