/**
 * Setup endpoint - Solo para inicialización
 * Crea usuario admin si no existe
 * ⚠️ ELIMINAR DESPUÉS DE USAR
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  try {
    // Verificar si ya existe admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@3dprint.com' },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin already exists',
        userId: existingAdmin.id,
      });
    }

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('AdminTFM2024!', 10);

    const admin = await prisma.user.create({
      data: {
        id: 'user-admin-001',
        email: 'admin@3dprint.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
        failedAttempts: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      userId: admin.id,
      email: admin.email,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin',
      },
      { status: 500 },
    );
  }
}
