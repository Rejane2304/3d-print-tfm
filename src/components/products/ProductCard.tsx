/**
 * ProductCard Component
 * Product card for the catalog with rating display
 */
import Link from 'next/link';
import Image from 'next/image';
import { Decimal } from '@prisma/client/runtime/library';
import { StarRating } from '@/components/ui/StarRating';

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number | Decimal;
  stock: number;
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

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images?.find(img => img.isMain) || product.images?.[0];
  const price = Number(product.price);
  const hasRating = product._avgRating !== undefined && product._reviewCount !== undefined && product._reviewCount > 0;

  return (
    <Link
      href={`/products/${product.slug}`} data-testid="product-card"
      className="group bg-white shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
    >
      <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Sin imagen
          </div>
        )}

        {/* Low stock badge */}
        {product.stock > 0 && product.stock < 5 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-sm">
            ¡Últimas unidades!
          </span>
        )}

        {/* Out of stock badge */}
        {product.stock === 0 && (
          <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded shadow-sm">
            Sin stock
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 
          className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 text-sm sm:text-base leading-tight" 
          data-testid="product-name"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Rating stars */}
        {hasRating && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StarRating rating={product._avgRating || 0} size="sm" />
            <span className="text-xs text-gray-500">({product._reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <span 
            className="text-lg sm:text-xl font-bold text-indigo-600 whitespace-nowrap" 
            data-testid="product-price"
          >
            {price.toFixed(2)} €
          </span>

          <span 
            className={`text-xs sm:text-sm whitespace-nowrap ${
              product.stock > 0 ? 'text-green-600' : 'text-red-600'
            }`} 
            data-testid="product-stock"
          >
            {product.stock > 0 ? '✅ En stock' : 'Sin stock'}
          </span>
        </div>
      </div>
    </Link>
  );
}
