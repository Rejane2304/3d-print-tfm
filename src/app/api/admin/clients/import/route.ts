/**
 * API Route - Import Clients from CSV (Admin)
 * POST /api/admin/clients/import
 * Imports users (customers) from CSV file
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import { z } from 'zod';

// Validation schema for client import
const clientImportSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100, 'Nombre máximo 100 caracteres'),
  role: z.enum(['CUSTOMER', 'ADMIN']).default('CUSTOMER'),
  phone: z.string().max(20, 'Teléfono máximo 20 caracteres').optional(),
});

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
}

// Generate a secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const { data, options = {} } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: 'No se proporcionaron datos para importar' }, { status: 400 });
    }

    // Validate required columns
    const requiredColumns = ['email', 'name'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { success: false, error: `Columnas requeridas faltantes: ${missingColumns.join(', ')}` },
        { status: 400 },
      );
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      warnings: [],
    };

    // Get existing emails to check for duplicates
    const existingEmails = new Set(
      (
        await prisma.user.findMany({
          select: { email: true },
        })
      ).map(u => u.email.toLowerCase()),
    );

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      try {
        // Validate row data
        const validatedData = clientImportSchema.parse({
          email: row.email?.trim(),
          name: row.name?.trim(),
          role: (row.role?.toUpperCase() as 'CUSTOMER' | 'ADMIN') || 'CUSTOMER',
          phone: row.phone?.trim() || undefined,
        });

        // Check for duplicate email
        if (existingEmails.has(validatedData.email.toLowerCase())) {
          if (options.skipDuplicates) {
            result.warnings.push({
              row: rowNumber,
              message: `Email ${validatedData.email} ya existe - omitido`,
            });
            continue;
          } else {
            result.errors.push({
              row: rowNumber,
              message: `Email ${validatedData.email} ya existe`,
            });
            continue;
          }
        }

        // Generate temporary password
        const tempPassword = generateTempPassword();
        const hashedPassword = await hashPassword(tempPassword);

        // Create user
        await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            email: validatedData.email.toLowerCase(),
            name: validatedData.name,
            password: hashedPassword,
            role: validatedData.role,
            phone: validatedData.phone || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Add to existing emails set
        existingEmails.add(validatedData.email.toLowerCase());
        result.imported++;
      } catch (error) {
        if (error instanceof z.ZodError) {
          result.errors.push({
            row: rowNumber,
            message: error.errors[0]?.message || 'Error de validación',
          });
        } else {
          result.errors.push({
            row: rowNumber,
            message: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      }
    }

    // Return result even if partially successful
    return NextResponse.json({
      ...result,
      success: result.errors.length === 0,
      message:
        result.imported > 0
          ? `${result.imported} clientes importados exitosamente`
          : 'No se pudo importar ningún cliente',
    });
  } catch (error) {
    console.error('Error importing clients:', error);
    return NextResponse.json({ success: false, error: 'Error al importar clientes' }, { status: 500 });
  }
}

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}
