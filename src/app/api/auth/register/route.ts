/**
 * API Route para registro de usuarios con dirección
 * POST /api/auth/register
 * 
 * Recibe datos del usuario y opcionalmente una dirección inicial
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  
  const { 
    nombre, 
    email, 
    password, 
    telefono, 
    direccion: datosDireccion 
  } = body;
  
  // Validaciones específicas por campo
  if (!nombre || nombre.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'El campo nombre es obligatorio' },
      { status: 400 }
    );
  }
  
  if (!email || email.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'El campo email es obligatorio' },
      { status: 400 }
    );
  }
  
  if (!password) {
    return NextResponse.json(
      { success: false, error: 'El campo password es obligatorio' },
      { status: 400 }
    );
  }
  
  if (password.length < 8) {
    return NextResponse.json(
      { success: false, error: 'La contraseña debe tener al menos 8 caracteres' },
      { status: 400 }
    );
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { success: false, error: 'El formato del email no es válido' },
      { status: 400 }
    );
  }
  
  // Validar teléfono si se proporciona
  if (telefono && telefono.trim() !== '') {
    const phoneDigits = telefono.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      return NextResponse.json(
        { success: false, error: 'El teléfono debe tener al menos 9 dígitos' },
        { status: 400 }
      );
    }
  }
  
  // Verificar si el email ya existe
  const usuarioExistente = await prisma.user.findUnique({
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
  
  // Crear usuario con dirección (si se proporciona)
  const usuario = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      nombre,
      telefono: telefono || null,
      role: 'CUSTOMER',
      isActive: true,
      // Crear dirección si se proporcionan los datos
      direcciones: datosDireccion ? {
        create: {
          nombre: datosDireccion.nombre || 'Principal',
          destinatario: datosDireccion.destinatario || nombre,
          telefono: datosDireccion.telefono || telefono || '',
          direccion: datosDireccion.direccion,
          complemento: datosDireccion.complemento,
          codigoPostal: datosDireccion.codigoPostal,
          ciudad: datosDireccion.ciudad,
          provincia: datosDireccion.provincia,
          pais: datosDireccion.pais || 'España',
          esPrincipal: datosDireccion.esPrincipal ?? true,
        }
      } : undefined
    },
    include: {
      direcciones: true
    }
  });
  
  return NextResponse.json(
    { 
      success: true, 
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        direccion: usuario.direcciones?.[0] || null
      }
    },
    { status: 201 }
  );
});
