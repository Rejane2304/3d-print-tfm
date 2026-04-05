'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedImage = images[selectedIndex] || images[0];

  // Navigate to next image
  const nextImage = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Navigate to previous image
  const prevImage = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Open modal
  const openModal = () => setIsModalOpen(true);

  // Close modal
  const closeModal = () => setIsModalOpen(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-full text-gray-400">
          Sin imagen
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image - Clickable */}
        <div 
          className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-zoom-in group"
          onClick={openModal}
        >
          <Image
            src={selectedImage.url}
            alt={selectedImage.altText || productName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
          />
          {/* Zoom icon overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square bg-gray-200 rounded-md overflow-hidden transition-all ${
                  selectedIndex === index 
                    ? 'ring-2 ring-indigo-600 ring-offset-2' 
                    : 'hover:ring-2 hover:ring-indigo-400 hover:ring-offset-2'
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.altText || `${productName} - imagen ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 25vw, (max-width: 1200px) 15vw, 12vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal/Lightbox */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeModal}
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2 z-10"
            aria-label="Cerrar galeria"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 text-white text-sm">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Navigation - Previous */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors p-2 hover:bg-white/10 rounded-full"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          {/* Main image in modal */}
          <div 
            className="relative w-full h-full max-w-7xl max-h-screen mx-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-h-[90vh]">
              <Image
                src={selectedImage.url}
                alt={selectedImage.altText || productName}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Navigation - Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors p-2 hover:bg-white/10 rounded-full"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}

          {/* Thumbnails at bottom */}
          {images.length > 1 && (
            <div 
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 rounded-lg overflow-x-auto max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative w-16 h-16 flex-shrink-0 bg-gray-800 rounded overflow-hidden transition-all ${
                    selectedIndex === index 
                      ? 'ring-2 ring-white' 
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`Miniatura ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-sm hidden sm:block">
            Usa ← → para navegar • ESC para cerrar • Click fuera para cerrar
          </div>
        </div>
      )}
    </>
  );
}
