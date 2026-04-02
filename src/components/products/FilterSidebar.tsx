/**
 * FilterSidebar Component
 * Sidebar con filtros para el catálogo de productos
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIAS = [
  { value: '', label: 'Todas las categorías' },
  { value: 'DECORACION', label: 'Decoración' },
  { value: 'ACCESORIOS', label: 'Accesorios' },
  { value: 'FUNCIONAL', label: 'Funcional' },
  { value: 'ARTICULADOS', label: 'Articulados' },
  { value: 'JUGUETES', label: 'Juguetes' },
];

const MATERIALES = [
  { value: '', label: 'Todos los materiales' },
  { value: 'PLA', label: 'PLA' },
  { value: 'PETG', label: 'PETG' },
];

interface FilterSidebarProps {
  searchParams: {
    category?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  };
}

export default function FilterSidebar({ searchParams }: FilterSidebarProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Resetear página al cambiar filtros
    params.delete('page');
    
    router.push(`/products?${params.toString()}`);
  };
  
  const limpiarFiltros = () => {
    router.push('/products');
  };
  
  const hayFiltrosActivos = 
    searchParams.category || 
    searchParams.material || 
    searchParams.minPrice || 
    searchParams.maxPrice || 
    searchParams.inStock;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        {hayFiltrosActivos && (
          <button
            onClick={limpiarFiltros}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Limpiar
          </button>
        )}
      </div>
      
      {/* Categoría */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoría
        </label>
        <select
          value={searchParams.category || ''}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {CATEGORIAS.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Material */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Material
        </label>
        <select
          value={searchParams.material || ''}
          onChange={(e) => updateFilter('material', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {MATERIALES.map((mat) => (
            <option key={mat.value} value={mat.value}>
              {mat.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Rango de price */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Precio
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min €"
            value={searchParams.minPrice || ''}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            min="0"
          />
          <input
            type="number"
            placeholder="Max €"
            value={searchParams.maxPrice || ''}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            min="0"
          />
        </div>
      </div>
      
      {/* En stock */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={searchParams.inStock === 'true'}
            onChange={(e) => updateFilter('inStock', e.target.checked ? 'true' : '')}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">Solo en stock</span>
        </label>
      </div>
    </div>
  );
}
