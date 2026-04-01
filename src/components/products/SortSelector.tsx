/**
 * SortSelector Component
 * Client Component para el selector de ordenamiento
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface SortSelectorProps {
  initialOrdenar?: string;
  initialOrden?: string;
}

export default function SortSelector({ initialOrdenar = 'nombre', initialOrden = 'asc' }: SortSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleOrdenarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('ordenar', e.target.value);
    params.delete('page');
    router.push(`/productos?${params.toString()}`);
  };

  const handleOrdenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('orden', e.target.value);
    params.delete('page');
    router.push(`/productos?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Ordenar por:</label>
      <select
        defaultValue={initialOrdenar}
        onChange={handleOrdenarChange}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
      >
        <option value="nombre">Nombre</option>
        <option value="precio">Precio</option>
        <option value="stock">Stock</option>
      </select>
      
      <select
        defaultValue={initialOrden}
        onChange={handleOrdenChange}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
      >
        <option value="asc">Ascendente</option>
        <option value="desc">Descendente</option>
      </select>
    </div>
  );
}
