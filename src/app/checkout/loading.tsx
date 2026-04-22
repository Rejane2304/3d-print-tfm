/**
 * Checkout Loading State
 * Loading state para el proceso de checkout
 */
import { SkeletonCard, SkeletonText } from '@/components/ui/SkeletonCard';

export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress skeleton */}
      <div className="mb-8">
        <div className="flex justify-between max-w-2xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main checkout form skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-12 bg-gray-200 rounded animate-pulse ${i > 3 ? 'md:col-span-2' : ''}`} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <SkeletonText lines={3} />
          </div>
        </div>

        {/* Order summary skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-16 w-16 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
            <hr className="border-gray-200" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse mt-2" />
            </div>
            <div className="h-12 bg-gray-200 rounded animate-pulse mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
