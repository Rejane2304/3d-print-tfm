/**
 * Wrapper para manejar errores en API routes de Next.js
 * Asegura que los errores no lleguen crudos al cliente
 */
import { NextRequest, NextResponse } from 'next/server';
import { ApiError, ErrorCode, handleError } from '../errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * Envuelve un handler de API route con error handling
 * Uso: export const GET = withErrorHandler(async (req) => { ... })
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      const apiError = handleError(error);
      
      // Log del error para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.error('🔴 Error en API route:', {
          code: apiError.code,
          message: apiError.message,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      
      // Siempre devolver JSON con estructura consistente
      return NextResponse.json(apiError.toResponse(), { 
        status: apiError.statusCode 
      });
    }
  };
}

/**
 * Wrapper para validación de input con Zod
 * Lanza ApiError si la validación falla
 */
export function validateInput<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
  context: string = 'input'
): T {
  try {
    return schema.parse(data);
  } catch (error: unknown) {
    // Extraer mensaje de error de Zod
    const zodError = error as { errors?: [{ message?: string }] };
    const message = zodError.errors?.[0]?.message || `Error de validación en ${context}`;
    throw new ApiError(ErrorCode.VALIDATION_INVALID_INPUT, message, 400);
  }
}

/**
 * Wrapper para operaciones de base de datos
 * Convierte errores de Prisma a ApiErrors
 */
export async function withDbOperation<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    // Manejar errores específicos de Prisma
    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] || 'campo';
      throw new ApiError(
        ErrorCode.DB_DUPLICATE_ENTRY,
        `Already exists a record with that ${field}`,
        409,
        field
      );
    }
    
    if (prismaError.code === 'P2025') {
      // Record not found
      throw new ApiError(
        ErrorCode.DB_NOT_FOUND,
        `${context} not found`,
        404
      );
    }
    
    if (prismaError.code === 'P2003') {
      // Foreign key constraint
      throw new ApiError(
        ErrorCode.VALIDATION_INVALID_INPUT,
        `Referencia inválida en ${context}`,
        400
      );
    }
    
    // Re-lanzar otros errores
    throw error;
  }
}
