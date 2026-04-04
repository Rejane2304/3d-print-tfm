/**
 * CartItem Component
 * Item individual del carrito de compras
 * Responsive: mobile → desktop
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Minus, Plus, Loader2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface CartItemProps {
  item: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product?: {
      id: string;
      nombre: string;
      slug: string;
      precio: number;
      stock: number;
      imagen: string | null;
    } | null;
  };
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating?: boolean;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
}: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [modalOpen, setModalOpen] = useState(false);
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
            aria-label="Eliminar del carrito"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // After early return, product is guaranteed to exist
  const product = item.product!;

  const handleRemoveClick = () => {
    setModalOpen(true);
  };

  const handleConfirmRemove = () => {
    setModalOpen(false);
    onRemove(item.id);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > product.stock) return;
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) return;
    
    // Limitar entre 1 y stock disponible
    const clampedValue = Math.max(1, Math.min(value, product.stock));
    setQuantity(clampedValue);
  };

  const handleInputBlur = () => {
    onUpdateQuantity(item.id, quantity);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Imagen del producto */}
      <Link
        href={`/products/${product.slug}`}
        className="relative w-full sm:w-32 h-32 flex-shrink-0"
      >
        <Image
          src={product.imagen || '/images/placeholder.jpg'}
          alt={product.nombre}
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
            {product.nombre}
          </Link>
          <p className="text-sm text-gray-500 mt-1">
            {item.unitPrice.toFixed(2)} € / unidad
          </p>
        </div>

        {/* Controles de cantidad */}
        <div className="flex items-center justify-between mt-4 sm:mt-0">
          <div className="flex items-center gap-2">
            {/* Botón decrementar */}
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || isUpdating}
              aria-label="Decrementar cantidad"
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>

            {/* Input de cantidad */}
            <input
              type="number"
              value={quantity}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              min={1}
              max={product.stock}
              disabled={isUpdating}
              data-testid="cart-item-quantity"
              className="w-16 text-center border border-gray-300 rounded-md py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />

            {/* Botón incrementar */}
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stock || isUpdating}
              aria-label="Incrementar cantidad"
              data-testid="quantity-increase"
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* Indicador de stock */}
            {quantity >= product.stock && (
              <span className="text-xs text-orange-600 ml-2">
                Stock máximo
              </span>
            )}
          </div>

          {/* Subtotal y botón eliminar */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                {subtotal.toFixed(2)} €
              </p>
              <p className="text-sm text-gray-500">
                {item.quantity} x {item.unitPrice.toFixed(2)} €
              </p>
              {isUpdating && (
                <p className="text-xs text-gray-400 mt-1">Actualizando...</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleRemoveClick}
              disabled={isUpdating}
              aria-label="Eliminar del carrito"
              data-testid="remove-item-button"
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
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
        description={`¿Estás seguro de que deseas eliminar "${product.nombre}" del carrito?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        isLoading={isUpdating}
      />
    </div>
  );
}
