'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

      // Load cart - CON RETRY si venimos de migración
      let cartData: { cart?: Cart | null } | null = null;
      const resCart = await fetch('/api/cart');
      if (resCart.ok) {
        cartData = (await resCart.json()) as { cart?: Cart | null };
      }

      // Si venimos de migración y el carrito está vacío, reintentar
      if (justMigrated && (!cartData?.cart?.items?.length || cartData?.cart?.items?.length === 0)) {
        // Esperar un poco para que la migración complete
        await new Promise(resolve => setTimeout(resolve, 500));
        // Reintentar
        const retryRes = await fetch('/api/cart');
        if (retryRes.ok) {
          cartData = (await retryRes.json()) as { cart?: Cart | null };
        }
        // Limpiar flag
        sessionStorage.removeItem('cartMigrated');
      } else if (justMigrated) {
        // Carrito tiene items, solo limpiar flag
        sessionStorage.removeItem('cartMigrated');
      }

      if (cartData) {
        setCart(cartData.cart || null);
        loadCoupon();

        // Verificar si hay items después de la migración
        const itemCount = cartData.cart?.items?.length ?? 0;
        const hasItems = itemCount > 0;
        const stillHasLocalCart = !!localStorage.getItem('cart');

        // Solo redirigir si no hay items Y no hay carrito local pendiente
        if (!hasItems && !stillHasLocalCart) {
          router.push('/cart');
          return;
        }
      }
    } catch {
      setError('Error al cargar datos del checkout');
    } finally {
      setLoading(false);
    }
  }, [router, loadCoupon, migrateLocalCart]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/checkout');
      return;
    }
    if (status === 'authenticated') {
      void loadData();
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
  };
}
