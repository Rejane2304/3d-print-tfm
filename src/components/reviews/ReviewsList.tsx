/**
 * ReviewsList Component
 * Displays reviews with statistics and filtering options
 */
'use client';

import { useState } from 'react';
import { StarRating } from '@/components/ui/StarRating';
import { CheckCircle2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface Review {
  id: string;
  usuarioNombre: string;
  puntuacion: number;
  titulo: string;
  comentario: string;
  verificado: boolean;
  creadoEn: string;
}

interface ReviewsListProps {
  reviews: Review[];
  estadisticas: {
    promedio: number;
    total: number;
    distribucion: Record<number, number>;
  };
  paginacion: {
    pagina: number;
    porPagina: number;
    totalPaginas: number;
    total: number;
  };
  onSortChange?: (sortBy: string) => void;
  onPageChange?: (page: number) => void;
}

export function ReviewsList({
  reviews,
  estadisticas,
  paginacion,
  onSortChange,
  onPageChange,
}: Readonly<ReviewsListProps>) {
  const [sortBy, setSortBy] = useState('newest');

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange?.(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPercentage = (count: number) => {
    if (estadisticas.total === 0) {
      return 0;
    }
    return Math.round((count / estadisticas.total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Header */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Rating */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{estadisticas.promedio.toFixed(1)}</p>
              <StarRating rating={estadisticas.promedio} size="md" />
              <p className="text-sm text-gray-500 mt-1">{estadisticas.total} reseñas</p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map(stars => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-3">{stars}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{
                      width: `${getPercentage(estadisticas.distribucion[stars])}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">{estadisticas.distribucion[stars]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={e => handleSortChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="highest">Mayor puntuación</option>
            <option value="lowest">Menor puntuación</option>
          </select>
        </div>
      </div>

      {/* Language Notice */}
      {reviews.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-700">Las reseñas se muestran en el idioma original de cada autor</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No hay reseñas todavía</p>
            <p className="text-sm text-gray-400 mt-1">Sé el primero en dejar una reseña</p>
          </div>
        ) : (
          reviews.map(review => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={review.puntuacion} size="sm" />
                    {review.verificado && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Verificado
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-semibold text-gray-900 mb-2">{review.titulo}</h4>

                  {/* Comment */}
                  <p className="text-gray-600 text-sm leading-relaxed">{review.comentario}</p>

                  {/* Footer */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>{review.usuarioNombre}</span>
                    <span>•</span>
                    <span>{formatDate(review.creadoEn)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {paginacion.totalPaginas > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando {(paginacion.pagina - 1) * paginacion.porPagina + 1} a{' '}
            {Math.min(paginacion.pagina * paginacion.porPagina, paginacion.total)} de {paginacion.total} reseñas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(paginacion.pagina - 1)}
              disabled={paginacion.pagina === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-700">
              Página {paginacion.pagina} de {paginacion.totalPaginas}
            </span>
            <button
              onClick={() => onPageChange?.(paginacion.pagina + 1)}
              disabled={paginacion.pagina === paginacion.totalPaginas}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewsList;
