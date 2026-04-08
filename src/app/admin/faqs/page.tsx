/**
 * Admin FAQs Page
 * FAQ management with DataTable
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  HelpCircle,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { DataTable, Column, BulkAction } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface FAQ extends Record<string, unknown> {
  id: string;
  _ref: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  ordenVisualizacion: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export default function AdminFAQsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/faqs');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { rol?: string } | undefined;
      if (user?.rol !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadFAQs();
    }
  }, [status, session, router]);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/faqs');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando FAQs');
      }

      setFaqs(data.faqs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (faq: FAQ) => {
    setFaqToDelete(faq);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!faqToDelete) return;

    try {
      const response = await fetch(`/api/admin/faqs/${faqToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setFaqs(faqs.filter(f => f.id !== faqToDelete.id));
      } else {
        throw new Error(data.error || 'Error eliminando FAQ');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando FAQ');
    } finally {
      setModalOpen(false);
      setFaqToDelete(null);
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    try {
      let hasError = false;
      
      await Promise.all(
        selectedIds.map(async (id) => {
          const response = await fetch(`/api/admin/faqs/${id}`, { 
            method: 'DELETE' 
          });
          if (!response.ok) {
            hasError = true;
          }
        })
      );
      
      if (hasError) {
        setError('Algunas FAQs no pudieron ser eliminadas');
      }
      
      setFaqs(faqs.filter(f => !selectedIds.includes(f.id)));
    } catch {
      setError('Error eliminando FAQs');
    }
  };

  // Extraer categorías únicas para estadísticas
  const categories = Array.from(new Set(faqs.map(f => f.categoria)));

  const columns: Column<FAQ>[] = [
    {
      key: 'pregunta',
      header: 'Pregunta',
      sortable: true,
      className: '',
      render: (_, faq) => (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-gray-900 line-clamp-2 max-w-md">
            {faq.pregunta}
          </span>
          <span className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-md hidden sm:block">
            {faq.respuesta.substring(0, 100)}...
          </span>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {value as string}
        </span>
      ),
    },
    {
      key: 'ordenVisualizacion',
      header: 'Orden',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value as number}
        </span>
      ),
    },
    {
      key: 'activo',
      header: 'Estado',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (value) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: '',
      render: (_, faq) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/faqs/${faq.id}`}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(faq);
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
          <p className="text-gray-600">Cargando FAQs...</p>
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
              <HelpCircle className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de FAQs</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Volver al Panel
              </Link>
              <Link
                href="/admin/faqs/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nueva FAQ
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
              <span className="text-gray-900 font-medium">FAQs</span>
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
            <p className="text-sm text-gray-500">Total FAQs</p>
            <p className="text-2xl font-bold text-gray-900">{faqs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Activas</p>
            <p className="text-2xl font-bold text-green-600">
              {faqs.filter(f => f.activo).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Inactivas</p>
            <p className="text-2xl font-bold text-gray-600">
              {faqs.filter(f => !f.activo).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Categorías</p>
            <p className="text-2xl font-bold text-blue-600">
              {categories.length}
            </p>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          data={faqs}
          columns={columns}
          rowKey="id"
          searchable={true}
          searchKeys={['pregunta', 'respuesta', 'categoria']}
          searchPlaceholder="Buscar FAQs..."
          pagination={true}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={25}
          selectable={true}
          bulkActions={bulkActions}
          exportable={true}
          exportFilename="faqs.csv"
          loading={loading}
          emptyMessage="No se encontraron FAQs"
          noResultsMessage="Ninguna FAQ coincide con tu búsqueda"
          onRowClick={(faq) => router.push(`/admin/faqs/${faq.id}`)}
        />
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFaqToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar FAQ?"
        description="Esta acción no se puede deshacer. La pregunta frecuente será eliminada permanentemente."
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
