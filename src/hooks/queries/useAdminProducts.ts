/**
 * useAdminProducts Hook
 * Hook para operaciones de productos en el panel de admin con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface AdminProduct {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  descripcionCorta?: string;
  precio: number;
  precioAnterior?: number | null;
  stock: number;
  categoria: string;
  material: string;
  activo: boolean;
  destacado: boolean;
  anchoCm?: number | null;
  altoCm?: number | null;
  profundidadCm?: number | null;
  peso?: number | null;
  tiempoImpresion?: number | null;
  imagenes: Array<{ url: string; isMain?: boolean; altText?: string }>;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateProductInput {
  // Bilingual fields
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  shortDescEs?: string;
  shortDescEn?: string;
  metaTitleEs?: string;
  metaTitleEn?: string;
  metaDescEs?: string;
  metaDescEn?: string;
  // Other fields
  price: number;
  previousPrice?: number | null;
  stock: number;
  categoryId: string;
  material: string;
  widthCm?: number | null;
  heightCm?: number | null;
  depthCm?: number | null;
  weight?: number | null;
  printTime?: number | null;
  isActive: boolean;
  isFeatured: boolean;
  images: Array<{ url: string; isMain: boolean }>;
}

// API Functions
async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const response = await fetch('/api/admin/products');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cargar productos');
  }

  const data = await response.json();
  return data.productos || [];
}

async function fetchAdminProduct(slug: string): Promise<AdminProduct> {
  const response = await fetch(`/api/admin/products/${slug}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cargar el producto');
  }

  const data = await response.json();
  return data.producto || data.product || data;
}

async function createProduct(input: CreateProductInput): Promise<AdminProduct> {
  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear producto');
  }

  const data = await response.json();
  return data.product || data;
}

async function updateProduct(slug: string, input: Partial<CreateProductInput>): Promise<AdminProduct> {
  const response = await fetch(`/api/admin/products/${slug}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar producto');
  }

  const data = await response.json();
  return data.product || data;
}

async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar producto');
  }
}

// React Query Hooks
export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: fetchAdminProducts,
  });
}

export function useAdminProduct(slug: string) {
  return useQuery({
    queryKey: ['admin', 'product', slug],
    queryFn: () => fetchAdminProduct(slug),
    enabled: !!slug,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al crear producto');
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: Partial<CreateProductInput> }) => updateProduct(slug, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.slug] });
      toast.success('Producto actualizado correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar producto');
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar producto');
    },
  });
}

// Prefetch helpers
export function prefetchAdminProducts(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.prefetchQuery({
    queryKey: ['admin', 'products'],
    queryFn: fetchAdminProducts,
  });
}

// Default export
export default useAdminProducts;
