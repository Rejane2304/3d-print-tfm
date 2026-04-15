/**
 * Admin Products Page
 * Product management with DataTable
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Edit, Loader2, Package, Plus, Trash2, Upload } from 'lucide-react';
import type { BulkAction, Column } from '@/components/ui/DataTable';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BulkDeleteModal } from '@/components/ui/BulkDeleteModal';
import { CSVUpload } from '@/components/ui/CSVUpload';
import { useAdminRealTime, useNotificationToast } from '@/hooks/useRealTime';
import { Toaster } from '@/components/ui/Toaster';

interface Product extends Record<string, unknown> {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  material: string;
  activo: boolean;
  imagenes: Array<{ url: string }>;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedIdsToDelete, setSelectedIdsToDelete] = useState<string[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Real-time setup
  const { pendingEvents, acknowledgeEvents, isConnected } = useAdminRealTime();
  const { notifications, showNotification, removeNotification } = useNotificationToast();

  // Listen for real-time events
  useEffect(() => {
    if (pendingEvents.length > 0) {
      pendingEvents.forEach(event => {
        // Show notification for stock alerts
        if (event.type === 'stock:alert' || event.type === 'stock:low') {
          showNotification(event);
          // Refresh products data
          loadProducts();
        }
      });
      // Acknowledge events
      acknowledgeEvents(pendingEvents.map(e => e.timestamp));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEvents]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/admin/products');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { role?: string } | undefined;
      if (user?.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadProducts();
    }
  }, [status, session, router]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/products');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar productos');
      }

      setProducts(data.productos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productToDelete));
      }
    } catch {
      setError('Error al eliminar producto');
    } finally {
      setModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    setSelectedIdsToDelete(selectedIds);
    setSelectedCount(selectedIds.length);
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await Promise.all(selectedIdsToDelete.map(id => fetch(`/api/admin/products/${id}`, { method: 'DELETE' })));
      setProducts(products.filter(p => !selectedIdsToDelete.includes(p.id)));
    } catch {
      setError('Error al eliminar productos');
    } finally {
      setBulkDeleteModalOpen(false);
      setSelectedIdsToDelete([]);
      setSelectedCount(0);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'nombre',
      header: 'Producto',
      sortable: true,
      className: '',
      render: (_, product) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {product.imagenes?.[0] ? (
              <Image
                className="h-10 w-10 object-cover rounded-lg"
                src={product.imagenes[0].url}
                alt={product.nombre}
                width={40}
                height={40}
                unoptimized
              />
            ) : (
              <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <div className="ml-4 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{product.nombre}</div>
            <div className="text-xs text-gray-500">{product.material}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      sortable: true,
      className: 'hidden sm:table-cell',
    },
    {
      key: 'precio',
      header: 'Precio',
      sortable: true,
      className: '',
      render: value => `${Number(value).toFixed(2)} €`,
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      className: 'hidden md:table-cell',
      render: value => <span className={Number(value) <= 5 ? 'text-red-600 font-medium' : ''}>{String(value)}</span>,
    },
    {
      key: 'activo',
      header: 'Estado',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: value => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: '',
      render: (_, product) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/products/${product.slug}/editar`}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
            title="Editar"
            onClick={e => e.stopPropagation()}
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={e => {
              e.stopPropagation();
              handleDelete(product.id);
            }}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: 'Eliminar seleccionados',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: handleBulkDelete,
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
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
              <Package className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
                ← Volver al Panel
              </Link>
              <button
                onClick={() => setImportModalOpen(true)}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-5 w-5" />
                Importar CSV
              </button>
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nuevo Producto
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* DataTable */}
        <DataTable
          data={products}
          columns={columns}
          rowKey="id"
          searchable={true}
          searchKeys={['nombre', 'categoria', 'material']}
          searchPlaceholder="Buscar productos..."
          pagination={true}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={25}
          selectable={true}
          bulkActions={bulkActions}
          exportable={true}
          exportFilename="products.csv"
          loading={loading}
          emptyMessage="No se encontraron productos"
          noResultsMessage="Ningún producto coincide con tu búsqueda"
          onRowClick={product => router.push(`/admin/products/${product.slug}/editar`)}
        />
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar producto?"
        description="Esta acción no se puede deshacer. El producto será eliminado permanentemente."
        confirmText="Eliminar"
        type="danger"
      />

      <BulkDeleteModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => {
          setBulkDeleteModalOpen(false);
          setSelectedIdsToDelete([]);
          setSelectedCount(0);
        }}
        onConfirm={confirmBulkDelete}
        selectedCount={selectedCount}
        itemType="products"
        itemName="producto"
        itemNamePlural="productos"
        hasAssociatedItems={false}
      />

      {/* Import CSV Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CSVUpload
              title="Importar Productos"
              description="Sube un archivo CSV con los productos a importar. La categoría debe existir previamente."
              requiredColumns={['name', 'description', 'price', 'stock', 'category', 'material', 'slug']}
              apiEndpoint="/api/admin/products/import"
              onSuccess={() => {
                setImportModalOpen(false);
                loadProducts();
              }}
              onCancel={() => setImportModalOpen(false)}
            />
          </div>
        </div>
      )}
      {/* Real-time Notifications */}
      <Toaster notifications={notifications} onDismiss={removeNotification} />
      {isConnected && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 text-xs rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Tiempo real conectado
          </div>
        </div>
      )}
    </div>
  );
}
