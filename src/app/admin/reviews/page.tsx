/**
 * Admin Reviews Page
 * Review management with DataTable
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, 
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  Filter,
} from 'lucide-react';
import { DataTable, Column, BulkAction } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StarRating } from '@/components/ui/StarRating';

interface Resena extends Record<string, unknown> {
  id: string;
  _ref: string;
  productoId: string;
  productoNombre: string;
  productoSlug: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  puntuacion: number;
  titulo: string;
  comentario: string;
  verificado: boolean;
  aprobado: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resenaToDelete, setResenaToDelete] = useState<Resena | null>(null);
  const [filters, setFilters] = useState({
    product: '',
    rating: '',
    verified: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/reviews');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { rol?: string } | undefined;
      if (user?.rol !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadResenas();
    }
  }, [status, session, router]);

  const loadResenas = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.verified) params.append('verified', filters.verified);

      const response = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando reseñas');
      }

      // Apply product filter client-side
      let filtered = data.resenas || [];
      if (filters.product) {
        const productFilter = filters.product.toLowerCase();
        filtered = filtered.filter((r: Resena) => 
          r.productoNombre.toLowerCase().includes(productFilter)
        );
      }

      setResenas(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    loadResenas();
  };

  const clearFilters = () => {
    setFilters({ product: '', rating: '', verified: '' });
    loadResenas();
  };

  const toggleVerification = async (resena: Resena) => {
    try {
      const response = await fetch(`/api/admin/reviews/${resena.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !resena.verificado }),
      });

      if (response.ok) {
        setResenas(resenas.map(r => 
          r.id === resena.id ? { ...r, verificado: !r.verificado } : r
        ));
      } else {
        throw new Error('Error actualizando reseña');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando reseña');
    }
  };

  const toggleApproval = async (resena: Resena) => {
    try {
      const response = await fetch(`/api/admin/reviews/${resena.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !resena.aprobado }),
      });

      if (response.ok) {
        setResenas(resenas.map(r => 
          r.id === resena.id ? { ...r, aprobado: !r.aprobado } : r
        ));
      } else {
        throw new Error('Error actualizando reseña');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando reseña');
    }
  };

  const handleDelete = (resena: Resena) => {
    setResenaToDelete(resena);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!resenaToDelete) return;

    try {
      const response = await fetch(`/api/admin/reviews/${resenaToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setResenas(resenas.filter(r => r.id !== resenaToDelete.id));
      } else {
        throw new Error(data.error || 'Error eliminando reseña');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando reseña');
    } finally {
      setModalOpen(false);
      setResenaToDelete(null);
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        setResenas(resenas.filter(r => !selectedIds.includes(r.id)));
      } else {
        throw new Error('Error eliminando reseñas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando reseñas');
    }
  };

  // Calculate statistics
  const avgRating = resenas.length > 0
    ? resenas.reduce((sum, r) => sum + r.puntuacion, 0) / resenas.length
    : 0;

  const verifiedCount = resenas.filter(r => r.verificado).length;
  const approvedCount = resenas.filter(r => r.aprobado).length;

  const columns: Column<Resena>[] = [
    {
      key: 'productoNombre',
      header: 'Producto',
      sortable: true,
      render: (_, resena) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">
            {resena.productoNombre}
          </span>
          <Link 
            href={`/products/${resena.productoSlug}`}
            className="text-xs text-indigo-600 hover:text-indigo-800"
            onClick={(e) => e.stopPropagation()}
          >
            Ver producto
          </Link>
        </div>
      ),
    },
    {
      key: 'usuarioNombre',
      header: 'Usuario',
      sortable: true,
      render: (_, resena) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {resena.usuarioNombre}
          </span>
          <span className="text-xs text-gray-500">
            {resena.usuarioEmail}
          </span>
        </div>
      ),
    },
    {
      key: 'puntuacion',
      header: 'Puntuación',
      sortable: true,
      render: (_, resena) => (
        <div className="flex items-center gap-1">
          <StarRating rating={resena.puntuacion} size="sm" />
          <span className="text-sm text-gray-600 ml-1">({resena.puntuacion})</span>
        </div>
      ),
    },
    {
      key: 'titulo',
      header: 'Reseña',
      sortable: true,
      render: (_, resena) => (
        <div className="flex flex-col max-w-xs">
          <span className="text-sm font-medium text-gray-900 line-clamp-1">
            {resena.titulo}
          </span>
          <span className="text-xs text-gray-500 line-clamp-2">
            {resena.comentario.substring(0, 100)}...
          </span>
        </div>
      ),
    },
    {
      key: 'verificado',
      header: 'Verificado',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Sí
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              No
            </>
          )}
        </span>
      ),
    },
    {
      key: 'aprobado',
      header: 'Estado',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value ? 'Aprobado' : 'Pendiente'}
        </span>
      ),
    },
    {
      key: 'creadoEn',
      header: 'Fecha',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(value as string).toLocaleDateString('es-ES')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, resena) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleVerification(resena);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              resena.verificado
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={resena.verificado ? 'Quitar verificación' : 'Verificar'}
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleApproval(resena);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              resena.aprobado
                ? 'text-green-600 hover:bg-green-50'
                : 'text-yellow-600 hover:bg-yellow-50'
            }`}
            title={resena.aprobado ? 'Ocultar' : 'Mostrar'}
          >
            {resena.aprobado ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(resena);
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <p className="text-gray-600">Cargando reseñas...</p>
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
              <MessageSquare className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Reseñas</h1>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Volver al Panel
            </Link>
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
              <span className="text-gray-900 font-medium">Reseñas</span>
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
            <p className="text-sm text-gray-500">Total Reseñas</p>
            <p className="text-2xl font-bold text-gray-900">{resenas.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Puntuación Media</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-indigo-600">{avgRating.toFixed(1)}</p>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Verificadas</p>
            <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Aprobadas</p>
            <p className="text-2xl font-bold text-blue-600">{approvedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Producto
              </label>
              <input
                type="text"
                value={filters.product}
                onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                placeholder="Buscar por nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Puntuación
              </label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas</option>
                <option value="5">5 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="2">2 estrellas</option>
                <option value="1">1 estrella</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Verificación
              </label>
              <select
                value={filters.verified}
                onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas</option>
                <option value="true">Verificadas</option>
                <option value="false">No verificadas</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Aplicar
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          data={resenas}
          columns={columns}
          rowKey="id"
          searchable={true}
          searchKeys={['productoNombre', 'usuarioNombre', 'titulo', 'comentario']}
          searchPlaceholder="Buscar reseñas..."
          pagination={true}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={25}
          selectable={true}
          bulkActions={bulkActions}
          exportable={true}
          exportFilename="resenas.csv"
          loading={loading}
          emptyMessage="No se encontraron reseñas"
          noResultsMessage="Ninguna reseña coincide con tu búsqueda"
        />
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setResenaToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar reseña?"
        description="Esta acción no se puede deshacer. La reseña será eliminada permanentemente."
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
