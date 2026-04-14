/**
 * Product Image Manager - Admin
 * Componente para gestionar imágenes de producto con:
 * - Drag & drop para reordenar
 * - Subir nuevas imágenes
 * - Reemplazar imágenes existentes
 * - Marcar/eliminar imágenes
 * - Cambiar imagen principal
 */
'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, X, Star, GripVertical, AlertCircle } from 'lucide-react';

export interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
  status: 'existing' | 'new' | 'deleted';
  file?: File;
  displayOrder: number;
}

interface SortableImageItemProps {
  image: ProductImage;
  index: number;
  onRemove: (id: string) => void;
  onSetMain: (id: string) => void;
  onReplace: (id: string, file: File) => void;
  disabled?: boolean;
}

function SortableImageItem({ image, index, onRemove, onSetMain, onReplace, disabled }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : image.status === 'deleted' ? 0.5 : 1,
  };

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplace(image.id, file);
    }
  };

  const isDeleted = image.status === 'deleted';
  const isNew = image.status === 'new';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square border-2 rounded-lg overflow-hidden group ${
        image.isMain
          ? 'border-indigo-500 ring-2 ring-indigo-200'
          : isDeleted
            ? 'border-red-300 bg-red-50'
            : isNew
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200'
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled || isDeleted}
        className="absolute top-1 left-1 z-10 p-1 bg-white/80 hover:bg-white rounded shadow-sm cursor-grab active:cursor-grabbing disabled:opacity-50 disabled:cursor-not-allowed"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="h-3 w-3 text-gray-600" />
      </button>

      {/* Status badge */}
      {isNew && (
        <span className="absolute top-1 right-8 z-10 px-1.5 py-0.5 bg-green-500 text-white text-[10px] rounded font-medium">
          Nuevo
        </span>
      )}
      {isDeleted && (
        <span className="absolute top-1 right-8 z-10 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded font-medium flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Borrar
        </span>
      )}

      {/* Main badge */}
      {image.isMain && !isDeleted && (
        <span className="absolute top-1 left-8 z-10 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded font-medium flex items-center gap-1">
          <Star className="h-3 w-3 fill-current" />
          Principal
        </span>
      )}

      {/* Image */}
      <Image
        src={image.url}
        alt={`Imagen ${index + 1}`}
        fill
        sizes="96px"
        className={`object-cover ${isDeleted ? 'grayscale' : ''}`}
      />

      {/* Overlay actions */}
      <div className="absolute inset-x-0 bottom-0 p-1 bg-black/50 flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Set main button */}
        {!image.isMain && !isDeleted && (
          <button
            type="button"
            onClick={() => onSetMain(image.id)}
            disabled={disabled}
            className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            title="Establecer como principal"
          >
            <Star className="h-3 w-3" />
          </button>
        )}

        {/* Replace button */}
        {!isDeleted && (
          <label className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50">
            <Upload className="h-3 w-3" />
            <input type="file" accept="image/*" onChange={handleReplace} disabled={disabled} className="hidden" />
          </label>
        )}

        {/* Remove/Restore button */}
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          disabled={disabled}
          className={`p-1.5 rounded ${
            isDeleted ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
          } disabled:opacity-50`}
          title={isDeleted ? 'Restaurar' : 'Eliminar'}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

interface ProductImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  disabled?: boolean;
}

export function ProductImageManager({ images, onChange, disabled }: ProductImageManagerProps) {
  const [uploading, setUploading] = useState(false);

  // Filter out deleted images for display
  const visibleImages = images.filter(img => img.status !== 'deleted');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = images.findIndex(img => img.id === active.id);
        const newIndex = images.findIndex(img => img.id === over.id);

        const reordered = arrayMove(images, oldIndex, newIndex);
        // Update displayOrder for all visible images
        const updated = reordered.map((img, idx) => ({
          ...img,
          displayOrder: img.status === 'deleted' ? img.displayOrder : idx,
        }));
        onChange(updated);
      }
    },
    [images, onChange],
  );

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const tempUrl = URL.createObjectURL(file);
      const isFirst = images.filter(i => i.status !== 'deleted').length === 0;

      const newImage: ProductImage = {
        id: `new-${Date.now()}`,
        url: tempUrl,
        isMain: isFirst,
        status: 'new',
        file,
        displayOrder: images.length,
      };

      onChange([...images, newImage]);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) return;

    if (image.status === 'deleted') {
      // Restore
      const restored = images.map(img => (img.id === id ? { ...img, status: 'existing' as const } : img));
      onChange(restored);
    } else if (image.status === 'new') {
      // Remove new image completely
      const filtered = images.filter(img => img.id !== id);
      // Reassign main if needed
      const visible = filtered.filter(i => i.status !== 'deleted');
      if (visible.length > 0 && !visible.some(i => i.isMain)) {
        filtered[filtered.findIndex(i => i.id === visible[0].id)].isMain = true;
      }
      onChange(filtered);
    } else {
      // Mark existing for deletion
      const marked = images.map(img => (img.id === id ? { ...img, status: 'deleted' as const } : img));
      // Reassign main if this was the main image
      if (image.isMain) {
        const visible = marked.filter(i => i.status !== 'deleted');
        if (visible.length > 0) {
          const firstVisibleIdx = marked.findIndex(i => i.id === visible[0].id);
          marked[firstVisibleIdx] = { ...marked[firstVisibleIdx], isMain: true };
        }
      }
      onChange(marked);
    }
  };

  const handleSetMain = (id: string) => {
    const updated = images.map(img => ({
      ...img,
      isMain: img.id === id,
    }));
    onChange(updated);
  };

  const handleReplace = async (id: string, file: File) => {
    const image = images.find(img => img.id === id);
    if (!image) return;

    const tempUrl = URL.createObjectURL(file);

    const updated = images.map(img =>
      img.id === id
        ? {
            ...img,
            url: tempUrl,
            status: 'new' as const,
            file,
          }
        : img,
    );
    onChange(updated);
  };

  const hasImages = visibleImages.length > 0;
  const mainImage = visibleImages.find(img => img.isMain) || visibleImages[0];

  return (
    <div className="space-y-4">
      {/* Main Image - Large */}
      {mainImage && (
        <div className="relative aspect-video border-2 border-indigo-500 rounded-lg overflow-hidden">
          <Image
            src={mainImage.url}
            alt="Imagen principal"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            priority
          />
          <span className="absolute top-2 left-2 bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded flex items-center gap-1">
            <Star className="h-4 w-4 fill-current" />
            Principal
          </span>
          {mainImage.status === 'new' && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-sm font-medium px-3 py-1 rounded">
              Nuevo
            </span>
          )}
        </div>
      )}

      {/* Thumbnails with DnD */}
      {hasImages && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleImages.map(img => img.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
              {visibleImages.map((image, index) => (
                <div key={image.id} className="flex-shrink-0 w-24">
                  <SortableImageItem
                    image={image}
                    index={index}
                    onRemove={handleRemove}
                    onSetMain={handleSetMain}
                    onReplace={handleReplace}
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Image Button */}
      <div className="flex gap-2">
        <label className="flex-1 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleAddImage}
            disabled={disabled || uploading}
            className="hidden"
          />
          <div
            className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition-colors ${
              disabled || uploading
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 text-gray-600 cursor-pointer'
            }`}
          >
            <Upload className="h-5 w-5" />
            <span className="text-sm">{uploading ? 'Subiendo...' : 'Añadir imagen'}</span>
          </div>
        </label>
      </div>

      {/* Empty State */}
      {!hasImages && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm">Agregue al menos una imagen</p>
        </div>
      )}

      {/* Summary */}
      <div className="text-xs text-gray-500 flex gap-4">
        <span>Total: {images.length} imágenes</span>
        {images.some(i => i.status === 'new') && (
          <span className="text-green-600">Nuevas: {images.filter(i => i.status === 'new').length}</span>
        )}
        {images.some(i => i.status === 'deleted') && (
          <span className="text-red-600">Por borrar: {images.filter(i => i.status === 'deleted').length}</span>
        )}
      </div>
    </div>
  );
}
