/**
 * Página de Catálogo de Productos - Diseño Moderno
 * Muestra lista de productos traducidos con filtros y paginación
 * Responsive: mobile → 4K
 */
import { prisma } from '@/lib/db/prisma';
import { translateProductDescription, translateProductName } from '@/lib/i18n';
import ProductCard from '@/components/products/ProductCard';
import FilterSidebar from '@/components/products/FilterSidebar';
import Pagination from '@/components/products/Pagination';
import SearchBar from '@/components/products/SearchBar';
import SortSelector from '@/components/products/SortSelector';
import { Prisma } from '@prisma/client';
import { Package, Shield, Sparkles, Truck } from 'lucide-react';

interface ProductsPageProps {
  searchParams: {
    page?: string;
    category?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
  };
}

async function getProducts(searchParams: ProductsPageProps['searchParams']) {
  const page = Number.parseInt(searchParams.page || '1', 10);
  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (searchParams.category) {
    const category = await prisma.category.findUnique({
      where: { slug: searchParams.category },
    });
    if (category) {
      where.categoryId = category.id;
    }
  }

  if (searchParams.material) {
    where.material = searchParams.material as Prisma.EnumMaterialFilter;
  }

  if (searchParams.minPrice || searchParams.maxPrice) {
    where.price = {};
    if (searchParams.minPrice) {
      where.price.gte = Number.parseFloat(searchParams.minPrice);
    }
    if (searchParams.maxPrice) {
      where.price.lte = Number.parseFloat(searchParams.maxPrice);
    }
  }

  if (searchParams.inStock === 'true') {
    where.stock = { gt: 0 };
  }

  if (searchParams.search) {
    where.OR = [
      {
        name: {
          contains: searchParams.search,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      },
      {
        description: {
          contains: searchParams.search,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  if (searchParams.sortBy === 'price') {
    orderBy.price = (searchParams.sortOrder as Prisma.SortOrder) || 'asc';
  } else if (searchParams.sortBy === 'stock') {
    orderBy.stock = (searchParams.sortOrder as Prisma.SortOrder) || 'desc';
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const translatedProducts = products.map((product) => ({
    ...product,
    name: translateProductName(product.slug),
    description: translateProductDescription(product.slug),
  }));

  const sortedProducts = [...translatedProducts].sort((a, b) => {
    let comparison = 0;

    if (searchParams.sortBy === 'price') {
      const priceA = Number(a.price);
      const priceB = Number(b.price);
      comparison = priceA - priceB;
    } else if (searchParams.sortBy === 'stock') {
      comparison = a.stock - b.stock;
    } else {
      comparison = (a.name || '').localeCompare(b.name || '', 'es', {
        sensitivity: 'base',
      });
    }

    return searchParams.sortOrder === 'desc' ? -comparison : comparison;
  });

  return {
    products: sortedProducts,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
}

export default async function ProductsPage({
  searchParams,
}: Readonly<ProductsPageProps>) {
  const { products, total, totalPages, page } = await getProducts(searchParams);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section Moderno */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 \
                rounded-full px-4 py-2 mb-6"
              style={{ maxWidth: '100%' }}
            >
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium text-white/90">
                Impresión 3D de Alta Calidad
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Catálogo de Productos
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Descubre nuestra colección única de productos impresos en 3D.
              Diseños exclusivos fabricados con los mejores materiales.
            </p>

            {/* Features Bar */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-8">
              {[
                { icon: Package, text: 'Materiales Premium' },
                { icon: Shield, text: 'Garantía de Calidad' },
                { icon: Truck, text: 'Envío Rápido' },
              ].map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-2 text-white/90"
                >
                  <feature.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Search Bar Prominente */}
        <div className="max-w-3xl mx-auto mb-8 sm:mb-12">
          <SearchBar />
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Estilo Moderno */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <FilterSidebar searchParams={searchParams} />
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            {/* Header de Productos */}
            <div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 \
                border-b border-gray-200"
              style={{ maxWidth: '100%' }}
            >
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Mostrando resultados
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length}{' '}
                  <span className="text-gray-400 font-normal">de</span> {total}{' '}
                  productos
                </p>
              </div>
              <SortSelector />
            </div>

            {products.length > 0 ? (
              <>
                {/* Grid de Productos Moderno */}
                <div
                  data-testid="product-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Pagination Moderno */}
                {totalPages > 1 && (
                  <div className="mt-12 sm:mt-16 pt-8 border-t border-gray-200">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Estado Vacío Moderno */
              <div className="text-center py-16 sm:py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Intenta ajustar los filtros o términos de búsqueda para
                  encontrar lo que buscas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
