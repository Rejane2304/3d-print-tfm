/**
 * Admin Categories Page
 * Category management with DataTable
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Edit, FolderTree, ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import type { BulkAction, Column } from '@/components/ui/DataTable';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BulkDeleteModal } from '@/components/ui/BulkDeleteModal';

interface Category extends Record<string, unknown> {
  id: string;
  _ref: string;
  nombre: string;
  slug: string;
  descripcion: string;
  imagen: string | null;
  ordenVisualizacion: number;
  activo: boolean;
  totalProductos: number;
  creadoEn: string;
  actualizadoEn: string;
}

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedIdsToDelete, setSelectedIdsToDelete] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/categories');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { role?: string } | undefined;
      if (user?.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadCategories();
    }
  }, [status, session, router]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/categories');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando categorías');
      }

      setCategories(data.categorias || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      } else {
        throw new Error(data.error || 'Error eliminando categoría');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando categoría');
    } finally {
      setModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    setSelectedIdsToDelete(selectedIds);
    setSelectedCount(selectedIds.length);
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      let hasError = false;

      await Promise.all(
        selectedIdsToDelete.map(async id => {
          const response = await fetch(`/api/admin/categories/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            hasError = true;
          }
        }),
      );

      if (hasError) {
        setError('Algunas categorías no pudieron ser eliminadas (posiblemente tienen productos asociados)');
      }

      setCategories(categories.filter(c => !selectedIdsToDelete.includes(c.id)));
    } catch {
      setError('Error eliminando categorías');
    } finally {
      setBulkDeleteModalOpen(false);
      setSelectedIdsToDelete([]);
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'nombre',
      header: 'Categoría',
      sortable: true,
      className: '',
      render: (_, category) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {category.imagen ? (
              <Image
                className="h-10 w-10 object-cover rounded-lg"
                src={category.imagen}
                alt={category.nombre}
                width={40}
                height={40}
                unoptimized
              />
            ) : (
              <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <div className="ml-4 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{category.nombre}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: value => <div className="max-w-xs truncate text-sm text-gray-600">{(value as string) || '-'}</div>,
    },
    {
      key: 'totalProductos',
      header: 'Productos',
      sortable: true,
      className: 'hidden md:table-cell',
      render: value => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            (value as number) > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {value as number}
        </span>
      ),
    },
    {
      key: 'ordenVisualizacion',
      header: 'Orden',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: value => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value as number}
        </span>
      ),
    },
    {
      key: 'activo',
      header: 'Estado',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: value => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: '',
      render: (_, category) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/categories/${category.id}`}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={e => {
              e.stopPropagation();
              handleDelete(category);
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Eliminar"
            disabled={category.totalProductos > 0}
          >
            <Trash2 className={`h-4 w-4 ${category.totalProductos > 0 ? 'cursor-not-allowed' : ''}`} />
          </button>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: 'Eliminar seleccionadas',
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
          <p className="text-gray-600">Cargando categorías...</p>
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
              <FolderTree className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
                ← Volver al Panel
              </Link>
              <Link
                href="/admin/categories/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nueva Categoría
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
              <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                Panel
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-900 font-medium">Categorías</span>
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
            <p className="text-sm text-gray-500">Total Categorías</p>
            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Activas</p>
            <p className="text-2xl font-bold text-green-600">{categories.filter(c => c.activo).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Inactivas</p>
            <p className="text-2xl font-bold text-gray-600">{categories.filter(c => !c.activo).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Con Productos</p>
            <p className="text-2xl font-bold text-blue-600">{categories.filter(c => c.totalProductos > 0).length}</p>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          data={categories}
          columns={columns}
          rowKey="id"
          searchable={true}
          searchKeys={['nombre', 'slug', 'descripcion']}
          searchPlaceholder="Buscar categorías..."
          pagination={true}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={25}
          selectable={true}
          bulkActions={bulkActions}
          exportable={true}
          exportFilename="categories.csv"
          loading={loading}
          emptyMessage="No se encontraron categorías"
          noResultsMessage="Ninguna categoría coincide con tu búsqueda"
          onRowClick={category => router.push(`/admin/categories/${category.id}`)}
        />
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar categoría?"
        description={
          categoryToDelete?.totalProductos && categoryToDelete.totalProductos > 0
            ? `Esta categoría tiene ${categoryToDelete.totalProductos} producto(s) asociado(s). Debes reasignar los productos antes de eliminarla.`
            : 'Esta acción no se puede deshacer. La categoría será eliminada permanentemente.'
        }
        confirmText="Eliminar"
        type={categoryToDelete?.totalProductos && categoryToDelete.totalProductos > 0 ? 'warning' : 'danger'}
        confirmDisabled={categoryToDelete?.totalProductos ? categoryToDelete.totalProductos > 0 : false}
      />

      <BulkDeleteModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => {
          setBulkDeleteModalOpen(false);
          setSelectedIdsToDelete([]);
        }}
        onConfirm={confirmBulkDelete}
        selectedCount={selectedCount}
        itemType="categories"
        itemName="categoría"
        itemNamePlural="categorías"
        hasAssociatedItems={true}
        associatedItemType="productos"
      />
    </div>
  );
}
