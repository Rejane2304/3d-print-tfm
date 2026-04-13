'use client';

import { CheckCircle2, Loader2, ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { useCheckoutData } from './hooks/useCheckoutData';
import { useCancelledOrder } from './hooks/useCancelledOrder';
import { usePaymentProcessing } from './hooks/usePaymentProcessing';
import { AddressSelector } from './components/AddressSelector';
import { PaymentMethodSelector } from './components/PaymentMethodSelector';
import { OrderItems, OrderTotals } from './components/OrderSummary';
import { TestDataDisplay } from './components/TestDataModal';
import { useState } from 'react';

// Loading spinner component
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600 text-sm sm:text-base">Cargando checkout...</p>
      </div>
    </div>
  );
}

// Cancelled order alert component
function CancelledOrderAlert({
  orderId,
  onRestore,
  onDismiss,
}: Readonly<{
  orderId: string;
  onRestore: () => void;
  onDismiss: () => void;
}>) {
  return (
    <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0">
          <svg
            className="h-8 w-8 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-orange-800 font-semibold text-base sm:text-lg">Pago no completado</p>
          <p className="text-orange-700 text-sm mt-1 mb-4">
            Has vuelto desde la página de pago. Tu carrito está vacío pero puedes restaurarlo para
            volver a intentarlo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRestore}
              className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white py-2.5 px-5 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Restaurar carrito
            </button>
            <a
              href={`/account/orders/${orderId}`}
              onClick={onDismiss}
              className="inline-flex items-center justify-center gap-2 border border-orange-300 text-orange-700 py-2.5 px-5 rounded-lg font-medium hover:bg-orange-100 transition-colors"
            >
              Ver pedido pendiente
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment confirmation section
function PaymentConfirmation({
  total,
  processing,
  paymentMethodName,
  onConfirm,
  onCancel,
}: Readonly<{
  total: number;
  processing: boolean;
  paymentMethodName: string;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4">
        <p className="text-sm text-indigo-900 font-medium mb-2">¿Confirmar compra?</p>
        <p className="text-sm text-indigo-700">
          Vas a pagar <span className="font-bold">{total.toFixed(2)} €</span> con{' '}
          <span className="font-medium">{paymentMethodName}</span>
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={onConfirm}
          disabled={processing}
          className="flex-1 bg-indigo-600 text-white py-3.5 sm:py-4 px-4 sm:px-6 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ minHeight: 44 }}
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              <span className="text-sm sm:text-base">Procesando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">Sí, pagar {total.toFixed(2)} €</span>
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={processing}
          className="flex-1 bg-gray-200 text-gray-700 py-3.5 sm:py-4 px-4 sm:px-6 rounded-lg font-medium text-sm sm:text-base hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ minHeight: 44 }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { status } = useSession();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    loading,
    error,
    setError,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    cart,
    setCart,
    appliedCoupon,
  } = useCheckoutData();

  const { cancelledOrderId, restoreCart, dismissCancelledOrder } = useCancelledOrder(setCart);

  const {
    processing,
    error: paymentError,
    paymentMethod,
    setPaymentMethod,
    processPayment,
  } = usePaymentProcessing();

  // Combined error from checkout data and payment processing
  const displayError = error || paymentError;

  if (status === 'loading' || loading) {
    return <LoadingState />;
  }

  const subtotal = cart?.subtotal || 0;
  const couponDiscount = appliedCoupon?.discount || 0;
  const hasFreeShippingCoupon = appliedCoupon?.type === 'FREE_SHIPPING';

  // Calculate shipping cost
  const getShippingCost = () => {
    if (subtotal >= 50) {
      return 0;
    }
    if (hasFreeShippingCoupon) {
      return 0;
    }
    return 5.99;
  };
  const shippingCost = getShippingCost();

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const taxAmount = (discountedSubtotal + shippingCost) * 0.21;
  const total = discountedSubtotal + shippingCost + taxAmount;

  // Helper function to get payment method name
  const getPaymentMethodName = (method: string): string => {
    const methodNames: Record<string, string> = {
      'CARD': 'Tarjeta de crédito/débito',
      'PAYPAL': 'PayPal',
      'BIZUM': 'Bizum',
      'TRANSFER': 'Transferencia bancaria',
    };
    return methodNames[method] ?? 'Otro método';
  };

  const selectedPaymentMethod = getPaymentMethodName(paymentMethod);

  const handleConfirmOrder = () => {
    setShowConfirmation(true);
  };

  const handlePayment = async() => {
    const result = await processPayment(selectedAddressId);
    if (result.success) {
      // Payment started successfully, will redirect or open external window
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleRestoreCart = async() => {
    await restoreCart();
  };

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    setError(null);
  };

  const handleSelectPaymentMethod = (method: typeof paymentMethod) => {
    setPaymentMethod(method);
    setShowConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Finalizar Compra
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Revisa tu pedido, elige método de pago y confirma
          </p>
        </div>

        {/* Cancelled Order Alert */}
        {cancelledOrderId && (
          <CancelledOrderAlert
            orderId={cancelledOrderId}
            onRestore={handleRestoreCart}
            onDismiss={dismissCancelledOrder}
          />
        )}

        {/* Error */}
        {displayError && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm sm:text-base">{displayError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column: Shipping Address & Products */}
          <div className="space-y-4 sm:space-y-6">
            <AddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={handleSelectAddress}
            />

            {cart?.items && cart.items.length > 0 && (
              <OrderItems items={cart.items} />
            )}
          </div>

          {/* Right Column: Payment & Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Método de pago</h2>

              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                onSelectMethod={handleSelectPaymentMethod}
              />

              {/* Order Summary */}
              <OrderTotals subtotal={subtotal} coupon={appliedCoupon} />

              {/* Test Data Display */}
              <TestDataDisplay paymentMethod={paymentMethod} />

              {/* Confirmation Buttons */}
              {showConfirmation === false ? (
                <button
                  onClick={handleConfirmOrder}
                  disabled={!selectedAddressId || addresses.length === 0}
                  className="w-full bg-indigo-600 text-white py-3.5 sm:py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  style={{ minHeight: 44 }}
                >
                  Confirmar pedido
                </button>
              ) : (
                <PaymentConfirmation
                  total={total}
                  processing={processing}
                  paymentMethodName={selectedPaymentMethod}
                  onConfirm={handlePayment}
                  onCancel={handleCancelConfirmation}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
