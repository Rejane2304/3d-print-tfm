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
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { StarRating } from '@/components/ui/StarRating';
import { ReviewFormClient } from '@/components/reviews/ReviewFormClient';
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

// Extended product type with optional dimension fields
interface ProductWithDimensions {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | { toNumber(): number };
  previousPrice: number | { toNumber(): number } | null;
  stock: number;
  weight: number | { toNumber(): number } | null;
  material: string;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  printTime: number | null;
  images: Array<{ id: string; url: string; altText?: string | null }>;
  category: { name: string } | null;
}

async function getProduct(slug: string): Promise<{ product: ProductWithDimensions; related: unknown[]; reviews: unknown[]; reviewStats: unknown } | null> {
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
  const translatedProduct: ProductWithDimensions = {
    id: product.id,
    slug: product.slug,
    name: translateProductName(product.slug),
    description: translateProductDescription(product.slug),
    price: product.price,
    previousPrice: product.previousPrice,
    stock: product.stock,
    weight: product.weight,
    material: product.material,
    widthCm: product.widthCm,
    heightCm: product.heightCm,
    depthCm: product.depthCm,
    printTime: product.printTime,
    images: product.images.map(img => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
    })),
    category: product.category
      ? {
          name: translateCategoryName(product.category.slug),
        }
      : null,
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

  // Obtener reseñas aprobadas
  const reviews = await prisma.review.findMany({
    where: {
      productId: product.id,
      isApproved: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  // Formatear reseñas
  const formattedReviews = reviews.map((review) => ({
    id: review.id,
    usuarioNombre: review.user.name,
    puntuacion: review.rating,
    titulo: review.title,
    comentario: review.comment,
    verificado: review.isVerified,
    creadoEn: review.createdAt.toISOString(),
  }));

  // Calcular estadísticas
  const allReviews = await prisma.review.findMany({
    where: {
      productId: product.id,
      isApproved: true,
    },
    select: {
      rating: true,
    },
  });

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;
  
  allReviews.forEach((review) => {
    ratingCounts[review.rating as 1 | 2 | 3 | 4 | 5]++;
    totalRating += review.rating;
  });

  const totalCount = allReviews.length;
  const averageRating = totalCount > 0 ? totalRating / totalCount : 0;

  return { 
    product: translatedProduct, 
    related: translatedRelated,
    reviews: formattedReviews,
    reviewStats: {
      promedio: Number(averageRating.toFixed(1)),
      total: totalCount,
      distribucion: ratingCounts,
    }
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  // Get session to check if user is admin or logged in
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.rol === 'ADMIN';
  const isLoggedIn = !!session?.user;

  const data = await getProduct(params.slug);

  if (!data) {
    notFound();
  }

  const { product, reviews, reviewStats } = data;
  
  return (
    <div data-testid="product-detail" className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-6 sm:py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-4 sm:mb-6 text-sm text-gray-600 overflow-hidden">
          <div className="flex items-center flex-wrap gap-1">
            <Link href="/" className="hover:text-indigo-600 whitespace-nowrap">Inicio</Link>
            <span className="mx-1">/</span>
            <Link href="/products" className="hover:text-indigo-600 whitespace-nowrap">Productos</Link>
            <span className="mx-1">/</span>
            <span className="text-gray-900 truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
          </div>
        </nav>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Imágenes del Producto - Galería Interactiva */}
          <ProductImageGallery images={product.images} productName={product.name} />
          
          {/* Información del Producto */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-4">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  {product.category?.name}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {product.material}
                </span>
              </div>
            </div>
            
            {/* Precio */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl sm:text-4xl font-bold text-indigo-600">
                {Number(product.price).toFixed(2)} €
              </span>
              {product.previousPrice && (
                <span className="text-lg sm:text-xl text-gray-500 line-through">
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
              <h3 className="text-base sm:text-lg font-semibold mb-2">Descripción</h3>
              <p className="text-sm sm:text-base text-gray-600">
                {product.description}
              </p>
            </div>

            {/* Rating Summary */}
            {(reviewStats as { total: number }).total > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {(reviewStats as { promedio: number }).promedio}
                    </p>
                    <StarRating 
                      rating={(reviewStats as { promedio: number }).promedio} 
                      size="sm" 
                    />
                  </div>
                  <div className="border-l-0 sm:border-l pl-0 sm:pl-4">
                    <p className="text-sm text-gray-600">
                      {(reviewStats as { total: number }).total} reseñas
                    </p>
                    <Link 
                      href="#reviews" 
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Ver todas las reseñas
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Detalles */}
            {(product.widthCm || product.heightCm || product.depthCm || product.weight || (isAdmin && product.printTime)) && (
              <div className="border-t pt-4 sm:pt-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Especificaciones</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                  {(product.widthCm || product.heightCm || product.depthCm) && (
                    <>
                      <dt className="text-gray-600">Dimensiones:</dt>
                      <dd className="font-medium">
                        {[product.widthCm, product.heightCm, product.depthCm]
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
            <div className="border-t pt-4 sm:pt-6 space-y-3 sm:space-y-4">
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

        {/* Sección de Reseñas */}
        <div id="reviews" className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
            Reseñas de Clientes
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Reviews List */}
            <div className="lg:col-span-2">
              <ReviewsList 
                reviews={reviews as []}
                estadisticas={reviewStats as { promedio: number; total: number; distribucion: Record<number, number> }}
                paginacion={{ 
                  pagina: 1, 
                  porPagina: 10, 
                  totalPaginas: Math.ceil(((reviewStats as { total: number })?.total || 0) / 10),
                  total: (reviewStats as { total: number })?.total || 0
                }}
              />
            </div>

            {/* Review Form */}
            {isLoggedIn ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 h-fit">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Escribe una reseña
                </h3>
                <ReviewFormClient 
                  productId={product.id} 
                  productName={product.name}
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 h-fit">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Escribe una reseña
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Inicia sesión para dejar una reseña sobre este producto.
                </p>
                <Link
                  href={`/login?callbackUrl=/products/${product.slug}`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
