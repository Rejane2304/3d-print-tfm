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
import { formatPriceWithVat } from '@/lib/pricing';

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
    formatPriceWithVat(product.price),
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

          {/* Stock Badge */}
          <div
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
              stockStatus.urgent ? 'bg-white/90' : 'bg-white/70'
            } ${stockStatus.className}`}
            aria-label={stockStatus.text}
          >
            {stockStatus.text}
          </div>

          {/* Featured Badge - if applicable */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
              <span className="bg-gray-900/80 text-white px-4 py-2 rounded-full text-sm font-medium">Agotado</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-300 leading-tight">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">
            {product.shortDescription || product.description || 'Sin descripción'}
          </p>

          {/* Material Tag */}
          {product.material && (
            <div className="mb-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                {product.material}
              </span>
            </div>
          )}

          {/* Rating */}
          {hasRating && (
            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={product._avgRating || 0} size="sm" />
              <span className="text-sm text-gray-600">({product._reviewCount})</span>
            </div>
          )}

          {/* Price Section */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-indigo-600">{formatPriceWithVat(product.price)}</span>
                <span className="block text-xs text-gray-500 mt-1">IVA incluido</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
