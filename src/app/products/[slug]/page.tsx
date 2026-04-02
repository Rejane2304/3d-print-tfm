/**
 * Página de Detalle de Producto
 * Muestra información completa de un producto
 * Responsive: mobile → 4K
 */
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Image from 'next/image';
import Link from 'next/link';
import AddToCartButton from '@/components/products/AddToCartButton';

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
          <Link href="/products" className="hover:text-indigo-600">Productos</Link>
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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
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
                      sizes="(max-width: 768px) 25vw, (max-width: 1200px) 12vw, 12vw"
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
                      <dd className="font-medium">{Number(producto.peso)} g</dd>
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
              <AddToCartButton
                productoId={producto.id}
                stock={producto.stock}
                producto={{
                  id: producto.id,
                  nombre: producto.nombre,
                  slug: producto.slug,
                  precio: Number(producto.precio),
                  stock: producto.stock,
                  imagen: producto.imagenes[0]?.url || null,
                }}
              />
              
              <Link
                href="/products"
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
                  href={`/products/${producto.slug}`}
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
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
