/**
 * Página de Catálogo de Productos
 * Muestra lista de productos con filtros y paginación
 * Responsive: mobile → 4K
 */
import { prisma } from '@/lib/db/prisma';
import ProductCard from '@/components/products/ProductCard';
import FilterSidebar from '@/components/products/FilterSidebar';
import Pagination from '@/components/products/Pagination';
import SearchBar from '@/components/products/SearchBar';
import SortSelector from '@/components/products/SortSelector';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getProducts(searchParams: ProductsPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 12;
  const skip = (page - 1) * pageSize;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isActive: true };

  if (searchParams.category) {
    where.category = searchParams.category;
  }

  if (searchParams.material) {
    where.material = searchParams.material;
  }

  if (searchParams.minPrice || searchParams.maxPrice) {
    where.price = {};
    if (searchParams.minPrice) {
      where.price.gte = parseFloat(searchParams.minPrice);
    }
    if (searchParams.maxPrice) {
      where.price.lte = parseFloat(searchParams.maxPrice);
    }
  }

  if (searchParams.inStock === 'true') {
    where.stock = { gt: 0 };
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { description: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any = {};
  if (searchParams.sortBy === 'price') {
    orderBy.price = searchParams.sortOrder || 'asc';
  } else if (searchParams.sortBy === 'stock') {
    orderBy.stock = searchParams.sortOrder || 'desc';
  } else {
    orderBy.name = searchParams.sortOrder || 'asc';
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  
  return {
    products,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { products, total, totalPages, page } = await getProducts(searchParams);

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Catálogo de Productos
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Descubre nuestra colección de productos impresos en 3D. 
          Todos nuestros productos están fabricados con materiales de alta calidad.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <SearchBar />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <SortSelector />
          <p className="text-sm text-gray-600">
            Mostrando {products.length} de {total} productos
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <FilterSidebar searchParams={searchParams} />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    searchParams={searchParams}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-gray-600 mb-2">
                No se encontraron productos
              </p>
              <p className="text-gray-500">
                Intenta ajustar los filtros o términos de búsqueda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
