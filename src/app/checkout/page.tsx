/**
 * Checkout Page - Simplified Payment Form
 * Flow: User chooses method → Confirms → Order created → Redirect to success
 * No external redirects or complex forms
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  ArrowRightLeft,
  Package,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  taxId: string | null;
}

interface Address {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  address: string;
  complement?: string;
  postalCode: string;
  city: string;
  province: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
}

type PaymentMethod = "CARD" | "PAYPAL" | "BIZUM" | "TRANSFER";

const paymentMethods = [
  {
    id: "CARD" as PaymentMethod,
    name: "Tarjeta de crédito/débito",
    description: "Pago seguro con tarjeta",
    icon: CreditCard,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  {
    id: "PAYPAL" as PaymentMethod,
    name: "PayPal",
    description: "Pago rápido con PayPal",
    icon: Wallet,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "BIZUM" as PaymentMethod,
    name: "Bizum",
    description: "Pago instantáneo desde tu móvil",
    icon: Banknote,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    id: "TRANSFER" as PaymentMethod,
    name: "Transferencia bancaria",
    description: "Transferencia a nuestra cuenta",
    icon: ArrowRightLeft,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
];

export default function CheckoutPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [, setUserProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [cart, setCart] = useState<{
    items: CartItem[];
    subtotal: number;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTestDataModal, setShowTestDataModal] = useState(false);
  const [externalPaymentUrl, setExternalPaymentUrl] = useState<string | null>(
    null,
  );
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cancelledOrderId, setCancelledOrderId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [orderComplete, _setOrderComplete] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [orderData, _setOrderData] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  // Cupón aplicado
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: string;
  } | null>(null);

  // Check if returning from cancelled payment
  useEffect(() => {
    // Check URL params and localStorage for cancelled orders
    const checkCancelledPayment = () => {
      // First check URL params
      const urlParams = new URLSearchParams(window.location.search);
      const cancelled = urlParams.get("cancelled");
      const orderId = urlParams.get("orderId");

      console.log("Checkout params:", {
        cancelled,
        orderId,
        url: window.location.href,
      }); // Debug

      if (cancelled === "true" && orderId) {
        console.log("Found cancelled order in URL:", orderId);
        setCancelledOrderId(orderId);

        // Clear URL params
        window.history.replaceState({}, "", "/checkout");

        // Automatically cancel order and restore stock
        const cancelOrder = async () => {
          try {
            console.log("Calling cancel-and-restore for order:", orderId);
            const response = await fetch("/api/orders/cancel-and-restore", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });
            const data = await response.json();
            if (!response.ok) {
              console.error("Error cancelling order:", data);
            } else {
              console.log("Order cancelled successfully:", data);
            }
          } catch (err) {
            console.error("Error calling cancel API:", err);
          }
        };
        cancelOrder();
      }
    };

    // Run immediately
    checkCancelledPayment();
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const resProfile = await fetch("/api/account/profile");
      if (resProfile.ok) {
        const data = await resProfile.json();
        if (data.success) {
          setUserProfile(data.usuario);
        }
      }

      // Load addresses
      const resAddresses = await fetch("/api/account/addresses");
      if (resAddresses.ok) {
        const data = await resAddresses.json();
        setAddresses(data.addresses || []);
        const primary = data.addresses?.find((d: Address) => d.isDefault);
        if (primary) {
          setSelectedAddressId(primary.id);
        }
      } else if (resAddresses.status === 401) {
        router.push("/auth?callbackUrl=/checkout");
        return;
      }

      // Load cart
      const resCart = await fetch("/api/cart");
      if (resCart.ok) {
        const data = await resCart.json();
        setCart(data.cart);

        // Load coupon from localStorage
        const storedCoupon = localStorage.getItem("appliedCoupon");
        if (storedCoupon) {
          try {
            const parsed = JSON.parse(storedCoupon);
            setAppliedCoupon(parsed);
          } catch {
            // Invalid coupon data
            localStorage.removeItem("appliedCoupon");
          }
        }

        // Solo redirigir si realmente no hay items (tanto en API como en localStorage)
        if (!data.cart?.items?.length && !localStorage.getItem("cart")) {
          router.push("/cart");
          return;
        }
        // Si hay items en localStorage, intentar migrarlos
        const localCartData = localStorage.getItem("cart");
        if (localCartData && JSON.parse(localCartData).length > 0) {
          try {
            // Migrar items del localStorage
            const localItems = JSON.parse(localCartData);
            for (const item of localItems) {
              await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: item.productId,
                  quantity: item.quantity,
                }),
              });
            }
            // Limpiar localStorage y recargar carrito
            localStorage.removeItem("cart");
            const refreshedCart = await fetch("/api/cart");
            if (refreshedCart.ok) {
              const refreshedData = await refreshedCart.json();
              setCart(refreshedData.cart);
            }
          } catch (migrationError) {
            console.error("Error migrando carrito:", migrationError);
          }
        }
      }
    } catch (err) {
      setError("Error al cargar datos del checkout");
      console.error("Error al cargar datos de checkout:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?callbackUrl=/checkout");
      return;
    }
    if (status === "authenticated") {
      loadData();
    }
  }, [status, router, loadData]);

  const processPayment = async () => {
    if (!selectedAddressId) {
      setError("Selecciona una dirección de envío");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Step 1: Create order in PENDING status
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddressId: selectedAddressId,
          paymentMethod: paymentMethod,
        }),
      });

      const checkoutData = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || "Error al crear el pedido");
      }

      const { orderId, paymentId } = checkoutData;

      // Step 2: Route to specific payment method
      switch (paymentMethod) {
        case "CARD": {
          // Stripe - Real payment
          const stripeResponse = await fetch("/api/payments/stripe/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, paymentId }),
          });

          const stripeData = await stripeResponse.json();

          if (!stripeResponse.ok) {
            throw new Error(
              stripeData.error || "Error al iniciar pago con Stripe",
            );
          }

          // Abrir Stripe en nueva ventana y mostrar datos de prueba
          window.open(stripeData.url, "_blank");
          setExternalPaymentUrl(stripeData.url);
          setPendingOrderId(orderId);
          setShowTestDataModal(true);
          return;
        }

        case "PAYPAL": {
          // PayPal - Real payment
          const paypalResponse = await fetch("/api/payments/paypal/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, paymentId }),
          });

          const paypalData = await paypalResponse.json();

          if (!paypalResponse.ok) {
            throw new Error(
              paypalData.error || "Error al iniciar pago con PayPal",
            );
          }

          // Guardar el paypalOrderId para recuperarlo después
          localStorage.setItem("pendingPayPalOrderId", orderId);
          localStorage.setItem(
            "pendingPayPalToken",
            paypalData.paypalOrderId || "",
          );

          // Abrir PayPal en nueva ventana
          window.open(paypalData.url, "_blank");
          setExternalPaymentUrl(paypalData.url);
          setPendingOrderId(orderId);
          setShowTestDataModal(true);
          return;
        }

        case "BIZUM":
        case "TRANSFER": {
          // Fake payments - Go to processing page
          router.push(
            `/checkout/processing?orderId=${orderId}&paymentId=${paymentId}&method=${paymentMethod.toLowerCase()}`,
          );
          return;
        }

        default:
          throw new Error("Método de pago no soportado");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setProcessing(false);
    }
  };

  const translateAddressName = (name: string): string => {
    const translations: { [key: string]: string } = {
      home: "Casa",
      house: "Casa",
      work: "Trabajo",
      office: "Oficina",
      apartment: "Apartamento",
      flat: "Piso",
      parents: "Casa de padres",
      family: "Casa familiar",
    };
    const lowerName = name?.toLowerCase().trim();
    return translations[lowerName] || name;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">
            Cargando checkout...
          </p>
        </div>
      </div>
    );
  }

  // If order is complete, show success screen
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              ¡Pago completado!
            </h1>

            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Tu pedido ha sido procesado exitosamente.
            </p>

            {orderData && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Número de pedido:
                </p>
                <p className="text-lg sm:text-xl font-bold text-indigo-600">
                  {orderData.orderNumber}
                </p>
              </div>
            )}

            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
              Redirigiendo a los detalles de tu pedido...
            </p>

            <div className="animate-pulse">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-indigo-600 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cálculos con IVA separado (transparente) - BASE IMPONIBLE INCLUYE ENVÍO
  const subtotal = cart?.subtotal || 0;
  const shippingCost = subtotal >= 50 ? 0 : 5.99;

  // Cupón (si se aplica desde el carrito)
  const couponDiscount = appliedCoupon?.discount || 0;

  // Envío gratis por cupón
  const hasFreeShippingCoupon = appliedCoupon?.type === "FREE_SHIPPING";
  const finalShippingCost = hasFreeShippingCoupon ? 0 : shippingCost;

  // Cálculo de IVA (21% sobre base imponible: subtotal con descuento + envío)
  const taxRate = 0.21;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const taxableBase = discountedSubtotal + finalShippingCost; // Envío lleva IVA
  const taxAmount = taxableBase * taxRate;

  // Total final
  const total = discountedSubtotal + finalShippingCost + taxAmount;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const selectedPaymentMethod = paymentMethods.find(
    (m) => m.id === paymentMethod,
  );

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

        {/* Pedido cancelado - volviendo de Stripe/PayPal */}
        {cancelledOrderId && (
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
                <p className="text-orange-800 font-semibold text-base sm:text-lg">
                  Pago no completado
                </p>
                <p className="text-orange-700 text-sm mt-1 mb-4">
                  Has vuelto desde la página de pago. Tu carrito está vacío pero
                  puedes restaurarlo para volver a intentarlo.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={async () => {
                      if (cancelledOrderId) {
                        try {
                          const response = await fetch(
                            "/api/cart/restore-from-order",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                orderId: cancelledOrderId,
                              }),
                            },
                          );
                          if (response.ok) {
                            // Recargar carrito
                            const cartRes = await fetch("/api/cart");
                            if (cartRes.ok) {
                              const data = await cartRes.json();
                              setCart(data.cart);
                            }
                            setCancelledOrderId(null);
                          }
                        } catch (err) {
                          console.error("Error restaurando carrito:", err);
                        }
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white py-2.5 px-5 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Restaurar carrito
                  </button>
                  <a
                    href={`/account/orders/${cancelledOrderId}`}
                    className="inline-flex items-center justify-center gap-2 border border-orange-300 text-orange-700 py-2.5 px-5 rounded-lg font-medium hover:bg-orange-100 transition-colors"
                  >
                    Ver pedido pendiente
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm sm:text-base">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Columna izquierda: Datos de envío y productos */}
          <div className="space-y-4 sm:space-y-6">
            {/* Dirección de envío */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Dirección de envío
                  </h2>
                </div>
                <a
                  href="/account/addresses"
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
                >
                  Gestionar direcciones →
                </a>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">
                    No tienes direcciones guardadas
                  </p>
                  <a
                    href="/account/addresses"
                    className="inline-flex items-center bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Añadir dirección
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      htmlFor={`address-${address.id}`}
                      className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors min-h-[44px] ${
                        selectedAddressId === address.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        id={`address-${address.id}`}
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 w-4 h-4 min-w-[16px] min-h-[16px]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm sm:text-base">
                            {translateAddressName(address.name)}
                          </span>
                          {address.isDefault && (
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {address.address}
                        </p>
                        {address.complement && (
                          <p className="text-sm text-gray-600 truncate">
                            {address.complement}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {address.postalCode} {address.city},{" "}
                          {address.province}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tel: {address.phone}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Productos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">
                Resumen del pedido
              </h2>

              {cart?.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 sm:gap-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 flex-shrink-0 overflow-hidden relative rounded">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 640px) 64px, 80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Package className="w-full h-full p-3 sm:p-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x {(item.unitPrice || 0).toFixed(2)} €
                    </p>
                  </div>
                  <p className="font-semibold text-sm sm:text-base whitespace-nowrap">
                    {((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}{" "}
                    €
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: Método de pago y confirmación */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                Método de pago
              </h2>

              {/* Selector de métodos de pago */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.id}
                      htmlFor={`payment-${method.id}`}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all min-h-[44px] ${
                        paymentMethod === method.id
                          ? `${method.borderColor} ${method.bgColor}`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        id={`payment-${method.id}`}
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => {
                          setPaymentMethod(method.id);
                          setShowConfirmation(false);
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`p-1.5 sm:p-2 rounded-lg ${method.bgColor} flex-shrink-0`}
                      >
                        <Icon
                          className={`h-5 w-5 sm:h-6 sm:w-6 ${method.color}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 text-sm sm:text-base block">
                          {method.name}
                        </span>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {method.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Resumen de totales - IVA Separado (Transparente) */}
              <div className="border-t pt-4 sm:pt-6 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                  Resumen del pedido
                </h3>

                <div className="space-y-2 sm:space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                    <span>Subtotal (sin IVA)</span>
                    <span>{subtotal.toFixed(2)} €</span>
                  </div>

                  {/* Descuento por cupón */}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm sm:text-base">
                      <span>Descuento ({appliedCoupon?.code})</span>
                      <span>-{couponDiscount.toFixed(2)} €</span>
                    </div>
                  )}

                  {/* Envío */}
                  <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                    <span>Envío</span>
                    <span
                      className={
                        finalShippingCost === 0
                          ? "text-green-600 font-medium"
                          : ""
                      }
                    >
                      {finalShippingCost === 0
                        ? "Gratis"
                        : `${finalShippingCost.toFixed(2)} €`}
                    </span>
                  </div>

                  {/* IVA (separado y transparente) */}
                  <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                    <span>IVA (21%)</span>
                    <span>{taxAmount.toFixed(2)} €</span>
                  </div>

                  {/* Total Final */}
                  <div className="flex justify-between text-lg sm:text-xl font-bold border-t-2 border-gray-200 pt-3 mt-2">
                    <span>Total a pagar</span>
                    <span className="text-indigo-600">
                      {total.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos de prueba según método de pago seleccionado */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Datos de prueba -{" "}
                  {paymentMethod === "CARD"
                    ? "Stripe"
                    : paymentMethod === "PAYPAL"
                      ? "PayPal Sandbox"
                      : "Demo"}
                </h4>
                {paymentMethod === "CARD" && (
                  <div className="text-sm space-y-1">
                    <p className="font-mono text-gray-700">
                      Número:{" "}
                      <span className="text-blue-600 font-semibold">
                        4242 4242 4242 4242
                      </span>
                    </p>
                    <p className="font-mono text-gray-700">
                      Expira: <span className="text-blue-600">12/30</span> |
                      CVC: <span className="text-blue-600">123</span>
                    </p>
                  </div>
                )}
                {paymentMethod === "PAYPAL" && (
                  <div className="text-sm space-y-1">
                    <p className="font-mono text-gray-700">
                      Usuario:{" "}
                      <span className="text-blue-600 font-semibold">
                        sb-rb3ao50452979@personal.example.com
                      </span>
                    </p>
                    <p className="font-mono text-gray-700">
                      Password:{" "}
                      <span className="text-blue-600">Q+7&gt;jQ^8</span>
                    </p>
                  </div>
                )}
                {(paymentMethod === "BIZUM" ||
                  paymentMethod === "TRANSFER") && (
                  <p className="text-sm text-gray-700">
                    Método de prueba - No requiere datos reales
                  </p>
                )}
              </div>

              {/* Botón de confirmación */}
              {!showConfirmation ? (
                <button
                  onClick={() => setShowConfirmation(true)}
                  disabled={!selectedAddressId || addresses.length === 0}
                  className="w-full bg-indigo-600 text-white py-3.5 sm:py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  Confirmar pedido
                </button>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {/* Confirmación final */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4">
                    <p className="text-sm text-indigo-900 font-medium mb-2">
                      ¿Confirmar compra?
                    </p>
                    <p className="text-sm text-indigo-700">
                      Vas a pagar{" "}
                      <span className="font-bold">{total.toFixed(2)} €</span>{" "}
                      con{" "}
                      <span className="font-medium">
                        {selectedPaymentMethod?.name}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={processPayment}
                      disabled={processing}
                      className="flex-1 bg-indigo-600 text-white py-3.5 sm:py-4 px-4 sm:px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          <span className="text-sm sm:text-base">
                            Procesando...
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          <span className="text-sm sm:text-base">
                            Sí, pagar {total.toFixed(2)} €
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowConfirmation(false)}
                      disabled={processing}
                      className="flex-1 bg-gray-200 text-gray-700 py-3.5 sm:py-4 px-4 sm:px-6 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Modal de Datos de Prueba - Visible cuando se abre Stripe/PayPal */}
              {showTestDataModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <svg
                          className="h-8 w-8 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Ventana de pago abierta
                      </h3>
                      <p className="text-gray-600">
                        Completa el pago en la ventana emergente. Usa estos
                        datos de prueba:
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      {paymentMethod === "CARD" && (
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">
                            💳 Tarjeta de prueba (Stripe)
                          </p>
                          <div className="space-y-1 font-mono text-sm">
                            <p className="text-blue-700 font-semibold text-lg">
                              4242 4242 4242 4242
                            </p>
                            <p className="text-gray-600">
                              Expira:{" "}
                              <span className="font-semibold">12/30</span> |
                              CVC: <span className="font-semibold">123</span>
                            </p>
                          </div>
                        </div>
                      )}
                      {paymentMethod === "PAYPAL" && (
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">
                            💰 Cuenta PayPal Sandbox
                          </p>
                          <div className="space-y-1 text-sm">
                            <p className="font-mono text-blue-700 font-semibold break-all">
                              sb-rb3ao50452979@personal.example.com
                            </p>
                            <p className="font-mono text-gray-700">
                              Password:{" "}
                              <span className="font-semibold">Q+7&gt;jQ^8</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          if (externalPaymentUrl) {
                            window.open(externalPaymentUrl, "_blank");
                          }
                        }}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        🔄 Reabrir ventana de pago
                      </button>

                      <button
                        onClick={() => {
                          setShowTestDataModal(false);
                          if (pendingOrderId) {
                            router.push(`/account/orders`);
                          }
                        }}
                        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        ✓ Ya completé el pago - Ver mis pedidos
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      Si cierras esta ventana, puedes volver a abrir el pago
                      desde tus pedidos
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
