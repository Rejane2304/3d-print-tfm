/**
 * API Route - Unlock User Account (Admin)
 * POST /api/admin/users/[id]/unlock
 * 
 * Allows admins to manually unlock a locked user account
 * by resetting failedAttempts to 0 and clearing lockedUntil
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';

export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Verify admin role
  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!adminUser || adminUser.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Acceso denegado' },
      { status: 403 }
    );
  }

  const { id } = params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      failedAttempts: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Usuario no encontrado' },
      { status: 404 }
    );
  }

  // Check if account is actually locked
  const now = new Date();
  const isLocked = user.lockedUntil && user.lockedUntil > now;

  if (!isLocked && user.failedAttempts === 0) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'La cuenta no está bloqueada',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          failedAttempts: user.failedAttempts,
          lockedUntil: user.lockedUntil,
        }
      },
      { status: 400 }
    );
  }

  // Reset lockout fields
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      failedAttempts: true,
      lockedUntil: true,
    },
  });

  // Log the admin action (if audit logging is implemented)
  // await logAuditAction({
  //   action: 'USER_UNLOCKED',
  //   entity: 'USER',
  //   entityId: user.id,
  //   userId: adminUser.id,
  //   previousData: { failedAttempts: user.failedAttempts, lockedUntil: user.lockedUntil },
  //   newData: { failedAttempts: 0, lockedUntil: null },
  // });

  return NextResponse.json({
    success: true,
    message: 'Cuenta desbloqueada exitosamente',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      failedAttempts: updatedUser.failedAttempts,
      lockedUntil: updatedUser.lockedUntil,
    },
  });
});
