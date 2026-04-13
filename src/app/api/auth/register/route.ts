/**
 * API Route para registro de usuarios con dirección
 * POST /api/auth/register
 *
 * Recibe datos del usuario y opcionalmente una dirección inicial
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { addressSchema, registerSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limit';
import { createNewUserAlert } from '@/lib/alerts/alert-service';

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Check rate limiting for registration
  const rateLimitResponse = checkRateLimit(req, 'register');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await req.json();
  const { address: addressData, ...userData } = body;

  // Validar datos del usuario con Zod schema (incluye validación compleja de contraseña)
  const userValidationResult = registerSchema.safeParse(userData);

  if (!userValidationResult.success) {
    // Extraer el primer error para el mensaje
    const firstError = userValidationResult.error.errors[0];
    return NextResponse.json({ success: false, error: firstError.message }, { status: 400 });
  }

  // Validar dirección si se proporciona (parcial, ya que algunos campos se completan automáticamente)
  let validatedAddress = null;
  if (addressData) {
    const addressValidationResult = addressSchema.partial().safeParse(addressData);
    if (!addressValidationResult.success) {
      const firstError = addressValidationResult.error.errors[0];
      return NextResponse.json({ success: false, error: `Dirección: ${firstError.message}` }, { status: 400 });
    }
    validatedAddress = addressValidationResult.data;
  }

  const { name, email, password, phone } = userValidationResult.data;

  // Verificar si el email ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return NextResponse.json({ success: false, error: 'Ya existe un usuario con este email' }, { status: 409 });
  }

  // Hash de la contraseña (solo después de validación exitosa)
  const hashedPassword = await bcrypt.hash(password, 12);

  // Crear usuario con dirección (si se proporciona)
  // Initialize failedAttempts=0 and lockedUntil=null explicitly
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone: phone || null,
      role: 'CUSTOMER',
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
      // Crear dirección si se proporcionan los datos
      addresses: validatedAddress
        ? {
            create: {
              id: crypto.randomUUID(),
              name: validatedAddress.name || 'Principal',
              recipient: validatedAddress.recipient || name,
              phone: validatedAddress.phone || phone || '',
              address: validatedAddress.address!,
              complement: validatedAddress.complement,
              postalCode: validatedAddress.postalCode!,
              city: validatedAddress.city!,
              province: validatedAddress.province!,
              country: validatedAddress.country || 'Spain',
              isDefault: validatedAddress.isDefault ?? true,
              updatedAt: new Date(),
            },
          }
        : undefined,
    },
    include: {
      addresses: true,
    },
  });

  // Crear alerta para nuevo usuario registrado
  try {
    await createNewUserAlert(user.id);
  } catch (alertError) {
    console.error('Error creating new user alert:', alertError);
  }

  return NextResponse.json(
    {
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        address: user.addresses?.[0] || null,
      },
    },
    { status: 201 },
  );
});
