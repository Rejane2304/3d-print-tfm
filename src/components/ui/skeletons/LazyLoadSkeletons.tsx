/**
 * Skeleton Components for Lazy Loading
 * Loading states para componentes cargados dinámicamente
 */

import { Loader2 } from 'lucide-react';

/**
 * Skeleton para ReviewsList
 */
export function ReviewsListSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Stats Header Skeleton */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="h-10 w-16 bg-gray-200 animate-pulse rounded mb-2" />
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-1" />
              <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 bg-gray-200 animate-pulse rounded" />
                <div className="flex-1 h-2 bg-gray-200 animate-pulse rounded-full" />
                <div className="h-3 w-6 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="h-5 w-48 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded mb-1" />
            <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded mb-4" />
            <div className="flex items-center gap-4">
              <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-3 bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para Productos Relacionados
 */
export function RelatedProductsSkeleton(): React.ReactElement {
  return (
    <div className="py-8">
      <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <div className="p-4">
              <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para componentes de Admin (Analytics)
 */
export function AdminAnalyticsSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mb-1" />
                <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="h-12 w-12 bg-gray-200 animate-pulse rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-5 w-48 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-1" />
                  <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic Loading State con spinner
 */
export function GenericLoadingState({ message = 'Cargando...' }: { message?: string }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

/**
 * Skeleton para PayPal Buttons
 */
export function PayPalButtonsSkeleton(): React.ReactElement {
  return (
    <div className="py-4 px-4">
      <div className="h-12 w-full bg-blue-100 animate-pulse rounded mb-3" />
      <div className="h-12 w-full bg-blue-100 animate-pulse rounded" />
      <p className="text-center text-sm text-gray-500 mt-3">Cargando PayPal...</p>
    </div>
  );
}
