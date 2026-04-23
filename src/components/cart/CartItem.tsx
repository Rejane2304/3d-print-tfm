/**
 * CartItem Component
 * Item individual del carrito de compras
 * Responsive: mobile → desktop
 *
 * Accessibility improvements:
 * - Labels asociados a inputs
 * - Aria-live para anuncios de cantidad
 * - Descriptive aria-labels for buttons
 * - Error announcements via screen reader
 */
'use client';

import { useState, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAnnouncer } from '@/hooks/useAnnouncer';

interface CartItemProps {
  item: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product?: {
      id: string;
      name: string;
      slug: string;
      price: number;
      stock: number;
      image: string | null;
    } | null;
  };
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating?: boolean;
}

export default function CartItem({ item, onUpdateQuantity, onRemove, isUpdating = false }: Readonly<CartItemProps>) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [modalOpen, setModalOpen] = useState(false);
  const { announce } = useAnnouncer();

  // Unique IDs for accessibility
  const quantityId = useId();

  const subtotal = item.unitPrice * item.quantity;

  // Si el producto ya no existe (puede haber sido eliminado), mostrar mensaje
  if (!item.product) {
    return (
      <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500">Producto no disponible</p>
            <p className="text-sm text-gray-400">Este producto ya no está en catálogo</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            aria-label="Eliminar producto no disponible del carrito"
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  // After early return, product is guaranteed to exist
  const product = item.product;

  const handleRemoveClick = () => {
    setModalOpen(true);
  };

  const handleConfirmRemove = () => {
    setModalOpen(false);
    onRemove(item.id);
    announce(`${product.name} eliminado del carrito`, 'polite');
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > product.stock) {
      return;
    }
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
    announce(`Cantidad de ${product.name} actualizada a ${newQuantity}`, 'polite');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    if (Number.isNaN(value)) {
      return;
    }

    // Limitar entre 1 y stock disponible
    const clampedValue = Math.max(1, Math.min(value, product.stock));
    setQuantity(clampedValue);
  };

  const handleInputBlur = () => {
    onUpdateQuantity(item.id, quantity);
    announce(`Cantidad de ${product.name} actualizada a ${quantity}`, 'polite');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Imagen del producto */}
      <Link
        href={`/products/${product.slug}`}
        className="relative w-full sm:w-32 h-32 flex-shrink-0 block"
        aria-label={`Ver detalles de ${product.name}`}
      >
        <Image
          src={product.image || '/images/placeholder.jpg'}
          alt={`Imagen de ${product.name}`}
          fill
          className="object-cover rounded-md"
          sizes="(max-width: 640px) 100vw, 128px"
        />
      </Link>

      {/* Información del producto */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link
            href={`/products/${product.slug}`}
            className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2"
          >
            {product.name}
          </Link>
          <p className="text-sm text-gray-500 mt-1">{item.unitPrice.toFixed(2)} € / unidad (IVA incluido)</p>
        </div>

        {/* Controles de cantidad */}
        <div className="flex items-center justify-between mt-4 sm:mt-0">
          <div className="flex items-center gap-2">
            <label htmlFor={quantityId} className="sr-only">
              Cantidad de {product.name}
            </label>

            {/* Botón decrementar */}
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || isUpdating}
              aria-label={`Disminuir cantidad de ${product.name}`}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Input de cantidad */}
            <input
              id={quantityId}
              type="number"
              value={quantity}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              min={1}
              max={product.stock}
              disabled={isUpdating}
              data-testid="cart-item-quantity"
              aria-label={`Cantidad actual: ${quantity}`}
              aria-describedby={`${quantityId}-stock-info`}
              className="w-16 text-center border border-gray-300 rounded-md py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            />

            {/* Botón incrementar */}
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stock || isUpdating}
              aria-label={`Aumentar cantidad de ${product.name}`}
              data-testid="quantity-increase"
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Indicador de stock */}
            <span
              id={`${quantityId}-stock-info`}
              className={`text-xs ml-2 ${quantity >= product.stock ? 'text-orange-600 font-medium' : 'text-gray-500'}`}
              role="status"
              aria-live="polite"
            >
              {quantity >= product.stock ? 'Stock máximo alcanzado' : `Máx: ${product.stock}`}
            </span>
          </div>

          {/* Subtotal y botón eliminar */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">{subtotal.toFixed(2)} €</p>
              <p className="text-sm text-gray-500">
                {item.quantity} x {item.unitPrice.toFixed(2)} €
              </p>
              {isUpdating && <p className="text-xs text-gray-400 mt-1">Actualizando...</p>}
            </div>

            <button
              type="button"
              onClick={handleRemoveClick}
              disabled={isUpdating}
              aria-label={`Eliminar ${product.name} del carrito`}
              data-testid="remove-item-button"
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {isUpdating ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmRemove}
        title="¿Eliminar del carrito?"
        description={`¿Estás seguro de que deseas eliminar "${product.name}" del carrito?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        isLoading={isUpdating}
      />
    </div>
  );
}
