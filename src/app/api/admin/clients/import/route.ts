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

interface ProcessRowResult {
  success: boolean;
  warning?: string;
  error?: string;
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

// Hash password helper
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

// 1. Authentication verification
async function verifyAdminAuth(
  req: NextRequest,
): Promise<{ success: false; response: NextResponse } | { success: true; userId: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 }),
    };
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (adminUser?.role !== 'ADMIN') {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 }),
    };
  }

  return { success: true, userId: adminUser.id };
}

// 2. Data validation
function validateImportData(body: { data?: unknown; options?: unknown }):
  | {
      success: false;
      response: NextResponse;
    }
  | {
      success: true;
      data: unknown[];
      options: { skipDuplicates?: boolean };
    } {
  const { data, options = {} } = body;

  if (!Array.isArray(data) || data.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'No se proporcionaron datos para importar' },
        { status: 400 },
      ),
    };
  }

  const requiredColumns = ['email', 'name'];
  const firstRow = data[0] as Record<string, unknown>;
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));

  if (missingColumns.length > 0) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: `Columnas requeridas faltantes: ${missingColumns.join(', ')}` },
        { status: 400 },
      ),
    };
  }

  return {
    success: true,
    data,
    options: options as { skipDuplicates?: boolean },
  };
}

// 3. Row processing
async function processClientRow(
  row: Record<string, unknown>,
  options: { skipDuplicates?: boolean },
  existingEmails: Set<string>,
): Promise<ProcessRowResult> {
  const validatedData = clientImportSchema.parse({
    email: String(row.email ?? '').trim(),
    name: String(row.name ?? '').trim(),
    role: (String(row.role ?? '').toUpperCase() as 'CUSTOMER' | 'ADMIN') || 'CUSTOMER',
    phone: String(row.phone ?? '').trim() || undefined,
  });

  // Check for duplicate email
  if (existingEmails.has(validatedData.email.toLowerCase())) {
    if (options.skipDuplicates) {
      return {
        success: false,
        warning: `Email ${validatedData.email} ya existe - omitido`,
      };
    }
    return {
      success: false,
      error: `Email ${validatedData.email} ya existe`,
    };
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

  return { success: true };
}

// 4. Simplified POST handler
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(req);
    if (!auth.success) return auth.response;

    // Parse and validate request body
    const body = await req.json();
    const validation = validateImportData(body);
    if (!validation.success) return validation.response;

    const { data, options } = validation;

    // Initialize result
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      warnings: [],
    };

    // Get existing emails to check for duplicates
    const existingEmails = new Set(
      (await prisma.user.findMany({ select: { email: true } })).map(u => u.email.toLowerCase()),
    );

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      const rowNumber = i + 1;

      try {
        const processResult = await processClientRow(row, options, existingEmails);

        if (processResult.success) {
          result.imported++;
        } else if (processResult.warning) {
          result.warnings.push({ row: rowNumber, message: processResult.warning });
        } else if (processResult.error) {
          result.errors.push({ row: rowNumber, message: processResult.error });
        }
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

    // Return result
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
