/**
 * Admin Inventory Page
 * Manage product stock with DataTable component
 */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Package,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  RotateCcw,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { DataTable, Column, BulkAction } from "@/components/ui/DataTable";

interface Product {
  id: string;
  nombre: string;
  slug: string;
  stock: number;
  minStock: number;
  price: number;
  categoria: string;
  isActive: boolean;
  stockStatus: "normal" | "low" | "critical";
  movementCount: number;
  lastMovementAt: string | null;
  ultimoMovimientoTipo: string | null;
  imagenes?: Array<{ url: string }>;
}

export default function AdminInventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockLevel, setStockLevel] = useState("all");
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(
    null,
  );
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT" | "ADJUST">(
    "IN",
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/inventory");
      return;
    }

    const user = session?.user as { rol?: string } | undefined;
    if (status === "authenticated" && user?.rol !== "ADMIN") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      fetchInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, stockLevel]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        stockLevel,
      });

      const response = await fetch(`/api/admin/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (product: Product, type: "IN" | "OUT" | "ADJUST") => {
    setAdjustingProduct(product);
    setAdjustmentType(type);
    setAdjustmentQuantity(type === "ADJUST" ? product.stock.toString() : "");
    setAdjustmentReason("");
  };

  const closeAdjustModal = () => {
    setAdjustingProduct(null);
    setAdjustmentQuantity("");
    setAdjustmentReason("");
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !adjustmentQuantity || !adjustmentReason) return;

    try {
      setProcessing(true);
      const response = await fetch(
        `/api/admin/inventory/${adjustingProduct.id}/adjust`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: adjustmentType,
            quantity: Number.parseInt(adjustmentQuantity),
            reason: adjustmentReason,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setProducts(
          products.map((p) =>
            p.id === adjustingProduct.id
              ? {
                  ...p,
                  stock: data.data.product.stock,
                  stockStatus: getStockStatus(
                    data.data.product.stock,
                    p.minStock,
                  ),
                }
              : p,
          ),
        );
        closeAdjustModal();
      } else {
        alert(data.error || "Error adjusting stock");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
    } finally {
      setProcessing(false);
    }
  };

  const getStockStatus = (
    stock: number,
    minStock: number,
  ): "normal" | "low" | "critical" => {
    if (stock <= 0) return "critical";
    if (stock <= minStock) return "low";
    return "normal";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "normal":
        return "Normal";
      case "low":
        return "Bajo";
      case "critical":
        return "Crítico";
      default:
        return status;
    }
  };

  const columns: Column<Product>[] = [
    {
      key: "nombre",
      header: "Producto",
      sortable: true,
      className: "",
      render: (value, row) => (
        <div className="flex items-center">
          {row.imagenes?.[0] ? (
            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 flex items-center justify-center overflow-hidden">
              <Image
                src={row.imagenes[0].url}
                alt={row.nombre}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <div className="ml-4 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {value as string}
            </div>
            <div className="text-xs text-gray-500 hidden xl:block">
              {row.movementCount} movimientos
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "categoria",
      header: "Categoría",
      sortable: true,
      className: "hidden sm:table-cell",
      render: (value) => (
        <span className="text-sm text-gray-600 truncate">
          {value as string}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      className: "",
      render: (value, row) => {
        let stockColorClass: string;
        if (row.stockStatus === "critical") {
          stockColorClass = "text-red-600";
        } else if (row.stockStatus === "low") {
          stockColorClass = "text-yellow-600";
        } else {
          stockColorClass = "text-green-600";
        }
        return (
          <span className={`text-lg font-bold ${stockColorClass}`}>
            {value as number}
          </span>
        );
      },
    },
    {
      key: "minStock",
      header: "Mínimo",
      sortable: true,
      className: "hidden md:table-cell",
      render: (value) => (
        <span className="text-sm text-gray-600">{value as number}</span>
      ),
    },
    {
      key: "stockStatus",
      header: "Estado",
      sortable: true,
      className: "hidden lg:table-cell",
      render: (value) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value as string)}`}
        >
          {(value as string) === "critical" && (
            <AlertTriangle className="h-3 w-3 mr-1" />
          )}
          {(value as string) === "normal" && (
            <CheckCircle className="h-3 w-3 mr-1" />
          )}
          {getStatusLabel(value as string)}
        </span>
      ),
    },
    {
      key: "movementCount",
      header: "Movimientos",
      sortable: true,
      className: "hidden xl:table-cell",
      render: (value) => (
        <span className="text-sm text-gray-600">{value as number}</span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openAdjustModal(row, "IN");
            }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
            title="Añadir stock"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openAdjustModal(row, "OUT");
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
            title="Reducir stock"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openAdjustModal(row, "ADJUST");
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Ajustar stock"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <Link
            href={`/admin/inventory/${row.id}`}
            className="ml-1 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
            title="Historial"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: "export",
      label: "Exportar seleccionados",
      variant: "primary",
      onClick: async (selectedIds) => {
        console.log("Export selected:", selectedIds);
      },
    },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Inventario
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Gestionar stock de productos en tiempo real
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              &larr; Volver al Panel
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={stockLevel}
              onChange={(e) => setStockLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los niveles</option>
              <option value="normal">Stock Normal</option>
              <option value="low">Stock Bajo</option>
              <option value="critical">Stock Crítico</option>
            </select>
          </div>
        </div>

        {/* Inventory DataTable */}
        <DataTable<Product>
          data={products}
          columns={columns}
          rowKey="id"
          searchable
          searchKeys={["nombre", "categoria"]}
          searchPlaceholder="Buscar productos..."
          pagination
          selectable
          bulkActions={bulkActions}
          exportable
          exportFilename="inventory.csv"
          emptyMessage="No se encontraron productos"
          noResultsMessage="Ningún producto coincide con tu búsqueda"
        />
      </div>

      {/* Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {adjustmentType === "IN" && "Añadir Stock"}
              {adjustmentType === "OUT" && "Reducir Stock"}
              {adjustmentType === "ADJUST" && "Ajustar Stock"}
            </h3>

            <form onSubmit={handleAdjustment}>
              <div className="mb-4">
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  Producto
                </div>
                <div className="text-gray-900 font-medium">
                  {adjustingProduct.nombre}
                </div>
                <div className="text-sm text-gray-500">
                  Stock actual: {adjustingProduct.stock}
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="adjustmentQuantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {adjustmentType === "ADJUST" ? "Nuevo Stock" : "Cantidad"}
                </label>
                <input
                  id="adjustmentQuantity"
                  type="number"
                  min="0"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="adjustmentReason"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Motivo
                </label>
                <textarea
                  id="adjustmentReason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeAdjustModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {processing && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
