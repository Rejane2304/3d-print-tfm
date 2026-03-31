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

interface ProductosPageProps {
  searchParams: {
    page?: string;
    categoria?: string;
    material?: string;
    minPrecio?: string;
    maxPrecio?: string;
    enStock?: string;
    ordenar?: string;
    orden?: string;
    busqueda?: string;
  };
}

async function getProductos(searchParams: ProductosPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 12;
  const skip = (page - 1) * pageSize;
  
  // Construir where clause
  const where: any = { activo: true };
  
  if (searchParams.categoria) {
    where.categoria = searchParams.categoria;
  }
  
  if (searchParams.material) {
    where.material = searchParams.material;
  }
  
  if (searchParams.minPrecio || searchParams.maxPrecio) {
    where.precio = {};
    if (searchParams.minPrecio) {
      where.precio.gte = parseFloat(searchParams.minPrecio);
    }
    if (searchParams.maxPrecio) {
      where.precio.lte = parseFloat(searchParams.maxPrecio);
    }
  }
  
  if (searchParams.enStock === 'true') {
    where.stock = { gt: 0 };
  }
  
  if (searchParams.busqueda) {
    where.OR = [
      { nombre: { contains: searchParams.busqueda, mode: 'insensitive' } },
      { descripcion: { contains: searchParams.busqueda, mode: 'insensitive' } },
    ];
  }
  
  // Construir orderBy
  const orderBy: any = {};
  if (searchParams.ordenar === 'precio') {
    orderBy.precio = searchParams.orden || 'asc';
  } else if (searchParams.ordenar === 'stock') {
    orderBy.stock = searchParams.orden || 'desc';
  } else {
    orderBy.nombre = searchParams.orden || 'asc';
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
          <SearchBar initialValue={searchParams.busqueda} />
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
              
              {/* Ordenamiento */}
              <form className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Ordenar por:</label>
                <select
                  name="ordenar"
                  defaultValue={searchParams.ordenar || 'nombre'}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => {
                    const form = e.target.form;
                    if (form) form.submit();
                  }}
                >
                  <option value="nombre">Nombre</option>
                  <option value="precio">Precio</option>
                  <option value="stock">Stock</option>
                </select>
                
                <select
                  name="orden"
                  defaultValue={searchParams.orden || 'asc'}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => {
                    const form = e.target.form;
                    if (form) form.submit();
                  }}
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>
              </form>
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
                  href="/productos"
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
