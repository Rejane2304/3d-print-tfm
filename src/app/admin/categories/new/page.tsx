/**
 * New Category Page - Admin
 * Form for creating a new category
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FolderTree,
  ImageIcon,
  Loader2,
  Save,
  Upload,
  X,
} from 'lucide-react';

export default function NuevaCategoriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/admin/categories/new');
      return;
    }

    const user = session?.user as { role?: string } | undefined;
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleImageUpload = async(e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    try {
      // Create temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setImagePreview(tempUrl);

      // In production, upload to server and get the URL
      // For now, we'll use the temp URL
      setFormData((prev) => ({ ...prev, image: tempUrl }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Error al subir imagen. Intente nuevamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlAdd = () => {
    const url = prompt('Ingrese la URL de la imagen:');
    if (url) {
      setImagePreview(url);
      setFormData((prev) => ({ ...prev, image: url }));
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'El nombre es obligatorio';
    }
    if (!formData.slug.trim()) {
      return 'El slug es obligatorio';
    }
    if (formData.slug.length < 2) {
      return 'El slug debe tener al menos 2 caracteres';
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
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          image: formData.image || null,
          displayOrder: Number(formData.displayOrder),
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear categoría');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/categories');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría');
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
                href="/admin/categories"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Nueva Categoría
                </h1>
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
                        href="/admin/categories"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Categorías
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
              Categoría creada exitosamente. Redirigiendo...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Información básica */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Información de la Categoría
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nombre de la categoría *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Decoración"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="slug"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Slug *
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="decoracion"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Usado en URLs: /categoria/{'{slug}'}
                  </p>
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

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Descripción de la categoría..."
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Máximo 500 caracteres
                  </p>
                </div>
              </div>
            </div>

            {/* Imagen */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Imagen de la Categoría
              </h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <label
                    htmlFor="imageUpload"
                    className="flex-1 cursor-pointer"
                  >
                    <input
                      type="file"
                      id="imageUpload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                      <Upload className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                      </span>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={handleImageUrlAdd}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    URL
                  </button>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-48 h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Vista previa"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {!imagePreview && (
                  <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Sin imagen</p>
                    </div>
                  </div>
                )}
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
                  Categoría activa (visible en la tienda)
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Link
                href="/admin/categories"
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
                Crear Categoría
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
