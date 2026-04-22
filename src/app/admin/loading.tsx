/**
 * Admin Dashboard Loading State
 * Loading state para el panel de administración
 */
import { SkeletonTable } from '@/components/ui/SkeletonCard';

export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Page title skeleton */}
      <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Charts section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Recent activity table skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6 animate-pulse" />
        <SkeletonTable rows={5} cols={5} />
      </div>
    </div>
  );
}
