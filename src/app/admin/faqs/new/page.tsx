/**
 * New FAQ Page - Admin
 * Form for creating a new FAQ
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Save,
} from 'lucide-react';

// Categorías predefinidas comunes
const PREDEFINED_CATEGORIES = [
  'Materiales',
  'Envío',
  'Devoluciones',
  'Pedidos',
  'Cuidado',
  'Pagos',
  'Seguridad',
  'General',
];

export default function NuevaFAQPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customCategory, setCustomCategory] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/admin/faqs/new');
      return;
    }

    const user = session?.user as { role?: string } | undefined;
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      setCustomCategory(true);
      setFormData((prev) => ({ ...prev, category: '' }));
    } else {
      setCustomCategory(false);
      setFormData((prev) => ({ ...prev, category: value }));
    }
  };

  const validateForm = () => {
    if (!formData.question.trim()) {
      return 'La pregunta es obligatoria';
    }
    if (formData.question.length < 10) {
      return 'La pregunta debe tener al menos 10 caracteres';
    }
    if (!formData.answer.trim()) {
      return 'La respuesta es obligatoria';
    }
    if (formData.answer.length < 20) {
      return 'La respuesta debe tener al menos 20 caracteres';
    }
    if (!formData.category.trim()) {
      return 'La categoría es obligatoria';
    }
    return null;
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          answer: formData.answer,
          category: formData.category,
          displayOrder: Number(formData.displayOrder),
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear FAQ');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/faqs');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear FAQ');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/faqs"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nueva FAQ</h1>
                <nav className="flex mt-1" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm">
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
                      <Link
                        href="/admin/faqs"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        FAQs
                      </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                      <span className="text-gray-900">Nueva</span>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Volver al Panel
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">
              FAQ creada exitosamente. Redirigiendo...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Información básica */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Información de la FAQ
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="question"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pregunta *
                  </label>
                  <input
                    type="text"
                    id="question"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: ¿Cuánto tarda el envío?"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Máximo 500 caracteres
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="answer"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Respuesta *
                  </label>
                  <textarea
                    id="answer"
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Escribe la respuesta detallada..."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Máximo 5000 caracteres. Puedes usar texto simple o formato
                    HTML básico.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Categoría *
                    </label>
                    {!customCategory ? (
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleCategoryChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecciona una categoría</option>
                        {PREDEFINED_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="custom">+ Nueva categoría</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Nombre de la nueva categoría"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomCategory(false);
                            setFormData((prev) => ({ ...prev, category: '' }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="displayOrder"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Orden de visualización
                    </label>
                    <input
                      type="number"
                      id="displayOrder"
                      name="displayOrder"
                      value={formData.displayOrder}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Menor número = aparece primero
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Configuración
              </h2>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  FAQ activa (visible en la página de ayuda)
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Link
                href="/admin/faqs"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 max-w-xs px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Crear FAQ
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
