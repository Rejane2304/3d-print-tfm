'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: Readonly<ProductImageGalleryProps>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedImage = images[selectedIndex] || images[0];

  // Navigate to next image
  const nextImage = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  // Navigate to previous image
  const prevImage = useCallback(() => {
    setSelectedIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Open modal
  const openModal = () => setIsModalOpen(true);

  // Close modal
  const closeModal = () => setIsModalOpen(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) {
        return;
      }

      if (e.key === 'Escape') {
        closeModal();
      }
      if (e.key === 'ArrowRight') {
        nextImage();
      }
      if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, nextImage, prevImage]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square bg-gray-200 overflow-hidden">
        <div className="flex items-center justify-center h-full text-gray-400">Sin imagen</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Main Image - Clickable - Tamaño grande */}
        <button
          type="button"
          className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] bg-gray-100 overflow-hidden cursor-zoom-in group rounded-xl p-0 border-0 w-full"
          onClick={openModal}
          aria-label="Abrir galería de imágenes"
          style={{ appearance: 'none' }}
        >
          <Image
            src={selectedImage.url}
            alt={selectedImage.altText || productName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105 bg-gray-50"
            priority
          />
          {/* Zoom icon overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </button>

        {/* Thumbnails - Horizontal scroll on mobile - Tamaño pequeño */}
        {images.length > 1 && (
          <div className="overflow-x-auto pb-2 pt-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent mt-2">
            <div className="flex gap-3 min-w-min">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 overflow-hidden transition-all rounded-lg ${
                    selectedIndex === index
                      ? 'ring-2 ring-indigo-600 ring-offset-2'
                      : 'hover:ring-2 hover:ring-indigo-400 hover:ring-offset-2'
                  }`}
                  aria-label={`Ver imagen ${index + 1}`}
                  aria-current={selectedIndex === index ? 'true' : undefined}
                >
                  <Image
                    src={image.url}
                    alt={image.altText || `${productName} - imagen ${index + 1}`}
                    fill
                    sizes="96px"
                    className="object-contain bg-gray-50"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal/Lightbox */}
      {isModalOpen && (
        <dialog
          open
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 border-0 m-0"
          aria-modal="true"
          style={{ maxWidth: '100vw', maxHeight: '100vh' }}
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:text-gray-300 transition-colors p-2 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Cerrar galeria"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Image counter */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Navigation - Previous */}
          {images.length > 1 && (
            <button
              onClick={e => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors p-2 sm:p-3 hover:bg-white/10 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-6 h-6 sm:w-10 sm:h-10" />
            </button>
          )}

          {/* Main image in modal */}
          <section
            aria-label="Imagen ampliada"
            className="relative w-full h-full max-w-7xl max-h-screen mx-4 flex items-center justify-center px-12 sm:px-16"
          >
            <div className="relative w-full h-full max-h-[85vh] sm:max-h-[90vh]">
              <Image
                src={selectedImage.url}
                alt={selectedImage.altText || productName}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          </section>

          {/* Navigation - Next */}
          {images.length > 1 && (
            <button
              onClick={e => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors p-2 sm:p-3 hover:bg-white/10 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="w-6 h-6 sm:w-10 sm:h-10" />
            </button>
          )}

          {/* Thumbnails at bottom */}
          {images.length > 1 && (
            <section
              aria-label="Miniaturas de la galería"
              className="absolute bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 rounded-lg overflow-x-auto max-w-[calc(100vw-32px)] scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent"
            >
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-gray-800 rounded overflow-hidden transition-all ${
                    selectedIndex === index ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Ir a imagen ${index + 1}`}
                  aria-current={selectedIndex === index ? 'true' : undefined}
                >
                  <Image src={image.url} alt={`Miniatura ${index + 1}`} fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </section>
          )}

          {/* Instructions - Hidden on small screens */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs sm:text-sm hidden sm:block">
            Usa ← → para navegar • ESC para cerrar • Click fuera para cerrar
          </div>
        </dialog>
      )}
    </>
  );
}
