# Development Guide

Guía completa para desarrolladores que trabajan en el proyecto 3D Print TFM.

## Requisitos Previos

- **Node.js:** 18.x o superior
- **npm:** 9.x o superior
- **PostgreSQL:** 14.x o superior (o Docker para tests)
- **Git**
- **Editor recomendado:** VS Code con extensiones de TypeScript

## Setup del Entorno de Desarrollo

### 1. Clonar e Instalar

```bash
git clone https://github.com/Rejane2304/3d-print-tfm.git
cd 3d-print-tfm
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales de Supabase (desarrollo).

### 3. Configurar Base de Datos

```bash
# Generar cliente Prisma
npx prisma generate

# Setup completo (migraciones + seed)
npm run db:setup:dev
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

## Convenciones de Código

### TypeScript

- **Usar strict mode** siempre
- **No usar `any`** - tipar todo explícitamente
- **Tipar funciones** incluyendo retornos
- **Usar enums** para valores fijos
- **Preferir `interface` sobre `type`** para objetos
- **Usar `readonly`** para props de React

**Ejemplos:**

```typescript
// ✅ CORRECTO
interface ProductProps {
  readonly id: string;
  readonly name: string;
  readonly price: number;
}

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
}

// ❌ INCORRECTO
function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price, 0);
}
```

### Componentes React

- **Server Components por defecto**
- **'use client' solo cuando sea necesario** (eventos, hooks, browser APIs)
- **Props con readonly** usando `Readonly<T>`
- **Nombres descriptivos** en PascalCase
- **Un componente por archivo** (generalmente)
- **Export default** para el componente principal

**Ejemplos:**

```typescript
// ✅ CORRECTO - Server Component
export default function ProductCard({ product }: Readonly<ProductCardProps>) {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.price} €</p>
    </div>
  );
}

// ✅ CORRECTO - Client Component
'use client';

import { useState } from 'react';

export default function AddToCartButton({ productId }: Readonly<AddToCartButtonProps>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // ...
  };

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Agregando...' : 'Agregar al Carrito'}
    </button>
  );
}
```

### Estilos (Tailwind CSS)

- **Mobile-first responsive design**
- **Usar clases de utilidad**, no CSS custom
- **Orden consistente** de clases:
  1. Layout (display, position, width, height)
  2. Spacing (margin, padding)
  3. Visual (background, border, colors)
  4. Typography (font, text)
  5. Interactive (hover, focus)
- **Extraer en componentes** si se repiten mucho

**Ejemplos:**

```typescript
// ✅ CORRECTO
<button className="
  flex items-center justify-center
  px-4 py-2
  bg-blue-600 hover:bg-blue-700
  text-white font-medium
  rounded-lg
  transition-colors
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Enviar
</button>

// ❌ INCORRECTO - CSS custom innecesario
<button className="btn-primary">
  Enviar
</button>

// en CSS:
// .btn-primary { ... }
```

### Data Fetching

- **Usar hooks de React Query** - no usar fetch directamente
- **Manejar estados loading/error** siempre
- **Usar optimistic updates** para mejor UX
- **Invalidar queries** tras mutations

**Ejemplos:**

```typescript
// ✅ CORRECTO
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.get<ProductResponse[]>('/api/products'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToCartRequest) =>
      apiClient.post('/api/cart/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Producto agregado');
    },
    onError: (error) => {
      toast.error(getUserFriendlyErrorMessage(error));
    },
  });
}

// En componente:
export default function ProductList() {
  const { data: products, isLoading, error } = useProducts();
  const { mutate: addToCart, isPending } = useAddToCart();

  if (isLoading) return <ProductListSkeleton />;
  if (error) return <ErrorBoundary error={error} />;

  return (
    <div>
      {products?.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => addToCart({ productId: product.id })}
          isAdding={isPending}
        />
      ))}
    </div>
  );
}

// ❌ INCORRECTO
export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  // ...
}
```

### Manejo de Errores

- **Usar error boundaries** para errores de React
- **Capturar errores en async/await**
- **Mostrar mensajes amigables** al usuario
- **Loguear errores** para debugging

**Ejemplos:**

```typescript
// ✅ CORRECTO
import { isApiError, getUserFriendlyErrorMessage } from '@/lib/api/client';
import { toast } from 'sonner';

try {
  const result = await apiClient.post('/api/orders', orderData);
  toast.success('Pedido creado exitosamente');
} catch (error) {
  if (isApiError(error)) {
    console.error('API Error:', error);
    toast.error(getUserFriendlyErrorMessage(error));
  } else {
    console.error('Unexpected error:', error);
    toast.error('Ha ocurrido un error inesperado');
  }
}

// Error Boundary
export default function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-red-800 font-semibold">Algo salió mal</h2>
      <p className="text-red-600">{error.message}</p>
      <button onClick={() => window.location.reload()}>
        Recargar página
      </button>
    </div>
  );
}
```

### Testing

- **Tests unitarios** para lógica pura
- **Tests de integración** para APIs y hooks
- **Tests E2E** para flujos críticos
- **Usar testing-library** para componentes

**Ejemplos:**

```typescript
// Test unitario
import { describe, it, expect } from 'vitest';
import { calculateTotal } from '@/lib/utils/cart';

describe('calculateTotal', () => {
  it('calculates total correctly', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(25);
  });
});

// Test de integración
import { describe, it, expect } from 'vitest';
import { apiClient } from '@/lib/api/client';

describe('Products API', () => {
  it('returns products list', async () => {
    const products = await apiClient.get('/api/products');
    expect(products).toBeInstanceOf(Array);
    expect(products.length).toBeGreaterThan(0);
  });
});

// Test de componente
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from './ProductCard';

it('renders product and handles add to cart', () => {
  const mockAddToCart = vi.fn();
  render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);

  fireEvent.click(screen.getByText('Agregar al Carrito'));
  expect(mockAddToCart).toHaveBeenCalled();
});
```

## Flujo de Trabajo Git

### 1. Crear Rama Feature

```bash
git checkout -b feature/nombre-descriptivo
```

### 2. Desarrollar

- Hacer commits atómicos y descriptivos
- Seguir convenciones de código
- Escribir tests para nuevas funcionalidades

### 3. Ejecutar Verificaciones

```bash
# Verificación completa antes de push
npm run type-check && npm run lint && npm run test:unit
```

### 4. Crear PR

- Descripción clara de cambios
- Referenciar issues relacionados
- Agregar screenshots si es UI

## Estructura de Carpetas

```
src/
├── app/                     # Next.js App Router
│   ├── (shop)/              # Tienda pública (ruta agrupada)
│   ├── admin/               # Panel de administración
│   ├── api/                 # API Routes
│   └── layout.tsx           # Root layout
├── components/
│   ├── admin/               # Componentes admin
│   ├── cart/                # Componentes carrito
│   ├── checkout/            # Componentes checkout
│   ├── providers/           # Context providers
│   ├── ui/                  # UI components reutilizables
│   │   ├── skeletons/       # Loading states
│   │   └── ...
│   └── ...
├── hooks/
│   ├── queries/             # React Query hooks
│   ├── useCart.ts           # Hook legacy (en migración)
│   └── useRealTime.ts       # WebSocket hooks
├── lib/
│   ├── api/                 # API Client y servicios
│   │   ├── client.ts
│   │   └── services/
│   ├── i18n/                # Traducciones
│   ├── validators/          # Zod schemas
│   └── ...
├── types/
│   └── api.ts               # Tipos compartidos
└── utils/                   # Utilidades
```

## Comandos Útiles

### Desarrollo

```bash
npm run dev                    # Servidor de desarrollo
npm run type-check            # Verificar tipos
npm run lint                  # Linting
npm run lint:fix              # Corregir lint automáticamente
npm run format                # Formatear con Prettier
npm run check-code            # Lint + type-check
```

### Testing

```bash
npm run test:unit             # Tests unitarios
npm run test:integration      # Tests de integración
npm run test:e2e              # Tests E2E
npm run test:coverage         # Tests con cobertura
```

### Base de Datos

```bash
# Setup completo
npm run db:setup:dev

# Reset (cuidado: borra datos)
npm run db:reset:dev

# Seed solo
npm run db:seed:dev

# Studio
npm run db:studio:dev
```

### Build

```bash
npm run build                 # Build de producción
npm run build:analyze         # Build con análisis de bundle
```

## Debugging

### React DevTools

Instalar extensión en Chrome/Firefox para:

- Inspeccionar component tree
- Ver props y state
- Identificar re-renders

### React Query DevTools

Activar en desarrollo:

```typescript
// src/components/providers/QueryProvider.tsx
<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### VS Code Debugging

Configuración en `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

## Solución de Problemas Comunes

### "Module not found"

```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### "Type error in ..."

```bash
# Verificar tipos
npm run type-check

# Limpiar caché de TypeScript
rm -rf tsconfig.tsbuildinfo
```

### "Database connection error"

- Verificar `DATABASE_URL` en `.env.local`
- Verificar que Supabase esté activo
- Verificar IP whitelist en Supabase

### "Test database error"

- NUNCA usar DATABASE_URL de `.env.local` para tests
- Usar `npm run test:docker:setup` para tests
- Verificar Docker está corriendo

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Contacto

Para dudas sobre desarrollo:

- Ver [AGENTS.md](/AGENTS.md) para agentes AI
- Crear issue en GitHub
