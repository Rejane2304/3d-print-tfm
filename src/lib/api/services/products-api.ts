/**
 * Products API Service
 * Servicios para catálogo de productos y categorías
 * @module lib/api/services/products-api
 */

import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  CategoriesListResponse,
  CategoryResponse,
  ProductResponse,
  ProductsListResponse,
  ProductSearchParams,
} from '@/types/api';
import type { Material } from '@prisma/client';

/**
 * Errores específicos del dominio de productos
 */
export class ProductsError extends Error {
  constructor(
    message: string,
    public code: 'PRODUCT_NOT_FOUND' | 'CATEGORY_NOT_FOUND' | 'INVALID_FILTER' | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'ProductsError';
  }
}

/**
 * Construye los query params para la búsqueda de productos
 */
function buildQueryParams(params: ProductSearchParams): string {
  const query = new URLSearchParams();

  if (params.page) query.set('page', params.page.toString());
  if (params.pageSize) query.set('pageSize', params.pageSize.toString());
  if (params.category) query.set('category', params.category);
  if (params.material) query.set('material', params.material);
  if (params.minPrice !== undefined) query.set('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined) query.set('maxPrice', params.maxPrice.toString());
  if (params.inStock) query.set('inStock', 'true');
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.search) query.set('search', params.search);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Obtiene el listado de productos con filtros opcionales
 * @param params - Parámetros de búsqueda y filtrado
 * @returns Lista paginada de productos
 * @throws {ProductsError} Si hay error al obtener productos
 */
export async function getProducts(params: ProductSearchParams = {}): Promise<ProductsListResponse> {
  try {
    const queryString = buildQueryParams(params);
    const response = await apiClient.get<ApiResponse<ProductsListResponse>>(`/api/products${queryString}`);

    if (!response.success) {
      throw new ProductsError(response.error, 'UNKNOWN');
    }

    return {
      data: response.data.data,
      pagination: response.data.pagination,
      filters: response.data.filters,
    };
  } catch (error) {
    if (error instanceof ProductsError) throw error;
    throw new ProductsError(error instanceof Error ? error.message : 'Error al cargar productos', 'UNKNOWN');
  }
}

/**
 * Obtiene un producto por su slug
 * @param slug - Slug del producto
 * @returns Datos del producto
 * @throws {ProductsError} Si el producto no existe
 */
export async function getProduct(slug: string): Promise<ProductResponse> {
  try {
    const response = await apiClient.get<ApiResponse<ProductResponse>>(`/api/products/${slug}`);

    if (!response.success) {
      throw new ProductsError(response.error, 'PRODUCT_NOT_FOUND');
    }

    return response.data;
  } catch (error) {
    if (error instanceof ProductsError) throw error;
    throw new ProductsError(error instanceof Error ? error.message : 'Error al cargar el producto', 'UNKNOWN');
  }
}

/**
 * Obtiene un producto por su ID
 * @param id - ID del producto
 * @returns Datos del producto
 * @throws {ProductsError} Si el producto no existe
 */
export async function getProductById(id: string): Promise<ProductResponse> {
  try {
    // Nota: La API actualmente usa slug, pero podría agregarse endpoint por ID
    const response = await apiClient.get<ApiResponse<ProductResponse>>(`/api/products?id=${id}`);

    if (!response.success) {
      throw new ProductsError(response.error, 'PRODUCT_NOT_FOUND');
    }

    return response.data;
  } catch (error) {
    if (error instanceof ProductsError) throw error;
    throw new ProductsError(error instanceof Error ? error.message : 'Error al cargar el producto', 'UNKNOWN');
  }
}

/**
 * Obtiene todas las categorías activas
 * @returns Lista de categorías
 * @throws {ProductsError} Si hay error al obtener categorías
 */
export async function getCategories(): Promise<CategoryResponse[]> {
  try {
    const response = await apiClient.get<ApiResponse<CategoriesListResponse>>('/api/categories');

    if (!response.success) {
      throw new ProductsError(response.error, 'UNKNOWN');
    }

    return response.data.categories;
  } catch (error) {
    if (error instanceof ProductsError) throw error;
    throw new ProductsError(error instanceof Error ? error.message : 'Error al cargar categorías', 'UNKNOWN');
  }
}

/**
 * Obtiene una categoría por su slug
 * @param slug - Slug de la categoría
 * @returns Datos de la categoría
 * @throws {ProductsError} Si la categoría no existe
 */
export async function getCategory(slug: string): Promise<CategoryResponse> {
  try {
    // Filtrar categorías para encontrar la que coincide
    const categories = await getCategories();
    const category = categories.find(c => c.slug === slug);

    if (!category) {
      throw new ProductsError('Categoría no encontrada', 'CATEGORY_NOT_FOUND');
    }

    return category;
  } catch (error) {
    if (error instanceof ProductsError) throw error;
    throw new ProductsError(error instanceof Error ? error.message : 'Error al cargar la categoría', 'UNKNOWN');
  }
}

/**
 * Busca productos por término de búsqueda
 * @param searchTerm - Término a buscar
 * @param params - Parámetros adicionales de búsqueda
 * @returns Lista de productos que coinciden
 */
export async function searchProducts(
  searchTerm: string,
  params: Omit<ProductSearchParams, 'search'> = {},
): Promise<ProductsListResponse> {
  return getProducts({
    ...params,
    search: searchTerm,
  });
}

/**
 * Obtiene productos por categoría
 * @param categorySlug - Slug de la categoría
 * @param params - Parámetros adicionales de filtrado
 * @returns Lista de productos de la categoría
 */
export async function getProductsByCategory(
  categorySlug: string,
  params: Omit<ProductSearchParams, 'category'> = {},
): Promise<ProductsListResponse> {
  return getProducts({
    ...params,
    category: categorySlug,
  });
}

/**
 * Obtiene productos por material
 * @param material - Material de impresión (PLA, PETG, etc.)
 * @param params - Parámetros adicionales de filtrado
 * @returns Lista de productos del material
 */
export async function getProductsByMaterial(
  material: Material,
  params: Omit<ProductSearchParams, 'material'> = {},
): Promise<ProductsListResponse> {
  return getProducts({
    ...params,
    material,
  });
}

/**
 * Obtiene productos filtrados por rango de precio
 * @param minPrice - Precio mínimo
 * @param maxPrice - Precio máximo
 * @param params - Parámetros adicionales de filtrado
 * @returns Lista de productos en el rango de precio
 */
export async function getProductsByPriceRange(
  minPrice: number,
  maxPrice: number,
  params: Omit<ProductSearchParams, 'minPrice' | 'maxPrice'> = {},
): Promise<ProductsListResponse> {
  return getProducts({
    ...params,
    minPrice,
    maxPrice,
  });
}

/**
 * Obtiene productos con stock disponible
 * @param params - Parámetros adicionales de filtrado
 * @returns Lista de productos con stock
 */
export async function getProductsInStock(
  params: Omit<ProductSearchParams, 'inStock'> = {},
): Promise<ProductsListResponse> {
  return getProducts({
    ...params,
    inStock: true,
  });
}

/**
 * Obtiene los productos destacados (simulado - requiere implementación en backend)
 * @param limit - Cantidad de productos a obtener
 * @returns Lista de productos destacados
 */
export async function getFeaturedProducts(limit: number = 8): Promise<ProductResponse[]> {
  try {
    const response = await getProducts({
      pageSize: limit,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    return response.data;
  } catch (error) {
    throw new ProductsError(error instanceof Error ? error.message : 'Error al cargar productos destacados', 'UNKNOWN');
  }
}

/**
 * Verifica si un error es de tipo ProductsError
 */
export function isProductsError(error: unknown): error is ProductsError {
  return error instanceof ProductsError;
}

/**
 * Obtiene un mensaje de error amigable para productos
 */
export function getProductsErrorMessage(error: unknown): string {
  if (isProductsError(error)) {
    switch (error.code) {
      case 'PRODUCT_NOT_FOUND':
        return 'El producto que buscas no existe o ya no está disponible.';
      case 'CATEGORY_NOT_FOUND':
        return 'La categoría que buscas no existe.';
      case 'INVALID_FILTER':
        return 'Los filtros aplicados no son válidos.';
      default:
        return error.message || 'Ha ocurrido un error al cargar los productos.';
    }
  }
  return 'Ha ocurrido un error inesperado.';
}
