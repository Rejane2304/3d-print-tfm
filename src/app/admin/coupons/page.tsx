/**
 * Admin Coupons Page
 * Coupon management with DataTable
 */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Ticket,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Percent,
  Euro,
  Truck,
  Activity,
} from "lucide-react";
import { DataTable, Column, BulkAction } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Coupon extends Record<string, unknown> {
  id: string;
  _ref: string;
  codigo: string;
  tipo: string;
  tipoRaw: string;
  valor: string;
  valorRaw: number;
  minimoCompra: number | null;
  usosMaximos: number | null;
  usosActuales: number;
  usosRestantes: number | null;
  validoDesde: string;
  validoHasta: string;
  activo: boolean;
  estado: string;
  creadoEn: string;
  actualizadoEn: string;
}

export default function AdminCouponsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/coupons");
      return;
    }

    if (status === "authenticated") {
      const user = session?.user as { role?: string } | undefined;
      if (user?.role !== "ADMIN") {
        router.push("/");
        return;
      }
      loadCoupons();
    }
  }, [status, session, router]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/coupons");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando cupones");
      }

      setCoupons(data.coupons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;

    try {
      const response = await fetch(`/api/admin/coupons/${couponToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setCoupons(coupons.filter((c) => c.id !== couponToDelete.id));
      } else {
        throw new Error(data.error || "Error eliminando cupón");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando cupón");
    } finally {
      setModalOpen(false);
      setCouponToDelete(null);
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    try {
      let hasError = false;

      await Promise.all(
        selectedIds.map(async (id) => {
          const response = await fetch(`/api/admin/coupons/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) {
            hasError = true;
          }
        }),
      );

      if (hasError) {
        setError("Algunos cupones no pudieron ser eliminados");
      }

      setCoupons(coupons.filter((c) => !selectedIds.includes(c.id)));
    } catch {
      setError("Error eliminando cupones");
    }
  };

  // Estadísticas
  const activeCoupons = coupons.filter((c) => c.estado === "Activo").length;
  const totalUses = coupons.reduce((sum, c) => sum + c.usosActuales, 0);
  const percentageCoupons = coupons.filter(
    (c) => c.tipoRaw === "PERCENTAGE",
  ).length;

  const getTypeIcon = (tipoRaw: string) => {
    switch (tipoRaw) {
      case "PERCENTAGE":
        return <Percent className="h-4 w-4" />;
      case "FIXED":
        return <Euro className="h-4 w-4" />;
      case "FREE_SHIPPING":
        return <Truck className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Activo":
        return "bg-green-100 text-green-800";
      case "Inactivo":
        return "bg-gray-100 text-gray-800";
      case "Expirado":
        return "bg-red-100 text-red-800";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "Agotado":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: Column<Coupon>[] = [
    {
      key: "codigo",
      header: "Código",
      sortable: true,
      className: "",
      render: (_, coupon) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(coupon.tipoRaw)}
          <span className="font-mono font-medium text-gray-900 text-sm">
            {coupon.codigo}
          </span>
        </div>
      ),
    },
    {
      key: "tipoValor",
      header: "Tipo/Valor",
      sortable: true,
      className: "",
      render: (_, coupon) => (
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">{coupon.tipo}</span>
          <span className="font-medium text-indigo-600 text-sm">
            {coupon.valor}
          </span>
        </div>
      ),
    },
    {
      key: "minimoCompra",
      header: "Mín.",
      sortable: true,
      className: "hidden sm:table-cell",
      render: (value) =>
        value ? (
          <span className="text-sm text-gray-600">
            {Number(value).toFixed(0)}€
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        ),
    },
    {
      key: "usos",
      header: "Usos",
      sortable: true,
      className: "hidden md:table-cell",
      render: (_, coupon) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-900">
            {coupon.usosActuales}
            {coupon.usosMaximos !== null && (
              <span className="text-gray-400">/{coupon.usosMaximos}</span>
            )}
          </span>
          {coupon.usosRestantes !== null && coupon.usosRestantes > 0 && (
            <span className="text-[10px] text-gray-500">
              {coupon.usosRestantes} rest.
            </span>
          )}
        </div>
      ),
    },
    {
      key: "validoHasta",
      header: "Expira",
      sortable: true,
      className: "hidden lg:table-cell",
      render: (value) => {
        const date = new Date(value as string);
        const now = new Date();
        const isExpired = date < now;
        return (
          <div className="flex items-center gap-1">
            <span
              className={`text-xs ${isExpired ? "text-red-600" : "text-gray-600"}`}
            >
              {date.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      className: "hidden xl:table-cell",
      render: (value) => (
        <span
          className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${getStatusColor(value as string)}`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "",
      render: (_, coupon) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/coupons/${coupon.id}`}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Editar"
          >
            <Edit className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(coupon);
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: "delete",
      label: "Eliminar seleccionados",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "danger",
      onClick: handleBulkDelete,
    },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando cupones...</p>
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
            <div className="flex items-center gap-3">
              <Ticket className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Cupones
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Volver al Panel
              </Link>
              <Link
                href="/admin/coupons/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nuevo Cupón
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link
                href="/admin/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                Panel
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-900 font-medium">Cupones</span>
            </li>
          </ol>
        </nav>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Ticket className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cupones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeCoupons}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">De Porcentaje</p>
                <p className="text-2xl font-bold text-blue-600">
                  {percentageCoupons}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Usos Totales</p>
                <p className="text-2xl font-bold text-purple-600">
                  {totalUses}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          data={coupons}
          columns={columns}
          rowKey="id"
          searchable={true}
          searchKeys={["codigo", "tipo"]}
          searchPlaceholder="Buscar cupones..."
          pagination={true}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={25}
          selectable={true}
          bulkActions={bulkActions}
          exportable={true}
          exportFilename="cupones.csv"
          loading={loading}
          emptyMessage="No se encontraron cupones"
          noResultsMessage="Ningún cupón coincide con tu búsqueda"
          onRowClick={(coupon) => router.push(`/admin/coupons/${coupon.id}`)}
        />
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCouponToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar Cupón?"
        description="Esta acción no se puede deshacer. El cupón será eliminado permanentemente."
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
