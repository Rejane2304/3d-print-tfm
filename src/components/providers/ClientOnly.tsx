/**
 * ClientOnly Component
 * Wrapper para componentes que solo deben renderizarse en el cliente
 * Solución alternativa a dynamic import con ssr: false en Server Components
 */
'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: Readonly<ClientOnlyProps>) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
}
