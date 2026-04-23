'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRealTime } from '@/hooks/useRealTime';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  taxId: string | null;
}

export interface Address {
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

export interface CartItem {
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

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  type: string;
}

interface CheckoutDataResult {
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  addresses: Address[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  cart: Cart | null;
  setCart: (cart: Cart | null) => void;
  appliedCoupon: AppliedCoupon | null;
  userProfile: UserProfile | null;
  productsOutOfStock: Set<string>;
}

export function useCheckoutData(): CheckoutDataResult {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [cart, setCart] = useState<Cart | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [productsOutOfStock, setProductsOutOfStock] = useState<Set<string>>(new Set());

  // Real-time event handler for stock updates
  const handleRealTimeEvent = useCallback(
    (event: { type: string; payload: Record<string, unknown> }) => {
      switch (event.type) {
        case 'stock:updated': {
          const productId = event.payload.productId as string;
          const newStock = event.payload.newStock as number;
          const productName = event.payload.productName as string;

          // If product in cart is now out of stock
          if (newStock <= 0 && cart) {
            const itemInCart = cart.items.find(item => item.product.id === productId);
            if (itemInCart) {
              setProductsOutOfStock(prev => new Set(prev).add(productId));
              toast.error(`Producto agotado`, {
                description: `${productName} ya no está disponible. Por favor elimínalo del carrito.`,
                duration: 5000,
              });
            }
          }

          // If product is back in stock, remove from out-of-stock list
          if (newStock > 0) {
            setProductsOutOfStock(prev => {
              const newSet = new Set(prev);
              newSet.delete(productId);
              return newSet;
            });
          }

          // Update stock in cart items
          setCart(prevCart => {
            if (!prevCart) return null;
            return {
              ...prevCart,
              items: prevCart.items.map(item =>
                item.product.id === productId ? { ...item, product: { ...item.product, stock: newStock } } : item,
              ),
            };
          });
          break;
        }
      }
    },
    [cart],
  );

  // Initialize real-time connection for stock updates - desactivado para evitar bucles
  useRealTime({
    eventTypes: ['stock:updated'],
    onEvent: handleRealTimeEvent,
    autoReconnect: false,
    enableSSE: false,
  });

  const migrateLocalCart = useCallback(async () => {
    const localCartData = localStorage.getItem('cart');
    if (!localCartData) {
      return false;
    }

    try {
      const localItems = JSON.parse(localCartData) as Array<{
        productId: string;
        quantity: number;
      }>;

      if (localItems.length === 0) {
        return false;
      }

      // Migrar items del localStorage
      for (const item of localItems) {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
          }),
        });
      }

      // Limpiar localStorage después de migrar
      localStorage.removeItem('cart');

      return true;
    } catch {
      return false;
    }
  }, []);

  const loadCoupon = useCallback(() => {
    const storedCoupon = localStorage.getItem('appliedCoupon');
    if (!storedCoupon) {
      return;
    }

    try {
      const parsed = JSON.parse(storedCoupon) as AppliedCoupon;
      setAppliedCoupon(parsed);
    } catch {
      localStorage.removeItem('appliedCoupon');
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if cart was just migrated from auth page
      const migratedTimestamp = sessionStorage.getItem('cartMigrated');
      const justMigrated = !!migratedTimestamp;

      // PRIMERO: Intentar migrar carrito local si existe (y no vino de migración)
      // Si vino de auth page, la migración ya se hizo ahí
      const hasLocalCart = !!localStorage.getItem('cart');
      if (hasLocalCart && !justMigrated) {
        await migrateLocalCart();
      }

      // Load user profile
      const resProfile = await fetch('/api/account/profile');
      if (resProfile.ok) {
        const data = await resProfile.json();
        if (data.success) {
          setUserProfile(data.usuario);
        }
      }

      // Load addresses
      const resAddresses = await fetch('/api/account/addresses');
      if (resAddresses.ok) {
        const data = await resAddresses.json();
        const loadedAddresses = (data.addresses as Address[]) || [];
        setAddresses(loadedAddresses);
        const primary = loadedAddresses.find((d: Address) => d.isDefault);
        if (primary) {
          setSelectedAddressId(primary.id);
        }
      } else if (resAddresses.status === 401) {
        router.push('/auth?callbackUrl=/checkout');
        return;
      }

      // Load cart - CON RETRY si venimos de migración O si hay carrito local pendiente
      let cartData: { data?: { items: CartItem[]; subtotal: number } | null } | null = null;
      let retryCount = 0;
      const maxRetries = justMigrated ? 3 : 1;

      while (retryCount < maxRetries) {
        const resCart = await fetch('/api/cart');
        if (resCart.ok) {
          cartData = (await resCart.json()) as { data?: { items: CartItem[]; subtotal: number } | null };
        }

        // Si venimos de migración y el carrito está vacío, reintentar
        const hasItems = cartData?.data?.items?.length && cartData.data.items.length > 0;
        if (justMigrated && !hasItems && retryCount < maxRetries - 1) {
          // Esperar un poco para que la migración complete
          await new Promise(resolve => setTimeout(resolve, 500));
          retryCount++;
        } else {
          break;
        }
      }

      // Limpiar flag de migración
      if (justMigrated) {
        sessionStorage.removeItem('cartMigrated');
      }

      if (cartData) {
        setCart(cartData.data || null);
        loadCoupon();

        // Verificar si hay items después de la migración
        const itemCount = cartData.data?.items?.length ?? 0;
        const hasItems = itemCount > 0;
        const stillHasLocalCart = !!localStorage.getItem('cart');

        // Solo redirigir si no hay items Y no hay carrito local pendiente
        if (!hasItems && !stillHasLocalCart) {
          router.push('/cart');
          return;
        }

        // Si hay items en localStorage pero no en el servidor, intentar migrar de nuevo
        if (!hasItems && stillHasLocalCart) {
          await migrateLocalCart();
          // Recargar carrito después de segunda migración
          const retryRes = await fetch('/api/cart');
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            setCart(retryData.data || null);

            // Si aún no hay items, redirigir
            if (!retryData.data?.items?.length) {
              router.push('/cart');
              return;
            }
          }
        }
      }
    } catch {
      setError('Error al cargar datos del checkout');
    } finally {
      setLoading(false);
    }
  }, [router, loadCoupon, migrateLocalCart]);

  // Load initial cart
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/checkout');
      return;
    }
    if (status === 'authenticated') {
       
      loadData();
    }
  }, [status, router, loadData]);

  return {
    loading,
    error,
    setError,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    cart,
    setCart,
    appliedCoupon,
    userProfile,
    productsOutOfStock,
  };
}
