/**
 * SortSelector Component
 * Client Component para el selector de ordenamiento
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface SortSelectorProps {
  initialSortBy?: string;
  initialSortOrder?: string;
}

export default function SortSelector({
  initialSortBy = "nombre",
  initialSortOrder = "asc",
}: SortSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", e.target.value);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortOrder", e.target.value);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Ordenar por:</span>
      <select
        defaultValue={initialSortBy}
        onChange={handleSortByChange}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
      >
        <option value="nombre">Nombre</option>
        <option value="price">Precio</option>
        <option value="stock">Stock</option>
      </select>

      <select
        defaultValue={initialSortOrder}
        onChange={handleSortOrderChange}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
      >
        <option value="asc">Ascendente</option>
        <option value="desc">Descendente</option>
      </select>
    </div>
  );
}
