/**
 * useProducts Hook
 * Hook para obtener productos con React Query
 */

import { useQuery, type useQueryClient } from '@tanstack/react-query';

// Types
export interface ProductFilters {
  page?: number;
  pageSize?: number;
  category?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'stock';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  stock: number;
  material: string;
  category?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  images: Array<{
    id: string;
    url: string;
    isMain: boolean;
    altText?: string | null;
  }>;
  isActive: boolean;
  isFeatured: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    category: string | null;
    material: string | null;
    minPrice: string | null;
    maxPrice: string | null;
    inStock: boolean;
    sortBy: string;
    sortOrder: string;
    search: string | null;
  };
}

// API Functions
async function fetchProducts(filters?: ProductFilters): Promise<ProductsResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters?.category) params.set('category', filters.category);
  if (filters?.material) params.set('material', filters.material);
  if (filters?.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters?.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters?.inStock) params.set('inStock', 'true');
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);
  if (filters?.search) params.set('search', filters.search);

  const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al cargar productos');
  }

  return response.json();
}

async function fetchProduct(slug: string): Promise<Product> {
  const response = await fetch(`/api/products/${slug}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al cargar el producto');
  }

  const data = await response.json();
  return data.product || data;
}

// React Query Hooks
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  });
}

// Prefetch helper for server components
export function prefetchProducts(queryClient: ReturnType<typeof useQueryClient>, filters?: ProductFilters) {
  return queryClient.prefetchQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });
}

export function prefetchProduct(queryClient: ReturnType<typeof useQueryClient>, slug: string) {
  return queryClient.prefetchQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug),
  });
}

// Default export
export default useProducts;
