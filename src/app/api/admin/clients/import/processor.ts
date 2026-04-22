/**
 * Clients Import Processor
 * Contains all logic separated from route
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

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

// Main processor function
export async function processClientsImport(req: NextRequest): Promise<Response> {
  const authError = await verifyAdminAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const validation = validateRequestBody(body);
  if (validation instanceof NextResponse) return validation;

  const result: ImportResult = { success: true, imported: 0, errors: [], warnings: [] };
  await processAllRows(validation.data, validation.options, result);

  return NextResponse.json(buildResponse(result));
}

// Authentication
async function verifyAdminAuth(_req: NextRequest): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (adminUser?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
  }

  return null;
}

// Password utilities
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 12);
}

// Validate request body
function validateRequestBody(body: {
  data?: unknown;
  options?: unknown;
}): { data: unknown[]; options: { skipDuplicates?: boolean } } | NextResponse {
  const { data, options = {} } = body;

  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ success: false, error: 'No se proporcionaron datos para importar' }, { status: 400 });
  }

  const requiredColumns = ['email', 'name'];
  const firstRow = data[0] as Record<string, unknown>;
  const missing = requiredColumns.filter(col => !(col in firstRow));

  if (missing.length > 0) {
    return NextResponse.json(
      { success: false, error: `Columnas requeridas faltantes: ${missing.join(', ')}` },
      { status: 400 },
    );
  }

  return { data, options: options as { skipDuplicates?: boolean } };
}

// Validate and parse row
function parseRowData(row: Record<string, unknown>): z.infer<typeof clientImportSchema> {
  return clientImportSchema.parse({
    email: String(row.email ?? '').trim(),
    name: String(row.name ?? '').trim(),
    role: (String(row.role ?? '').toUpperCase() as 'CUSTOMER' | 'ADMIN') || 'CUSTOMER',
    phone: String(row.phone ?? '').trim() || undefined,
  });
}

// Check duplicate
function checkDuplicate(email: string, existingEmails: Set<string>, skipDuplicates?: boolean): ProcessRowResult | null {
  const normalized = email.toLowerCase();
  if (!existingEmails.has(normalized)) return null;

  if (skipDuplicates) {
    return { success: false, warning: `Email ${email} ya existe - omitido` };
  }
  return { success: false, error: `Email ${email} ya existe` };
}

// Create user
async function createUser(validatedData: z.infer<typeof clientImportSchema>, hashedPassword: string) {
  return prisma.user.create({
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
}

// Process single row
async function processClientRow(
  row: Record<string, unknown>,
  options: { skipDuplicates?: boolean },
  existingEmails: Set<string>,
): Promise<ProcessRowResult> {
  const validatedData = parseRowData(row);

  const duplicateCheck = checkDuplicate(validatedData.email, existingEmails, options.skipDuplicates);
  if (duplicateCheck) return duplicateCheck;

  const tempPassword = generateTempPassword();
  const hashedPassword = await hashPassword(tempPassword);

  await createUser(validatedData, hashedPassword);
  existingEmails.add(validatedData.email.toLowerCase());

  return { success: true };
}

// Handle error
function handleRowError(error: unknown): string {
  if (error instanceof z.ZodError) return error.errors[0]?.message || 'Error de validación';
  return error instanceof Error ? error.message : 'Error desconocido';
}

// Get existing emails
async function getExistingEmails(): Promise<Set<string>> {
  const users: { email: string }[] = await prisma.user.findMany({ select: { email: true } });
  return new Set(users.map(u => u.email.toLowerCase()));
}

// Process all rows
async function processAllRows(
  data: unknown[],
  options: { skipDuplicates?: boolean },
  result: ImportResult,
): Promise<void> {
  const existingEmails = await getExistingEmails();

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
      result.errors.push({ row: rowNumber, message: handleRowError(error) });
    }
  }
}

// Build response
function buildResponse(result: ImportResult) {
  return {
    ...result,
    success: result.errors.length === 0,
    message:
      result.imported > 0
        ? `${result.imported} clientes importados exitosamente`
        : 'No se pudo importar ningún cliente',
  };
}
