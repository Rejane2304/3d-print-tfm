/**
 * Página de Detalle de Producto
 * Muestra información completa de un producto traducida al español
 * Responsive: mobile → 4K
 */
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';

import Link from 'next/link';
import AddToCartButton from '@/components/products/AddToCartButton';
import ProductImageGallery from '@/components/products/ProductImageGallery';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import {
  translateProductName,
  translateProductDescription,
  translateCategoryName,
} from '@/lib/i18n';

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
      category: true,
    },
  });

  if (!product || !product.isActive) {
    return null;
  }

  // Traducir datos del producto
  const translatedProduct = {
    ...product,
    name: translateProductName(product.slug),
    description: translateProductDescription(product.slug),
    category: product.category
      ? {
          ...product.category,
          name: translateCategoryName(product.category.slug),
        }
      : product.category,
  };

  // Obtener productos relacionados
  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.categoryId,
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

  // Traducir productos relacionados
  const translatedRelated = related.map((p) => ({
    ...p,
    name: translateProductName(p.slug),
  }));

  return { product: translatedProduct, related: translatedRelated };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  // Get session to check if user is admin
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.rol === 'ADMIN';

  const data = await getProduct(params.slug);

  if (!data) {
    notFound();
  }

  const { product } = data;
  
  return (
    <div data-testid="product-detail" className="min-h-screen bg-gray-50">
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
          {/* Imágenes del Producto - Galería Interactiva */}
          <ProductImageGallery images={product.images} productName={product.name} />
          
          {/* Información del Producto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  {product.category?.name}
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
            {((product as any).widthCm || (product as any).heightCm || (product as any).depthCm || product.weight || (isAdmin && (product as any).printTime)) && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Especificaciones</h3>
                <dl className="grid grid-cols-2 gap-4">
                  {((product as any).widthCm || (product as any).heightCm || (product as any).depthCm) && (
                    <>
                      <dt className="text-gray-600">Dimensiones:</dt>
                      <dd className="font-medium">
                        {[(product as any).widthCm, (product as any).heightCm, (product as any).depthCm]
                          .filter(Boolean)
                          .join(' x ')} cm
                      </dd>
                    </>
                  )}
                  {product.weight && (
                    <>
                      <dt className="text-gray-600">Peso:</dt>
                      <dd className="font-medium">{Number(product.weight)} g</dd>
                    </>
                  )}
                  {/* Tiempo de impresión solo visible para admins */}
                  {isAdmin && product.printTime && (
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
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: Number(product.price),
                  stock: product.stock,
                  image: product.images[0]?.url || null,
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
        
      </div>
    </div>
  );
}
