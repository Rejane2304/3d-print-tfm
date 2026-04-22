/**
 * StarRating Component
 * Displays or allows selection of star ratings
 *
 * Modes:
 * - display: Shows static stars with proper ARIA labeling
 * - interactive: Allows clicking to select rating with keyboard support
 *
 * Accessibility:
 * - Uses role="img" with aria-label for screen readers
 * - Interactive mode uses proper button elements
 * - Keyboard navigation with arrow keys
 * - Announces rating changes to screen readers
 */
'use client';

import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { useAnnouncer } from '@/hooks/useAnnouncer';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  mode?: 'display' | 'interactive';
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
  /** Accessible label for the rating (e.g., "Calificación del producto") */
  ariaLabel?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  mode = 'display',
  onRatingChange,
  showValue = false,
  className = '',
  ariaLabel = 'Calificación',
}: Readonly<StarRatingProps>) {
  const [hoverRating, setHoverRating] = useState(0);
  const { announce } = useAnnouncer();

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  const handleClick = useCallback(
    (index: number) => {
      if (mode === 'interactive' && onRatingChange) {
        onRatingChange(index);
        announce(`Has seleccionado ${index} de ${maxRating} estrellas`, 'polite');
      }
    },
    [mode, onRatingChange, maxRating, announce],
  );

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (mode === 'interactive') {
        setHoverRating(index);
      }
    },
    [mode],
  );

  const handleMouseLeave = useCallback(() => {
    if (mode === 'interactive') {
      setHoverRating(0);
    }
  }, [mode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (mode !== 'interactive') return;

      let newIndex = currentIndex;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.min(currentIndex + 1, maxRating);
          if (newIndex !== currentIndex && onRatingChange) {
            onRatingChange(newIndex);
            announce(`${newIndex} de ${maxRating} estrellas`, 'polite');
          }
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.max(currentIndex - 1, 1);
          if (newIndex !== currentIndex && onRatingChange) {
            onRatingChange(newIndex);
            announce(`${newIndex} de ${maxRating} estrellas`, 'polite');
          }
          break;
        case 'Home':
          e.preventDefault();
          if (onRatingChange) {
            onRatingChange(1);
            announce(`1 de ${maxRating} estrellas`, 'polite');
          }
          break;
        case 'End':
          e.preventDefault();
          if (onRatingChange) {
            onRatingChange(maxRating);
            announce(`${maxRating} de ${maxRating} estrellas`, 'polite');
          }
          break;
      }
    },
    [mode, maxRating, onRatingChange, announce],
  );

  const displayRating = mode === 'interactive' && hoverRating > 0 ? hoverRating : rating;

  // Generate accessible label
  const ratingLabel =
    rating > 0 ? `${ariaLabel}: ${rating.toFixed(1)} de ${maxRating} estrellas` : `${ariaLabel}: Sin calificación`;

  return (
    <div className={`flex items-center gap-1 ${className}`} role="img" aria-label={ratingLabel}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map(starIndex => {
          const isFilled = starIndex <= displayRating;

          if (mode === 'interactive') {
            return (
              <button
                key={`star-${starIndex}`}
                type="button"
                onClick={() => handleClick(starIndex)}
                onMouseEnter={() => handleMouseEnter(starIndex)}
                onMouseLeave={handleMouseLeave}
                onKeyDown={e => handleKeyDown(e, starIndex)}
                className="p-0.5 cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded"
                aria-label={`${starIndex} estrellas`}
                aria-pressed={starIndex <= rating}
                tabIndex={0}
              >
                <Star
                  className={`${sizeClasses[size]} ${
                    isFilled ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          }

          return (
            <span key={`star-${starIndex}`} className="p-0.5" aria-hidden="true">
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                }`}
              />
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-1" aria-hidden="true">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default StarRating;
