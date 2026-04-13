/**
 * ReviewForm Component
 * Form for creating or editing a product review
 */
"use client";

import React, { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { AlertCircle, Loader2 } from "lucide-react";

interface ReviewFormProps {
  productName: string;
  onSubmit: (data: {
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;
  onCancel?: () => void;
  initialData?: {
    rating: number;
    title: string;
    comment: string;
  };
  mode?: "create" | "edit";
}

export function ReviewForm({
  productName,
  onSubmit,
  onCancel,
  initialData,
  mode = "create",
}: Readonly<ReviewFormProps>) {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [title, setTitle] = useState(initialData?.title || "");
  const [comment, setComment] = useState(initialData?.comment || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (rating === 0) {
      setError("Por favor selecciona una puntuación");
      return;
    }

    if (title.trim().length < 3) {
      setError("El título debe tener al menos 3 caracteres");
      return;
    }

    if (comment.trim().length < 10) {
      setError("El comentario debe tener al menos 10 caracteres");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ rating, title, comment });
      // Reset form on success (only for create mode)
      if (mode === "create") {
        setRating(0);
        setTitle("");
        setComment("");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al enviar la reseña",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product name */}
      <div>
        <p className="text-sm text-gray-500">
          {mode === "create" ? "Reseñando:" : "Editando reseña de:"}
        </p>
        <p className="font-medium text-gray-900">{productName}</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Rating */}
      <div>
        <label htmlFor="review-rating" className="block text-sm font-medium text-gray-700 mb-2">
          Puntuación *
        </label>
        <input type="hidden" id="review-rating" value={rating} readOnly />
        <StarRating
          rating={rating}
          mode="interactive"
          size="lg"
          onRatingChange={setRating}
        />
        <p className="text-sm text-gray-500 mt-1">
          {rating > 0
            ? `${rating} de 5 estrellas`
            : "Selecciona una puntuación"}
        </p>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Título *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resume tu experiencia"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-1">
          {title.length}/200 caracteres
        </p>
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Comentario *
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comparte detalles sobre tu experiencia con el producto"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          maxLength={2000}
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length}/2000 caracteres
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Publicar reseña" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

export default ReviewForm;
