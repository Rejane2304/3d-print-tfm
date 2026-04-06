/**
 * ProductCard Component
 * Product card for the catalog
 */
import Link from 'next/link';
import Image from 'next/image';
import { Decimal } from '@prisma/client/runtime/library';

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
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images?.find(img => img.isMain) || product.images?.[0];
  const price = Number(product.price);

  return (
    <Link
      href={`/products/${product.slug}`} data-testid="product-card"
      className="group bg-white shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative w-full aspect-square bg-gray-200">
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No image
          </div>
        )}

        {/* Low stock badge */}
        {product.stock > 0 && product.stock < 5 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            ¡Últimas unidades!
          </span>
        )}

        {/* Out of stock badge */}
        {product.stock === 0 && (
          <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded">
            Agotado
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2" data-testid="product-name">
          {product.name}
        </h3>

        {product.shortDescription && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-2" data-testid="product-description">
            {product.shortDescription}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600" data-testid="product-price">
            {price.toFixed(2)} €
          </span>

          <span className={`text-sm ${
            product.stock > 0 ? 'text-green-600' : 'text-red-600'
          }`} data-testid="product-stock">
            {product.stock > 0 ? '✅ En stock' : 'Agotado'}
          </span>
        </div>
      </div>
    </Link>
  );
}
