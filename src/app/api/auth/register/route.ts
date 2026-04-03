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
    name, 
    email, 
    password, 
    phone, 
    address: addressData 
  } = body;
  
  // Validaciones específicas por campo
  if (!name || name.trim() === '') {
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
  if (phone && phone.trim() !== '') {
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      return NextResponse.json(
        { success: false, error: 'El teléfono debe tener al menos 9 dígitos' },
        { status: 400 }
      );
    }
  }
  
  // Verificar si el email ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  
  if (existingUser) {
    return NextResponse.json(
      { success: false, error: 'Ya existe un usuario con este email' },
      { status: 409 }
    );
  }
  
  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Crear usuario con dirección (si se proporciona)
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone: phone || null,
      role: 'CUSTOMER',
      isActive: true,
      // Crear dirección si se proporcionan los datos
      addresses: addressData ? {
        create: {
          name: addressData.name || 'Principal',
          recipient: addressData.recipient || name,
          phone: addressData.phone || phone || '',
          address: addressData.address,
          complement: addressData.complement,
          postalCode: addressData.postalCode,
          city: addressData.city,
          province: addressData.province,
          country: addressData.country || 'Spain',
          isDefault: addressData.isDefault ?? true,
        }
      } : undefined
    },
    include: {
      addresses: true
    }
  });
  
  return NextResponse.json(
    { 
      success: true, 
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        address: user.addresses?.[0] || null
      }
    },
    { status: 201 }
  );
});
