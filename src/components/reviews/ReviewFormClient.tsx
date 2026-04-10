"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ReviewForm } from "@/components/reviews/ReviewForm";

interface ReviewFormClientProps {
  productId: string;
  productName: string;
}

export function ReviewFormClient({
  productId,
  productName,
}: ReviewFormClientProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: {
    rating: number;
    title: string;
    comment: string;
  }) => {
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitted(true);
        // Refresh the page to show the new review
        window.location.reload();
      } else {
        setError(result.error || "Error al enviar la reseña");
        throw new Error(result.error || "Error al enviar la reseña");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      throw err;
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
        <p className="text-gray-900 font-medium">¡Gracias por tu reseña!</p>
        <p className="text-sm text-gray-500">
          Tu reseña será revisada y publicada pronto.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      <ReviewForm productName={productName} onSubmit={handleSubmit} />
    </>
  );
}
