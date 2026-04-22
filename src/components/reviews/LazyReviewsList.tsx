/**
 * LazyReviewsList Component
 * Wrapper cliente para lazy loading de ReviewsList en página de producto
 */

'use client';

import dynamic from 'next/dynamic';
import { ReviewsListSkeleton } from '@/components/ui/skeletons/LazyLoadSkeletons';

// Importar el tipo desde ReviewsList
interface Review {
  id: string;
  usuarioNombre: string;
  puntuacion: number;
  titulo: string;
  comentario: string;
  verificado: boolean;
  creadoEn: string;
}

interface ReviewStats {
  promedio: number;
  total: number;
  distribucion: Record<number, number>;
}

interface Pagination {
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  total: number;
}

interface LazyReviewsListProps {
  reviews: Review[];
  estadisticas: ReviewStats;
  paginacion: Pagination;
}

// Lazy load del componente ReviewsList (solo en cliente)
const ReviewsList = dynamic(() => import('@/components/reviews/ReviewsList').then(m => ({ default: m.ReviewsList })), {
  loading: () => <ReviewsListSkeleton />,
  ssr: false,
});

export function LazyReviewsList({ reviews, estadisticas, paginacion }: LazyReviewsListProps): React.ReactElement {
  return <ReviewsList reviews={reviews} estadisticas={estadisticas} paginacion={paginacion} />;
}
