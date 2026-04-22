/**
 * useUser Hook
 * Hook para obtener información del usuario con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  fiscalName?: string | null;
  taxId?: string | null;
  createdAt: string;
}

export interface Address {
  id: string;
  name: string;
  recipient: string;
  street: string;
  complement?: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string | null;
  isDefault: boolean;
}

// API Functions
async function fetchProfile(): Promise<UserProfile> {
  const response = await fetch('/api/account/profile');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cargar el perfil');
  }

  const data = await response.json();
  return data.user || data;
}

async function updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const response = await fetch('/api/account/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar el perfil');
  }

  const data = await response.json();
  return data.user || data;
}

async function fetchAddresses(): Promise<Address[]> {
  const response = await fetch('/api/account/addresses');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cargar direcciones');
  }

  const data = await response.json();
  return data.addresses || data;
}

async function createAddress(address: Omit<Address, 'id'>): Promise<Address> {
  const response = await fetch('/api/account/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear dirección');
  }

  const data = await response.json();
  return data.address || data;
}

async function updateAddress(id: string, address: Partial<Address>): Promise<Address> {
  const response = await fetch(`/api/account/addresses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar dirección');
  }

  const data = await response.json();
  return data.address || data;
}

async function deleteAddress(id: string): Promise<void> {
  const response = await fetch(`/api/account/addresses/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar dirección');
  }
}

// React Query Hooks
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil actualizado correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el perfil');
    },
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });
}

export function useCreateAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Dirección creada correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al crear dirección');
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, address }: { id: string; address: Partial<Address> }) => updateAddress(id, address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Dirección actualizada correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar dirección');
    },
  });
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Dirección eliminada correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar dirección');
    },
  });
}

// Prefetch helpers
export function prefetchProfile(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.prefetchQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });
}

export function prefetchAddresses(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.prefetchQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });
}

// Default export
export default useProfile;
