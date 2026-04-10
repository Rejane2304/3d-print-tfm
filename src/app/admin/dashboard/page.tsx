/**
 * Admin Panel Page
 * Show analytics and statistics for the store
 */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  Calendar,
  ChevronDown,
  FolderTree,
  HelpCircle,
  MessageSquare,
  Ticket,
  Settings,
  Bell,
  Truck,
  FileText,
} from "lucide-react";

interface AnalyticsData {
  salesSummary: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    total: number;
  };
  orderStats: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: Record<string, number>;
  };
  customerStats: {
    total: number;
    newThisMonth: number;
    active: number;
  };
  topProducts: Array<{
    id: string;
    nombre: string;
    vendido: number;
    ingresos: number;
    stock: number;
  }>;
  topCustomers: Array<{
    id: string;
    nombre: string;
    pedidos: number;
    gastado: number;
  }>;
  recentOrders: Array<{
    id: string;
    numeroPedido: string;
    clienteNombre: string;
    total: number;
    estado: string;
    creadoEn: string;
  }>;
}

type DateRange = "today" | "week" | "month" | "lastMonth" | "year";

export default function AdminPanelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("month");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/dashboard");
      return;
    }

    const user = session?.user as { rol?: string } | undefined;
    if (status === "authenticated" && user?.rol !== "ADMIN") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "0.00 €";
    return `${Number(amount).toFixed(2)} €`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES");
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      // Spanish status names (translated from API)
      Pendiente: "bg-yellow-100 text-yellow-800",
      Confirmado: "bg-blue-100 text-blue-800",
      "En preparación": "bg-purple-100 text-purple-800",
      Enviado: "bg-indigo-100 text-indigo-800",
      Entregado: "bg-green-100 text-green-800",
      Cancelado: "bg-red-100 text-red-800",
      // Legacy English status names (for backwards compatibility)
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      PREPARING: "bg-purple-100 text-purple-800",
      SHIPPED: "bg-indigo-100 text-indigo-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Error al cargar datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel</h1>
            <p className="text-gray-600 mt-2">
              Resumen de la tienda y estadísticas
            </p>
          </div>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="today">Hoy</option>
              <option value="week">Últimos 7 días</option>
              <option value="month">Este mes</option>
              <option value="lastMonth">Mes anterior</option>
              <option value="year">Este año</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.salesSummary.thisMonth)}
                </p>
                {dateRange === "month" &&
                  analytics.salesSummary.lastMonth > 0 && (
                    <p
                      className={`text-sm mt-1 ${
                        analytics.salesSummary.thisMonth >=
                        analytics.salesSummary.lastMonth
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      vs {formatCurrency(analytics.salesSummary.lastMonth)} mes
                      ant.
                    </p>
                  )}
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.orderStats.thisMonth}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.orderStats.today} hoy
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.customerStats.total}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{analytics.customerStats.newThisMonth} nuevos
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Average Order Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ticket Medio
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    analytics.orderStats.thisMonth > 0
                      ? analytics.salesSummary.thisMonth /
                          analytics.orderStats.thisMonth
                      : 0,
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1">por pedido</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-indigo-500" />
                Productos Más Vendidos
              </h3>
            </div>
            <div className="p-6">
              {analytics.topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay datos de ventas
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                        {index + 1}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {product.nombre}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span className="mr-3">
                            {product.vendido} vendidos
                          </span>
                          <span>{formatCurrency(product.ingresos)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            product.stock > 5
                              ? "bg-green-100 text-green-800"
                              : product.stock > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock} en stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                Últimos Pedidos
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {analytics.recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay pedidos recientes
                </p>
              ) : (
                analytics.recentOrders.map((order) => (
                  <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          #{order.numeroPedido}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.clienteNombre}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total)}
                        </p>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full ${getStatusBadge(order.estado)}`}
                        >
                          {order.estado}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(order.creadoEn)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <Link
                href="/admin/orders"
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                Ver todos los pedidos →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links - Orden alfabético */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link
            href="/admin/alerts"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <Bell className="h-6 w-6 text-red-600 mb-2" />
            <p className="font-medium text-gray-900">Alertas</p>
            <p className="text-sm text-gray-500">Notificaciones del sistema</p>
          </Link>
          <Link
            href="/admin/categories"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <FolderTree className="h-6 w-6 text-teal-600 mb-2" />
            <p className="font-medium text-gray-900">Categorías</p>
            <p className="text-sm text-gray-500">Gestionar categorías</p>
          </Link>
          <Link
            href="/admin/clients"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <Users className="h-6 w-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Clientes</p>
            <p className="text-sm text-gray-500">Ver clientes</p>
          </Link>
          <Link
            href="/admin/site-config"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <Settings className="h-6 w-6 text-gray-600 mb-2" />
            <p className="font-medium text-gray-900">Configuración</p>
            <p className="text-sm text-gray-500">Ajustes del sitio</p>
          </Link>
          <Link
            href="/admin/coupons"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <Ticket className="h-6 w-6 text-indigo-600 mb-2" />
            <p className="font-medium text-gray-900">Cupones</p>
            <p className="text-sm text-gray-500">Códigos descuento</p>
          </Link>
          <Link
            href="/admin/shipping"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <Truck className="h-6 w-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Envíos</p>
            <p className="text-sm text-gray-500">Zonas y tarifas</p>
          </Link>
          <Link
            href="/admin/invoices"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <FileText className="h-6 w-6 text-orange-600 mb-2" />
            <p className="font-medium text-gray-900">Facturas</p>
            <p className="text-sm text-gray-500">Gestión de facturas</p>
          </Link>
          <Link
            href="/admin/faqs"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <HelpCircle className="h-6 w-6 text-yellow-600 mb-2" />
            <p className="font-medium text-gray-900">FAQs</p>
            <p className="text-sm text-gray-500">Preguntas frecuentes</p>
          </Link>
          <Link
            href="/admin/inventory"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Inventario</p>
            <p className="text-sm text-gray-500">Control de stock</p>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <ShoppingBag className="h-6 w-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Pedidos</p>
            <p className="text-sm text-gray-500">Ver y gestionar</p>
          </Link>
          <Link
            href="/admin/products"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <Package className="h-6 w-6 text-indigo-600 mb-2" />
            <p className="font-medium text-gray-900">Productos</p>
            <p className="text-sm text-gray-500">Gestionar catálogo</p>
          </Link>
          <Link
            href="/admin/reviews"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <MessageSquare className="h-6 w-6 text-pink-600 mb-2" />
            <p className="font-medium text-gray-900">Reseñas</p>
            <p className="text-sm text-gray-500">Opiniones clientes</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
