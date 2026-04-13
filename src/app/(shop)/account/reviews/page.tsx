/**
 * Página de Mis Reseñas - Usuario
 * Gestiona las reseñas del usuario autenticado
 * Responsive: mobile → 4K
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Edit2, Loader2, Package, Star, Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  };
}

export default function MyReviewsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/reviews');
      return;
    }

    if (status === 'authenticated') {
      loadReviews();
    }
  }, [status, router]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/reviews');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar reseñas');
      }

      setReviews(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setReviewToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewToDelete));
      } else {
        const data = await response.json();
        setError(data.error || 'Error al eliminar reseña');
      }
    } catch {
      setError('Error al eliminar reseña');
    } finally {
      setDeleteModalOpen(false);
      setReviewToDelete(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-3 w-3 sm:h-4 sm:w-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mis Reseñas</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'} escritas
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border-b border-red-200 flex items-center gap-2 sm:gap-3">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="divide-y divide-gray-200">
        {reviews.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No has escrito reseñas aún</h3>
            <p className="text-sm text-gray-500 mb-4 sm:mb-6">
              Comparte tu opinión sobre los productos que has comprado
            </p>
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Ver mis pedidos
            </Link>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                {/* Product Image */}
                <Link href={`/products/${review.product.slug}`}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {review.product.images?.[0] ? (
                      <Image
                        src={review.product.images[0].url}
                        alt={review.product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${review.product.slug}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 text-sm sm:text-base block truncate"
                      >
                        {review.product.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-xs sm:text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link
                        href={`/products/${review.product.slug}#review`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar reseña"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar reseña"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-700 mt-2 text-sm sm:text-base">{review.comment}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setReviewToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar reseña?"
        description="Esta acción no se puede deshacer. Tu reseña se eliminará permanentemente."
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
