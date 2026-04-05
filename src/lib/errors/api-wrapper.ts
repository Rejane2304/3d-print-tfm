/**
 * Wrapper for handling errors in Next.js API routes
 * Ensures errors don't reach the client unhandled
 */
import { NextRequest, NextResponse } from 'next/server';
import { ApiError, ErrorCode, handleError } from '../errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * Wraps an API route handler with error handling
 * Usage: export const GET = withErrorHandler(async (req) => { ... })
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      const apiError = handleError(error);
      
      // Log error for debugging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.error('🔴 API route error:', {
          code: apiError.code,
          message: apiError.message,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      
      // Always return JSON with consistent structure
      return NextResponse.json(apiError.toResponse(), { 
        status: apiError.statusCode 
      });
    }
  };
}

/**
 * Wrapper for Zod input validation
 * Throws ApiError if validation fails
 */
export function validateInput<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
  context: string = 'input'
): T {
  try {
    return schema.parse(data);
  } catch (error: unknown) {
    // Extract error message from Zod
    const zodError = error as { errors?: [{ message?: string }] };
    const message = zodError.errors?.[0]?.message || `Error de validación en ${context}`;
    throw new ApiError(ErrorCode.VALIDATION_INVALID_INPUT, message, 400);
  }
}

/**
 * Wrapper for database operations
 * Converts Prisma errors to ApiErrors
 */
export async function withDbOperation<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    // Handle specific Prisma errors
    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] || 'field';
      throw new ApiError(
        ErrorCode.DB_DUPLICATE_ENTRY,
        `Ya existe un registro con ese ${field}`,
        409,
        field
      );
    }

    if (prismaError.code === 'P2025') {
      // Record not found
      throw new ApiError(
        ErrorCode.DB_NOT_FOUND,
        `${context} no encontrado`,
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
    
    // Re-throw other errors
    throw error;
  }
}
