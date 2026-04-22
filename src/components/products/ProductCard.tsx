/**
 * ProductCard Component - Modern Design
 * Product card with premium style and smooth animations
 * Server Component - do not use event handlers
 *
 * Accessibility improvements:
 * - Semantic HTML with article element
 * - Descriptive alt text for images
 * - ARIA labels for interactive elements
 * - Proper heading hierarchy
 * - Stock status communicated clearly
 */
import Link from 'next/link';
import Image from 'next/image';
import type { Decimal } from '@prisma/client/runtime/library';
import { StarRating } from '@/components/ui/StarRating';
import { formatPrice } from '@/lib/pricing';

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number | Decimal;
  stock: number;
  material?: string;
  images: Array<{
    url: string;
    isMain: boolean;
  }>;
  _avgRating?: number;
  _reviewCount?: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: Readonly<ProductCardProps>) {
  const mainImage = product.images?.find(img => img.isMain) || product.images?.[0];
  const hasRating = product._avgRating !== undefined && product._reviewCount !== undefined && product._reviewCount > 0;

  // Generate descriptive alt text
  const imageAlt = mainImage
    ? `${product.name}${product.material ? ` - Material: ${product.material}` : ''}`
    : `Imagen no disponible para ${product.name}`;

  // Generate aria-label for the card link
  const cardAriaLabel = [
    product.name,
    formatPrice(product.price),
    product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado',
    hasRating ? `Calificación: ${product._avgRating?.toFixed(1)} de 5 estrellas` : null,
  ]
    .filter(Boolean)
    .join('. ');

  // Stock status text
  const getStockStatus = () => {
    if (product.stock === 0) return { text: 'Sin stock', className: 'text-red-600', urgent: true };
    if (product.stock < 5)
      return { text: `¡Solo ${product.stock} unidades!`, className: 'text-orange-600', urgent: true };
    return { text: `${product.stock} unid. disponibles`, className: 'text-green-600', urgent: false };
  };

  const stockStatus = getStockStatus();

  return (
    <article
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 flex flex-col h-full"
      aria-label={cardAriaLabel}
    >
      <Link
        href={`/products/${product.slug}`}
        data-testid="product-card"
        className="flex flex-col h-full"
        aria-label={`Ver detalles de ${product.name}`}
      >
        {/* Image Container with Overlay */}
        <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <span className="text-sm">Sin imagen</span>
            </div>
          )}

          {/* Gradient Overlay on Hover */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.stock > 0 && product.stock < 5 && (
              <span
                className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md"
                role="status"
              >
                ¡Últimas unidades!
              </span>
            )}
            {product.stock === 0 && (
              <span
                className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md"
                role="status"
              >
                Agotado
              </span>
            )}
          </div>

          {/* Rating Badge */}
          {hasRating && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-md flex items-center gap-1">
              <span className="text-yellow-500" aria-hidden="true">
                ★
              </span>
              <span className="text-sm font-semibold text-gray-700">{product._avgRating?.toFixed(1)}</span>
              <span className="sr-only">{`Calificación: ${product._avgRating?.toFixed(1)} de 5 estrellas`}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          {/* Product Name */}
          <h3
            className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 text-base leading-tight"
            data-testid="product-name"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Divider */}
          <div
            className="w-12 h-0.5 bg-gray-200 mb-4 group-hover:bg-indigo-500 transition-colors group-hover:w-20"
            aria-hidden="true"
          />

          {/* Rating */}
          {hasRating && (
            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={product._avgRating || 0} size="sm" ariaLabel={`Calificación de ${product.name}`} />
              <span className="text-xs text-gray-400">({product._reviewCount})</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" aria-hidden="true" />

          {/* Price Section - Fixed at bottom */}
          <div className="pt-4 border-t border-gray-100 mt-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block mb-0.5">Precio</span>
                <span className="text-2xl font-bold text-gray-900" data-testid="product-price">
                  {formatPrice(product.price)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-400 block mb-0.5">Disponibilidad</span>
                <span
                  className={`text-sm font-medium ${stockStatus.className}`}
                  data-testid="product-stock"
                  role="status"
                  aria-live={stockStatus.urgent ? 'polite' : undefined}
                >
                  {stockStatus.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
