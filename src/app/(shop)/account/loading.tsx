/**
 * Account Page Loading State
 * Loading state para el área de cliente
 */
import { SkeletonCard, SkeletonText } from '@/components/ui/SkeletonCard';

export default function AccountLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar skeleton */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            <hr className="border-gray-200" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
            <SkeletonText lines={4} />

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
