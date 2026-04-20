/**
 * StarRating Component
 * Displays or allows selection of star ratings
 *
 * Modes:
 * - display: Shows static stars
 * - interactive: Allows clicking to select rating
 */
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  mode?: 'display' | 'interactive';
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  mode = 'display',
  onRatingChange,
  showValue = false,
  className = '',
}: Readonly<StarRatingProps>) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  const handleClick = (index: number) => {
    if (mode === 'interactive' && onRatingChange) {
      onRatingChange(index);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (mode === 'interactive') {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (mode === 'interactive') {
      setHoverRating(0);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map(starIndex => {
          const displayRating = mode === 'interactive' && hoverRating > 0 ? hoverRating : rating;
          const isFilled = starIndex <= displayRating;

          return (
            <button
              key={`star-${starIndex}`}
              type="button"
              disabled={mode === 'display'}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              onMouseLeave={handleMouseLeave}
              className={`${mode === 'interactive' ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showValue && <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
}

export default StarRating;
