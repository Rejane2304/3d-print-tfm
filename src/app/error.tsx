'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log detailed error for debugging
    console.error('Error boundary caught:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Algo salió mal</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Error: {error.message || 'Error desconocido'}</p>
          {error.digest && <p className="mt-1 text-center text-xs text-gray-400">Digest: {error.digest}</p>}
        </div>
        <div className="flex justify-center">
          <button
            onClick={reset}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
