/**
 * Pagination Component
 * Componente de paginación para el catálogo
 */
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: Readonly<PaginationProps>) {
  const currentSearchParams = useSearchParams();

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.set('page', page.toString());
    return `/products?${params.toString()}`;
  };

  // Generar array de páginas a mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Páginas alrededor de la actual
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Siempre mostrar última página
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Paginación">
      {/* Botón Anterior */}
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-md border border-gray-200 text-gray-400 cursor-not-allowed">← Anterior</span>
      )}

      {/* Números de página */}
      <div className="flex gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            // Usar una key única basada en la posición y el valor anterior/siguiente
            const prev = pageNumbers[index - 1] ?? 'start';
            const next = pageNumbers[index + 1] ?? 'end';
            return (
              <span key={`ellipsis-${prev}-${next}`} className="px-3 py-2 text-gray-500">
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;

          return (
            <Link
              key={page}
              href={buildPageUrl(page as number)}
              className={`px-3 py-2 rounded-md transition-colors ${
                isCurrent ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
        >
          Siguiente →
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-md border border-gray-200 text-gray-400 cursor-not-allowed">
          Siguiente →
        </span>
      )}
    </nav>
  );
}
