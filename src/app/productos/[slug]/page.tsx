/**
 * Página de Detalle de Producto
 * Muestra información completa de un producto
 * Responsive: mobile → 4K
 */
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Image from 'next/image';
import Link from 'next/link';

interface ProductoDetallePageProps {
  params: {
    slug: string;
  };
}

async function getProducto(slug: string) {
  const producto = await prisma.producto.findUnique({
    where: { slug },
    include: {
      imagenes: {
        orderBy: { orden: 'asc' },
      },
    },
  });
  
  if (!producto || !producto.activo) {
    return null;
  }
  
  // Obtener productos relacionados
  const relacionados = await prisma.producto.findMany({
    where: {
      activo: true,
      categoria: producto.categoria,
      id: { not: producto.id },
    },
    include: {
      imagenes: {
        where: { esPrincipal: true },
        take: 1,
      },
    },
    take: 4,
  });
  
  return { producto, relacionados };
}

export default async function ProductoDetallePage({ params }: ProductoDetallePageProps) {
  const data = await getProducto(params.slug);
  
  if (!data) {
    notFound();
  }
  
  const { producto, relacionados } = data;
  const imagenPrincipal = producto.imagenes[0];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-indigo-600">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/productos" className="hover:text-indigo-600">Productos</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{producto.nombre}</span>
        </nav>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Imágenes del Producto */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
              {imagenPrincipal ? (
                <Image
                  src={imagenPrincipal.url}
                  alt={producto.nombre}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Sin imagen
                </div>
              )}
            </div>
            
            {/* Miniaturas */}
            {producto.imagenes.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {producto.imagenes.map((imagen) => (
                  <button
                    key={imagen.id}
                    className="relative aspect-square bg-gray-200 rounded-md overflow-hidden hover:ring-2 hover:ring-indigo-500"
                  >
                    <Image
                      src={imagen.url}
                      alt={imagen.textoAlt || producto.nombre}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Información del Producto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {producto.nombre}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  {producto.categoria}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {producto.material}
                </span>
              </div>
            </div>
            
            {/* Precio */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-indigo-600">
                {Number(producto.precio).toFixed(2)} €
              </span>
              {producto.precioAnterior && (
                <span className="text-xl text-gray-500 line-through">
                  {Number(producto.precioAnterior).toFixed(2)} €
                </span>
              )}
            </div>
            
            {/* Stock */}
            <div className="text-sm">
              {producto.stock > 0 ? (
                <span className="text-green-600 font-medium">
                  ✅ En stock ({producto.stock} unidades)
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  ❌ Agotado
                </span>
              )}
            </div>
            
            {/* Descripción */}
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">Descripción</h3>
              <p className="text-gray-600">
                {producto.descripcion}
              </p>
            </div>
            
            {/* Detalles */}
            {(producto.dimensiones || producto.peso || producto.tiempoImpresion) && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Especificaciones</h3>
                <dl className="grid grid-cols-2 gap-4">
                  {producto.dimensiones && (
                    <>
                      <dt className="text-gray-600">Dimensiones:</dt>
                      <dd className="font-medium">{producto.dimensiones}</dd>
                    </>
                  )}
                  {producto.peso && (
                    <>
                      <dt className="text-gray-600">Peso:</dt>
                      <dd className="font-medium">{producto.peso} g</dd>
                    </>
                  )}
                  {producto.tiempoImpresion && (
                    <>
                      <dt className="text-gray-600">Tiempo de impresión:</dt>
                      <dd className="font-medium">{producto.tiempoImpresion} min</dd>
                    </>
                  )}
                </dl>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="border-t pt-6 space-y-4">
              {producto.stock > 0 ? (
                <Link
                  href={`/carrito/agregar/${producto.id}`}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Añadir al carrito
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg font-medium cursor-not-allowed"
                >
                  Producto agotado
                </button>
              )}
              
              <Link
                href="/productos"
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center block"
              >
                Ver más productos
              </Link>
            </div>
          </div>
        </div>
        
        {/* Productos Relacionados */}
        {relacionados.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relacionados.map((producto) => (
                <Link
                  key={producto.id}
                  href={`/productos/${producto.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="relative aspect-square bg-gray-200">
                      {producto.imagenes[0] ? (
                        <Image
                          src={producto.imagenes[0].url}
                          alt={producto.nombre}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {producto.nombre}
                      </h3>
                      <p className="text-indigo-600 font-bold mt-1">
                        {Number(producto.precio).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
