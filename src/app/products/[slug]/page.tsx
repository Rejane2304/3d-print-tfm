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

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });
  
  if (!product || !product.isActive) {
    return null;
  }
  
  // Obtener productos relacionados
  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      category: product.category,
      id: { not: product.id },
    },
    include: {
      images: {
        where: { isMain: true },
        take: 1,
      },
    },
    take: 4,
  });
  
  return { product, related };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const data = await getProduct(params.slug);
  
  if (!data) {
    notFound();
  }
  
  const { product, related } = data;
  const mainImage = product.images[0];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-indigo-600">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-indigo-600">Productos</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Imágenes del Producto */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
              {mainImage ? (
                <Image
                  src={mainImage.url}
                  alt={product.name}
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
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image) => (
                  <button
                    key={image.id}
                    className="relative aspect-square bg-gray-200 rounded-md overflow-hidden hover:ring-2 hover:ring-indigo-500"
                  >
                    <Image
                      src={image.url}
                      alt={image.altText || product.name}
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
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  {product.category}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {product.material}
                </span>
              </div>
            </div>
            
            {/* Precio */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-indigo-600">
                {Number(product.price).toFixed(2)} €
              </span>
              {product.previousPrice && (
                <span className="text-xl text-gray-500 line-through">
                  {Number(product.previousPrice).toFixed(2)} €
                </span>
              )}
            </div>
            
            {/* Stock */}
            <div className="text-sm">
              {product.stock > 0 ? (
                <span className="text-green-600 font-medium">
                  ✅ En stock ({product.stock} unidades)
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
                {product.description}
              </p>
            </div>
            
            {/* Detalles */}
            {(product.dimensions || product.weight || product.printTime) && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Especificaciones</h3>
                <dl className="grid grid-cols-2 gap-4">
                  {product.dimensions && (
                    <>
                      <dt className="text-gray-600">Dimensiones:</dt>
                      <dd className="font-medium">{product.dimensions}</dd>
                    </>
                  )}
                  {product.weight && (
                    <>
                      <dt className="text-gray-600">Peso:</dt>
                      <dd className="font-medium">{Number(product.weight)} g</dd>
                    </>
                  )}
                  {product.printTime && (
                    <>
                      <dt className="text-gray-600">Tiempo de impresión:</dt>
                      <dd className="font-medium">{product.printTime} min</dd>
                    </>
                  )}
                </dl>
              </div>
            )}
            
            {/* Botones de acción */}
              <div className="border-t pt-6 space-y-4">
              <AddToCartButton
                productId={product.id}
                stock={product.stock}
                producto={{
                  id: product.id,
                  nombre: product.name,
                  slug: product.slug,
                  precio: Number(product.price),
                  stock: product.stock,
                  imagen: product.images[0]?.url || null,
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
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="relative aspect-square bg-gray-200">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
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
                        {product.name}
                      </h3>
                      <p className="text-indigo-600 font-bold mt-1">
                        {Number(product.price).toFixed(2)} €
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
