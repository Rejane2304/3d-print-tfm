/**
 * Admin Inventory Page
 * Manage product stock with real-time adjustments
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Search, Package, AlertTriangle, CheckCircle, Plus, Minus, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  stock: number;
  minStock: number;
  price: number;
  category: string;
  isActive: boolean;
  stockStatus: 'normal' | 'low' | 'critical';
  movementCount: number;
  lastMovementAt: string | null;
  lastMovementType: string | null;
  imagenes?: Array<{ url: string }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminInventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockLevel, setStockLevel] = useState('all');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/inventory');
      return;
    }

    const user = session?.user as { rol?: string } | undefined;
    if (status === 'authenticated' && user?.rol !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, pagination.page, search, stockLevel]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        stockLevel,
      });

      const response = await fetch(`/api/admin/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchInventory();
  };

  const openAdjustModal = (product: Product, type: 'IN' | 'OUT' | 'ADJUST') => {
    setAdjustingProduct(product);
    setAdjustmentType(type);
    setAdjustmentQuantity(type === 'ADJUST' ? product.stock.toString() : '');
    setAdjustmentReason('');
  };

  const closeAdjustModal = () => {
    setAdjustingProduct(null);
    setAdjustmentQuantity('');
    setAdjustmentReason('');
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !adjustmentQuantity || !adjustmentReason) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/inventory/${adjustingProduct.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: adjustmentType,
          quantity: Number.parseInt(adjustmentQuantity),
          reason: adjustmentReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update product in list
        setProducts(products.map(p => 
          p.id === adjustingProduct.id 
            ? { ...p, stock: data.data.product.stock, stockStatus: getStockStatus(data.data.product.stock, p.minStock) }
            : p
        ));
        closeAdjustModal();
      } else {
        alert(data.error || 'Error al ajustar stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStockStatus = (stock: number, minStock: number): 'normal' | 'low' | 'critical' => {
    if (stock <= 0) return 'critical';
    if (stock <= minStock) return 'low';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Bajo';
      case 'critical':
        return 'Crítico';
      default:
        return status;
    }
  };

  if (status === 'loading' || loading) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600 mt-2">Administra el stock de productos en tiempo real</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </form>
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

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mínimo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.imagenes?.[0] ? (
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 flex items-center justify-center overflow-hidden">
                          <Image
                            src={product.imagenes[0].url}
                            alt={product.name}
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
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.movementCount} movimientos</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const stockColorClass = product.stockStatus === 'critical' 
                        ? 'text-red-600' 
                        : product.stockStatus === 'low' 
                          ? 'text-yellow-600' 
                          : 'text-green-600';
                      return (
                        <span className={`text-lg font-bold ${stockColorClass}`}>
                          {product.stock}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.minStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.stockStatus)}`}>
                      {product.stockStatus === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {product.stockStatus === 'normal' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {getStatusLabel(product.stockStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openAdjustModal(product, 'IN')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Agregar stock"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openAdjustModal(product, 'OUT')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Reducir stock"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openAdjustModal(product, 'ADJUST')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Ajustar stock"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/admin/inventory/${product.id}`}
                        className="ml-2 text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        Historial
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} productos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {adjustmentType === 'IN' && 'Agregar Stock'}
              {adjustmentType === 'OUT' && 'Reducir Stock'}
              {adjustmentType === 'ADJUST' && 'Ajustar Stock'}
            </h3>
            
            <form onSubmit={handleAdjustment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <div className="text-gray-900 font-medium">{adjustingProduct.name}</div>
                <div className="text-sm text-gray-500">Stock actual: {adjustingProduct.stock}</div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="adjustmentQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  {adjustmentType === 'ADJUST' ? 'Nuevo Stock' : 'Cantidad'}
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
                <label htmlFor="adjustmentReason" className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
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
                  {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
