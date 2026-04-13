/**
 * FilterSidebar Component
 * Sidebar with filters for the product catalog
 * Mobile: Collapsible drawer
 * Desktop: Sticky sidebar
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";

const CATEGORIAS = [
  { value: "", label: "Todas las categorías" },
  { value: "DECORATION", label: "Decoración" },
  { value: "ACCESSORIES", label: "Accesorios" },
  { value: "FUNCTIONAL", label: "Funcional" },
  { value: "ARTICULATED", label: "Articulados" },
  { value: "TOYS", label: "Juguetes" },
];

const MATERIALES = [
  { value: "", label: "Todos los materiales" },
  { value: "PLA", label: "PLA" },
  { value: "PETG", label: "PETG" },
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

interface FilterContentProps {
  hasActiveFilters: boolean;
  clearFilters: () => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: "category" | "material" | "price" | "stock") => void;
  searchParams: FilterSidebarProps['searchParams'];
  updateFilter: (key: string, value: string) => void;
  setIsOpen: (open: boolean) => void;
  activeFiltersCount: number;
}

function FilterContent({
  hasActiveFilters,
  clearFilters,
  expandedSections,
  toggleSection,
  searchParams,
  updateFilter,
  setIsOpen,
  activeFiltersCount,
}: Readonly<FilterContentProps>) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors min-h-[36px]"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Category - Collapsible on mobile */}
      <div className="mb-6 border-b border-gray-100 pb-6 lg:border-0 lg:pb-0">
        <button
          onClick={() => toggleSection("category")}
          className="flex items-center justify-between w-full mb-3 text-left lg:cursor-default lg:pointer-events-none"
        >
          <span className="text-sm font-medium text-gray-700">Categoría</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform lg:hidden ${expandedSections.category ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={`${expandedSections.category ? "block" : "hidden lg:block"}`}
        >
          <select
            value={searchParams.category || ""}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white min-h-[44px]"
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Material */}
      <div className="mb-6 border-b border-gray-100 pb-6 lg:border-0 lg:pb-0">
        <button
          onClick={() => toggleSection("material")}
          className="flex items-center justify-between w-full mb-3 text-left lg:cursor-default lg:pointer-events-none"
        >
          <span className="text-sm font-medium text-gray-700">Material</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform lg:hidden ${expandedSections.material ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={`${expandedSections.material ? "block" : "hidden lg:block"}`}
        >
          <select
            value={searchParams.material || ""}
            onChange={(e) => updateFilter("material", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white min-h-[44px]"
          >
            {MATERIALES.map((mat) => (
              <option key={mat.value} value={mat.value}>
                {mat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price range */}
      <div className="mb-6 border-b border-gray-100 pb-6 lg:border-0 lg:pb-0">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full mb-3 text-left lg:cursor-default lg:pointer-events-none"
        >
          <span className="text-sm font-medium text-gray-700">Precio</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform lg:hidden ${expandedSections.price ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={`${expandedSections.price ? "block" : "hidden lg:block"}`}
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="minPriceInput" className="text-xs text-gray-500 mb-1.5 block">Mín</label>
              <input
                id="minPriceInput"
                type="number"
                placeholder="0"
                value={searchParams.minPrice || ""}
                onChange={(e) => updateFilter("minPrice", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                min="0"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="maxPriceInput" className="text-xs text-gray-500 mb-1.5 block">Máx</label>
              <input
                id="maxPriceInput"
                type="number"
                placeholder="∞"
                value={searchParams.maxPrice || ""}
                onChange={(e) => updateFilter("maxPrice", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* In stock */}
      <div className="mb-2">
        <button
          onClick={() => toggleSection("stock")}
          className="flex items-center justify-between w-full mb-3 text-left lg:hidden"
        >
          <span className="text-sm font-medium text-gray-700">
            Disponibilidad
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${expandedSections.stock ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={`${expandedSections.stock ? "block" : "hidden lg:block"}`}
        >
          <label className="flex items-center gap-3 cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]">
            <input
              type="checkbox"
              id="inStockFilter"
              checked={searchParams.inStock === "true"}
              onChange={(e) =>
                updateFilter("inStock", e.target.checked ? "true" : "")
              }
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <span className="text-sm text-gray-700">Solo en stock</span>
          </label>
        </div>
      </div>

      {/* Mobile Apply Button */}
      <button
        onClick={() => setIsOpen(false)}
        className="lg:hidden w-full bg-indigo-600 text-white py-3.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-6 min-h-[48px]"
      >
        Ver {activeFiltersCount > 0 ? `${activeFiltersCount} ` : ""}resultados
      </button>
    </>
  );
}

export default function FilterSidebar({ searchParams }: Readonly<FilterSidebarProps>) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    material: true,
    price: true,
    stock: true,
  });

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(currentSearchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset page when changing filters
    params.delete("page");

    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/products");
    setIsOpen(false);
  };

  const toggleSection = (section: "category" | "material" | "price" | "stock") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const hasActiveFilters =
    searchParams.category ||
    searchParams.material ||
    searchParams.minPrice ||
    searchParams.maxPrice ||
    searchParams.inStock;

  const activeFiltersCount = [
    searchParams.category,
    searchParams.material,
    searchParams.minPrice,
    searchParams.maxPrice,
    searchParams.inStock,
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors min-h-[48px]"
        >
          <SlidersHorizontal className="h-5 w-5" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block bg-white rounded-xl shadow-md p-6 sticky top-24">
        <FilterContent
          hasActiveFilters={!!hasActiveFilters}
          clearFilters={clearFilters}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          searchParams={searchParams}
          updateFilter={updateFilter}
          setIsOpen={setIsOpen}
          activeFiltersCount={activeFiltersCount}
        />
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar filtros"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white z-50 lg:hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar filtros"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent
                hasActiveFilters={!!hasActiveFilters}
                clearFilters={clearFilters}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                searchParams={searchParams}
                updateFilter={updateFilter}
                setIsOpen={setIsOpen}
                activeFiltersCount={activeFiltersCount}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
