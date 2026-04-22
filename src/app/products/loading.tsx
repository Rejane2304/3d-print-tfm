/**
 * Products Page Loading State
 * Loading state para el catálogo de productos
 */
import { SkeletonCards, SkeletonText } from '@/components/ui/SkeletonCard';

export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
        <SkeletonText lines={2} />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-4 mb-6">
        <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
      </div>

      {/* Products grid skeleton */}
      <SkeletonCards count={12} />

      {/* Pagination skeleton */}
      <div className="mt-8 flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
