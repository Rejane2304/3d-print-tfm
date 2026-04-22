/**
 * User API Service
 * Servicios para gestión de perfil y direcciones de usuario
 * @module lib/api/services/user-api
 */

import { apiClient } from '@/lib/api/client';
import type {
  AddressResponse,
  AddressesListResponse,
  ApiResponse,
  ChangePasswordRequest,
  CreateAddressRequest,
  UpdateAddressRequest,
  UpdateProfileRequest,
  UserResponse,
} from '@/types/api';

/**
 * Errores específicos del dominio de usuario
 */
export class UserError extends Error {
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'USER_NOT_FOUND' | 'VALIDATION_ERROR' | 'PASSWORD_ERROR' | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'UserError';
  }
}

// ============================================================================
// Profile Methods
// ============================================================================

/**
 * Obtiene el perfil del usuario autenticado
 * @returns Datos del perfil
 * @throws {UserError} Si hay error al obtener el perfil
 */
export async function getProfile(): Promise<UserResponse> {
  try {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/api/account/profile');

    if (!response.success) {
      if (response.error.toLowerCase().includes('autenticado')) {
        throw new UserError(response.error, 'UNAUTHORIZED');
      }
      throw new UserError(response.error, 'UNKNOWN');
    }

    return response.data;
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(error instanceof Error ? error.message : 'Error al cargar el perfil', 'UNKNOWN');
  }
}

/**
 * Actualiza los datos del perfil
 * @param data - Datos a actualizar
 * @returns Perfil actualizado
 * @throws {UserError} Si hay error de validación o autorización
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UserResponse> {
  try {
    const response = await apiClient.patch<ApiResponse<UserResponse>>('/api/account/profile', data);

    if (!response.success) {
      if (response.error.toLowerCase().includes('autenticado')) {
        throw new UserError(response.error, 'UNAUTHORIZED');
      }
      if (response.details) {
        throw new UserError(response.error, 'VALIDATION_ERROR');
      }
      throw new UserError(response.error, 'UNKNOWN');
    }

    return response.data;
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(error instanceof Error ? error.message : 'Error al actualizar el perfil', 'UNKNOWN');
  }
}

/**
 * Cambia la contraseña del usuario
 * @param currentPassword - Contraseña actual
 * @param newPassword - Nueva contraseña
 * @returns Mensaje de éxito
 * @throws {UserError} Si la contraseña actual es incorrecta
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.patch<ApiResponse<unknown>>('/api/account/profile', {
      passwordActual: currentPassword,
      passwordNuevo: newPassword,
    } as ChangePasswordRequest);

    if (!response.success) {
      if (response.error.toLowerCase().includes('incorrecta')) {
        throw new UserError(response.error, 'PASSWORD_ERROR');
      }
      if (response.error.toLowerCase().includes('reutilizada')) {
        throw new UserError(response.error, 'PASSWORD_ERROR');
      }
      throw new UserError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      message: response.message ?? 'Contraseña actualizada correctamente',
    };
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(error instanceof Error ? error.message : 'Error al cambiar la contraseña', 'UNKNOWN');
  }
}

// ============================================================================
// Address Methods
// ============================================================================

/**
 * Obtiene todas las direcciones del usuario
 * @returns Lista de direcciones
 * @throws {UserError} Si hay error al obtener las direcciones
 */
export async function getAddresses(): Promise<AddressResponse[]> {
  try {
    const response = await apiClient.get<ApiResponse<AddressesListResponse>>('/api/account/addresses');

    if (!response.success) {
      throw new UserError(response.error, 'UNKNOWN');
    }

    return response.data.addresses;
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(error instanceof Error ? error.message : 'Error al cargar direcciones', 'UNKNOWN');
  }
}

/**
 * Obtiene una dirección específica
 * @param addressId - ID de la dirección
 * @returns Datos de la dirección
 * @throws {UserError} Si la dirección no existe
 */
export async function getAddress(addressId: string): Promise<AddressResponse> {
  try {
    const addresses = await getAddresses();
    const address = addresses.find(a => a.id === addressId);

    if (!address) {
      throw new UserError('Dirección no encontrada', 'UNKNOWN');
    }

    return address;
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(error instanceof Error ? error.message : 'Error al cargar la dirección', 'UNKNOWN');
  }
}

/**
 * Crea una nueva dirección
 * @param data - Datos de la dirección
 * @returns Dirección creada
 * @throws {UserError} Si hay error de validación
 */
export async function createAddress(data: CreateAddressRequest): Promise<AddressResponse> {
  try {
    const response = await apiClient.post<ApiResponse<AddressResponse>>('/api/account/addresses', data);

    if (!response.success) {
      if (response.details) {
        throw new UserError(response.error, 'VALIDATION_ERROR');
      }
      throw new UserError(response.error, 'UNKNOWN');
    }

    return response.data;
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(error instanceof Error ? error.message : 'Error al crear la dirección', 'UNKNOWN');
  }
}

/**
 * Actualiza una dirección existente
 * @param addressId - ID de la dirección
 * @param data - Datos a actualizar
 * @returns Dirección actualizada
 * @throws {UserError} Si la dirección no existe
 */
export async function updateAddress(addressId: string, data: UpdateAddressRequest): Promise<AddressResponse> {
  try {
    const response = await apiClient.patch<ApiResponse<AddressResponse>>(`/api/account/addresses/${addressId}`, data);

    if (!response.success) {
      throw new UserError(response.error, 'UNKNOWN');
    }

    return response.data;
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(error instanceof Error ? error.message : 'Error al actualizar la dirección', 'UNKNOWN');
  }
}

/**
 * Elimina una dirección
 * @param addressId - ID de la dirección a eliminar
 * @returns Mensaje de éxito
 * @throws {UserError} Si la dirección no existe
 */
export async function deleteAddress(addressId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.delete<ApiResponse<unknown>>(`/api/account/addresses/${addressId}`);

    if (!response.success) {
      throw new UserError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      message: response.message ?? 'Dirección eliminada correctamente',
    };
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(error instanceof Error ? error.message : 'Error al eliminar la dirección', 'UNKNOWN');
  }
}

/**
 * Establece una dirección como predeterminada
 * @param addressId - ID de la dirección
 * @returns Dirección actualizada
 * @throws {UserError} Si la dirección no existe
 */
export async function setDefaultAddress(addressId: string): Promise<AddressResponse> {
  try {
    const response = await apiClient.patch<ApiResponse<AddressResponse>>(`/api/account/addresses/${addressId}`, {
      isDefault: true,
    });

    if (!response.success) {
      throw new UserError(response.error, 'UNKNOWN');
    }

    return response.data;
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(
      error instanceof Error ? error.message : 'Error al establecer dirección predeterminada',
      'UNKNOWN',
    );
  }
}

/**
 * Obtiene la dirección predeterminada del usuario
 * @returns Dirección predeterminada o null
 */
export async function getDefaultAddress(): Promise<AddressResponse | null> {
  try {
    const addresses = await getAddresses();
    return addresses.find(a => a.isDefault) ?? addresses[0] ?? null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Verifica si un error es de tipo UserError
 */
export function isUserError(error: unknown): error is UserError {
  return error instanceof UserError;
}

/**
 * Obtiene un mensaje de error amigable para usuario
 */
export function getUserErrorMessage(error: unknown): string {
  if (isUserError(error)) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'Debes iniciar sesión para acceder a esta información.';
      case 'USER_NOT_FOUND':
        return 'Usuario no encontrado.';
      case 'VALIDATION_ERROR':
        return 'Por favor, verifica los datos ingresados.';
      case 'PASSWORD_ERROR':
        return 'La contraseña es incorrecta o no cumple los requisitos.';
      default:
        return error.message || 'Ha ocurrido un error al procesar tu solicitud.';
    }
  }
  return 'Ha ocurrido un error inesperado.';
}

/**
 * Formatea una dirección para mostrar
 * @param address - Dirección a formatear
 * @returns Dirección formateada
 */
export function formatAddress(address: AddressResponse): string {
  const parts = [
    address.address,
    address.complement,
    `${address.postalCode} ${address.city}`,
    address.province,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Formatea una dirección en formato multi-línea
 * @param address - Dirección a formatear
 * @returns Array de líneas de la dirección
 */
export function formatAddressLines(address: AddressResponse): string[] {
  const lines: string[] = [address.address];

  if (address.complement) {
    lines.push(address.complement);
  }

  lines.push(`${address.postalCode} ${address.city}`);
  lines.push(`${address.province}, ${address.country}`);

  return lines;
}
