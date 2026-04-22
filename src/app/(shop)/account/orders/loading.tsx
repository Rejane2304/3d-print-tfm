/**
 * Account Orders Loading State
 * Loading state para la lista de pedidos del cliente
 */
import { SkeletonTable } from '@/components/ui/SkeletonCard';

export default function AccountOrdersLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
      </div>

      {/* Orders list skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 bg-gray-200 rounded w-20" />
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-center gap-2 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
