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

interface ProductosPageProps {
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
async function getProductos(searchParams: ProductosPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 12;
  const skip = (page - 1) * pageSize;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { activo: true };

  if (searchParams.category) {
    where.categoria = searchParams.category;
  }

  if (searchParams.material) {
    where.material = searchParams.material;
  }

  if (searchParams.minPrice || searchParams.maxPrice) {
    where.precio = {};
    if (searchParams.minPrice) {
      where.precio.gte = parseFloat(searchParams.minPrice);
    }
    if (searchParams.maxPrice) {
      where.precio.lte = parseFloat(searchParams.maxPrice);
    }
  }

  if (searchParams.inStock === 'true') {
    where.stock = { gt: 0 };
  }

  if (searchParams.search) {
    where.OR = [
      { nombre: { contains: searchParams.search, mode: 'insensitive' } },
      { descripcion: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any = {};
  if (searchParams.sortBy === 'price') {
    orderBy.precio = searchParams.sortOrder || 'asc';
  } else if (searchParams.sortBy === 'stock') {
    orderBy.stock = searchParams.sortOrder || 'desc';
  } else {
    orderBy.nombre = searchParams.sortOrder || 'asc';
  }

  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: {
        imagenes: {
          where: { esPrincipal: true },
          take: 1,
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.producto.count({ where }),
  ]);
  
  return {
    productos,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const { productos, total, totalPages, page } = await getProductos(searchParams);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Catálogo de Productos
          </h1>
          <p className="text-gray-600 text-lg">
            Descubre nuestra colección de productos impresos en 3D
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar initialValue={searchParams.search} />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Filtros */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <FilterSidebar searchParams={searchParams} />
          </aside>
          
          {/* Grid de Productos */}
          <main className="flex-1">
            {/* Resultados y ordenamiento */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <p className="text-gray-600">
                Mostrando {productos.length} de {total} productos
              </p>
              
              {/* Ordenamiento - Client Component */}
              <SortSelector 
                initialSortBy={searchParams.sortBy} 
                initialSortOrder={searchParams.sortOrder} 
              />
            </div>
            
            {/* Grid */}
            {productos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productos.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg mb-4">
                  No se encontraron productos con los filtros seleccionados
                </p>
                <a
                  href="/products"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Ver todos los productos
                </a>
              </div>
            )}
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  searchParams={searchParams}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
