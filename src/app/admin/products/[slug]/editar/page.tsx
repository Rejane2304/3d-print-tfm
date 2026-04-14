/**
 * Edit Product Page - Admin
 * Formulario para editar producto existente con CRUD completo de imágenes
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Package, Save } from 'lucide-react';
import type { ProductImage } from '@/components/admin/ProductImageManager';
import { ProductImageManager } from '@/components/admin/ProductImageManager';

interface Category {
  id: string;
  nombre: string;
}

const MATERIALES = ['PLA', 'PETG', 'ABS', 'TPU', 'RESINA', 'NYLON', 'FIBRA_CARBONO', 'PC', 'ASA'];

export default function EditarProductoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    previousPrice: '',
    stock: '',
    minStock: '5',
    categoryId: '',
    material: 'PLA',
    widthCm: '',
    heightCm: '',
    depthCm: '',
    weight: '',
    printTime: '',
    isActive: true,
    isFeatured: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/admin/products');
      return;
    }

    const user = session?.user as { role?: string } | undefined;
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && slug) {
      loadCategories();
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, slug]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${slug}`);
      if (!response.ok) {
        throw new Error('Error al cargar producto');
      }
      const data = await response.json();

      if (data.success && data.producto) {
        const p = data.producto;
        setFormData({
          name: p.nombre || '',
          slug: p.slug || '',
          description: p.descripcion || '',
          shortDescription: p.descripcionCorta || '',
          price: p.precio?.toString() || '',
          previousPrice: p.precioAnterior?.toString() || '',
          stock: p.stock?.toString() || '',
          minStock: p.minStock?.toString() || '5',
          categoryId: p.categoryId || '',
          material: p.material || 'PLA',
          widthCm: p.anchoCm?.toString() || '',
          heightCm: p.altoCm?.toString() || '',
          depthCm: p.profundidadCm?.toString() || '',
          weight: p.peso?.toString() || '',
          printTime: p.tiempoImpresion?.toString() || '',
          isActive: p.activo !== false,
          isFeatured: p.destacado === true,
        });

        // Load images as ProductImage type
        const formattedImages: ProductImage[] = (p.images || []).map(
          (img: { id?: string; url: string; isMain?: boolean; displayOrder?: number }, idx: number) => ({
            id: img.id || `existing-${idx}`,
            url: img.url,
            isMain: img.isMain ?? false,
            status: 'existing',
            displayOrder: img.displayOrder ?? idx,
          }),
        );
        setImages(formattedImages);
      }
    } catch (err) {
      console.error('Error al cargar producto:', err);
      setError('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'El nombre es obligatorio';
    }
    if (!formData.slug.trim()) {
      return 'El slug es obligatorio';
    }
    if (!formData.description.trim()) {
      return 'La descripción es obligatoria';
    }
    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      return 'El precio debe ser mayor a 0';
    }
    if (!formData.categoryId) {
      return 'Debe seleccionar una categoría';
    }
    const visibleImages = images.filter(i => i.status !== 'deleted');
    if (visibleImages.length === 0) {
      return 'Debe agregar al menos una imagen';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Subir imágenes nuevas al servidor
      const imagesToUpload = images.filter(i => i.status === 'new');
      const uploadedUrls: { id: string; url: string }[] = [];

      for (const img of imagesToUpload) {
        if (img.file) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>(resolve => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(img.file!);
          });
          const base64 = await base64Promise;

          const uploadResponse = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64,
              filename: img.file.name,
              slug: formData.slug,
            }),
          });

          if (!uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            throw new Error(uploadData.error || `Error al subir imagen: ${img.file.name}`);
          }

          const uploadData = await uploadResponse.json();
          uploadedUrls.push({ id: img.id, url: uploadData.url });
        }
      }

      // 2. Preparar array final de imágenes
      const finalImages = images
        .filter(i => i.status !== 'deleted')
        .map(img => {
          const uploaded = uploadedUrls.find(u => u.id === img.id);
          return {
            url: uploaded?.url || img.url,
            isMain: img.isMain,
          };
        });

      // 3. Enviar datos actualizados
      const response = await fetch(`/api/admin/products/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number.parseFloat(formData.price),
          previousPrice: formData.previousPrice ? Number.parseFloat(formData.previousPrice) : null,
          stock: Number.parseInt(formData.stock) || 0,
          minStock: Number.parseInt(formData.minStock) || 5,
          printTime: formData.printTime ? Number.parseInt(formData.printTime) : null,
          images: finalImages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar producto');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar producto');
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
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
              <Link href="/admin/products" className="text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
                <p className="text-gray-600 mt-1">Modificar producto existente</p>
              </div>
            </div>
            <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
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
            <p className="text-green-700">Producto actualizado exitosamente. Redirigiendo...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal - Info básica */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información básica */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Información Básica
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del producto *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: Jarrón Decorativo Floral"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (no editable) *
                    </label>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      title="El slug no se puede cambiar"
                    />
                    <p className="text-xs text-gray-500 mt-1">El slug identifica al producto y no puede modificarse</p>
                  </div>

                  <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción corta
                    </label>
                    <input
                      type="text"
                      id="shortDescription"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Breve descripción para listados (máx. 255 caracteres)"
                      maxLength={255}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción completa *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Descripción detallada del producto..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Precios y Stock */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios y Stock</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Precio (€) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="29.99"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="previousPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Precio anterior
                    </label>
                    <input
                      type="number"
                      id="previousPrice"
                      name="previousPrice"
                      value={formData.previousPrice}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="39.99"
                    />
                  </div>

                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock *
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="100"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Especificaciones */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Especificaciones</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">
                      Material *
                    </label>
                    <select
                      id="material"
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      {MATERIALES.map(mat => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock mínimo
                    </label>
                    <input
                      type="number"
                      id="minStock"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:col-span-2">
                    <div>
                      <label htmlFor="widthCm" className="block text-sm font-medium text-gray-700 mb-1">
                        Ancho (cm)
                      </label>
                      <input
                        type="number"
                        id="widthCm"
                        name="widthCm"
                        value={formData.widthCm}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="10"
                      />
                    </div>

                    <div>
                      <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700 mb-1">
                        Alto (cm)
                      </label>
                      <input
                        type="number"
                        id="heightCm"
                        name="heightCm"
                        value={formData.heightCm}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="15"
                      />
                    </div>

                    <div>
                      <label htmlFor="depthCm" className="block text-sm font-medium text-gray-700 mb-1">
                        Profundidad (cm)
                      </label>
                      <input
                        type="number"
                        id="depthCm"
                        name="depthCm"
                        value={formData.depthCm}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="8"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                      Peso (g)
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="150"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="printTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo de impresión (min)
                  </label>
                  <input
                    type="number"
                    id="printTime"
                    name="printTime"
                    value={formData.printTime}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="120"
                  />
                </div>
              </div>
            </div>

            {/* Columna lateral - Imágenes y Configuración */}
            <div className="space-y-6">
              {/* Imágenes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Imágenes del Producto *</h2>

                <ProductImageManager images={images} onChange={setImages} disabled={saving} />
              </div>

              {/* Configuración */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">
                      Producto activo
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="isFeatured" className="text-sm text-gray-700 cursor-pointer">
                      Producto destacado
                    </label>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <Link
                  href="/admin/products"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-center"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
