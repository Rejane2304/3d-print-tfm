/**
 * New Product Page - Admin
 * Complete form for creating a product according to Prisma schema
 */
'use client';

import { useEffect, useState } from 'react';
import { showAlert, showPrompt } from '@/lib/dialogs';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Package, Save, Upload, X } from 'lucide-react';

interface Category {
  id: string;
  nombre: string;
}

const MATERIALES = ['PLA', 'PETG', 'ABS', 'TPU', 'RESINA', 'NYLON', 'FIBRA_CARBONO', 'PC', 'ASA'];

export default function NuevoProductoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  // Almacena tanto la URL de preview como el archivo para subir luego
  const [images, setImages] = useState<{ url: string; isMain: boolean; file?: File }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setImageUploadProgress] = useState<{ current: number; total: number } | null>(null);

  // Form state - bilingual fields included
  const [formData, setFormData] = useState({
    // Bilingual name fields
    nameEs: '',
    nameEn: '',
    // Bilingual description fields
    descriptionEs: '',
    descriptionEn: '',
    // Bilingual short description fields
    shortDescEs: '',
    shortDescEn: '',
    // Bilingual meta fields
    metaTitleEs: '',
    metaTitleEn: '',
    metaDescEs: '',
    metaDescEn: '',
    // Other fields
    slug: '',
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
      router.push('/auth?callbackUrl=/admin/products/new');
      return;
    }

    const user = session?.user as { role?: string } | undefined;
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      loadCategories();
    }
  }, [status, session, router]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(^-|-$)/g, '');
  };

  const handleNameEsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameEs = e.target.value;
    setFormData(prev => ({
      ...prev,
      nameEs,
      slug: generateSlug(nameEs),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    try {
      // Crear URL temporal para preview
      const tempUrl = URL.createObjectURL(file);
      setImages(prev => [...prev, { url: tempUrl, isMain: prev.length === 0, file }]);
    } catch (err) {
      console.error('Error uploading image:', err);
      showAlert('Error al preparar imagen. Intente nuevamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlAdd = () => {
    const url = showPrompt('Ingrese la URL de la imagen:');
    if (url) {
      setImages(prev => [...prev, { url, isMain: prev.length === 0 }]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.isMain)) {
        newImages[0].isMain = true;
      }
      return newImages;
    });
  };

  const setMainImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isMain: i === index })));
  };

  const validateForm = () => {
    if (!formData.nameEs.trim()) {
      return 'El nombre en español es obligatorio';
    }
    if (!formData.nameEn.trim()) {
      return 'El nombre en inglés es obligatorio';
    }
    if (!formData.slug.trim()) {
      return 'El slug es obligatorio';
    }
    if (!formData.descriptionEs.trim()) {
      return 'La descripción en español es obligatoria';
    }
    if (!formData.descriptionEn.trim()) {
      return 'La descripción en inglés es obligatoria';
    }
    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      return 'El precio debe ser mayor a 0';
    }
    if (!formData.categoryId) {
      return 'Debe seleccionar una categoría';
    }
    if (images.length === 0) {
      return 'Debe agregar al menos una imagen';
    }
    return null;
  };

  // Helper function to upload images
  const uploadImages = async (
    imgs: { url: string; isMain: boolean; file?: File }[],
    slug: string,
    failedUploads: { index: number; fileName: string; error: string }[],
    totalToUpload: number,
    setProgress: (progress: { current: number; total: number } | null) => void,
  ): Promise<{ uploadedImages: { url: string; isMain: boolean }[]; uploadedCount: number }> => {
    const uploadedImages: { url: string; isMain: boolean }[] = [];
    let uploadedCount = 0;

    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      if (img.file) {
        try {
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
              slug,
            }),
          });

          if (!uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            throw new Error(uploadData.error || 'Error al subir imagen');
          }

          const uploadData = await uploadResponse.json();
          uploadedImages.push({ url: uploadData.url, isMain: img.isMain });
          uploadedCount++;
          setProgress({ current: uploadedCount, total: totalToUpload });
        } catch (uploadErr) {
          const errorMessage = uploadErr instanceof Error ? uploadErr.message : 'Error desconocido';
          failedUploads.push({
            index: i + 1,
            fileName: img.file.name,
            error: errorMessage,
          });
          console.error(`Error al subir imagen ${i + 1} de ${totalToUpload}:`, uploadErr);
        }
      } else {
        uploadedImages.push({ url: img.url, isMain: img.isMain });
      }
    }

    return { uploadedImages, uploadedCount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    // Calcular total de imágenes con archivos para subir
    const imagesWithFiles = images.filter(img => img.file);
    const totalImagesToUpload = imagesWithFiles.length;
    let uploadedCount = 0;
    const failedUploads: { index: number; fileName: string; error: string }[] = [];

    if (totalImagesToUpload > 0) {
      setImageUploadProgress({ current: 0, total: totalImagesToUpload });
    }

    try {
      // Upload images and get their URLs
      const { uploadedImages } = await uploadImages(
        images,
        formData.slug,
        failedUploads,
        totalImagesToUpload,
        setImageUploadProgress,
      );

      // Verificar si todas las imágenes con archivos se subieron correctamente
      if (failedUploads.length > 0) {
        const failedNames = failedUploads.map(f => f.fileName).join(', ');
        throw new Error(`Error al subir ${failedUploads.length} imagen(es) de ${totalImagesToUpload}: ${failedNames}`);
      }

      // Preparar datos del producto
      const optionalNumberFields = ['widthCm', 'heightCm', 'depthCm', 'weight', 'previousPrice'];
      const payload: Record<string, unknown> = {
        ...formData,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock) || 0,
        minStock: Number.parseInt(formData.minStock) || 5,
        images: uploadedImages,
      };

      // Convertir campos opcionales vacíos a undefined
      optionalNumberFields.forEach(field => {
        const value = formData[field as keyof typeof formData];
        if (value === '' || value === null || value === undefined) {
          payload[field] = undefined;
        } else {
          payload[field] = Number.parseFloat(value as string);
        }
      });

      // printTime es opcional pero entero
      if (formData.printTime) {
        payload.printTime = Number.parseInt(formData.printTime);
      } else {
        payload.printTime = undefined;
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear producto');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear producto');
    } finally {
      setLoading(false);
      setImageUploadProgress(null);
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
              <Link href="/admin/products" className="text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nuevo Producto</h1>
                <p className="text-gray-600 mt-1">Crear un nuevo producto en el catálogo</p>
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
            <p className="text-green-700">Producto creado exitosamente. Redirigiendo...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal - Info básica */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información básica - Bilingual */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Información Básica (Bilingüe)
                </h2>

                <div className="space-y-4">
                  {/* Nombre en dos columnas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="nameEs" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre (Español) *
                      </label>
                      <input
                        type="text"
                        id="nameEs"
                        name="nameEs"
                        value={formData.nameEs}
                        onChange={handleNameEsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ej: Jarrón Decorativo Floral"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre (Inglés) *
                      </label>
                      <input
                        type="text"
                        id="nameEn"
                        name="nameEn"
                        value={formData.nameEn}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ej: Decorative Floral Vase"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                        Slug *
                      </label>
                      <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="jarron-decorativo-floral"
                        readOnly
                      />
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
                  </div>

                  {/* Descripción corta en dos columnas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="shortDescEs" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción corta (Español)
                      </label>
                      <input
                        type="text"
                        id="shortDescEs"
                        name="shortDescEs"
                        value={formData.shortDescEs}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Breve descripción en español"
                        maxLength={255}
                      />
                    </div>
                    <div>
                      <label htmlFor="shortDescEn" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción corta (Inglés)
                      </label>
                      <input
                        type="text"
                        id="shortDescEn"
                        name="shortDescEn"
                        value={formData.shortDescEn}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Brief description in English"
                        maxLength={255}
                      />
                    </div>
                  </div>

                  {/* Descripción completa en dos columnas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="descriptionEs" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción completa (Español) *
                      </label>
                      <textarea
                        id="descriptionEs"
                        name="descriptionEs"
                        value={formData.descriptionEs}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Descripción detallada en español..."
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="descriptionEn" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción completa (Inglés) *
                      </label>
                      <textarea
                        id="descriptionEn"
                        name="descriptionEn"
                        value={formData.descriptionEn}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Detailed description in English..."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Precios y Stock */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios y Stock</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Precio actual (€) *
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
                      Precio anterior (€)
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
                    <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">
                      Material
                    </label>
                    <select
                      id="material"
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {MATERIALES.map(mat => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock actual *
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="10"
                      required
                    />
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
                </div>
              </div>

              {/* Dimensiones */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dimensiones y Especificaciones</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <label htmlFor="imageUpload" className="flex-1 cursor-pointer">
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
                          {uploadingImage && uploadProgress
                            ? `Subiendo ${uploadProgress.current}/${uploadProgress.total}...`
                            : 'Subir imagen'}
                        </span>
                      </div>
                      {uploadingImage && uploadProgress && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                          />
                        </div>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={handleImageUrlAdd}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      URL
                    </button>
                  </div>

                  {/* Image Gallery */}
                  {images.length > 0 && (
                    <div className="space-y-2">
                      {/* Imagen principal - tamaño grande */}
                      {images.find(img => img.isMain) && (
                        <div className="relative aspect-video border-2 border-indigo-500">
                          <Image
                            src={images.find(img => img.isMain)!.url}
                            alt="Imagen principal"
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-cover"
                            priority
                          />
                          <span className="absolute top-2 left-2 bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded">
                            Principal
                          </span>
                          <button
                            type="button"
                            onClick={() => removeImage(images.findIndex(img => img.isMain))}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white hover:bg-red-600 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {/* Imágenes de galería - tamaño pequeño */}
                      {images.some(img => !img.isMain) && (
                        <div className="grid grid-cols-4 gap-2">
                          {images
                            .filter(img => !img.isMain)
                            .map((img, index) => (
                              <div
                                key={`${img.url}-${index}`}
                                className="relative aspect-square border-2 border-gray-200"
                              >
                                <Image
                                  src={img.url}
                                  alt={`Imagen ${index + 2}`}
                                  fill
                                  sizes="(max-width: 768px) 25vw, 100px"
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(images.findIndex(i => i.url === img.url))}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white hover:bg-red-600 rounded"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMainImage(images.findIndex(i => i.url === img.url))}
                                  className="absolute bottom-1 left-1 right-1 px-1 py-1 bg-gray-800 text-white text-xs hover:bg-gray-700 rounded"
                                >
                                  Principal
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {images.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Agregue al menos una imagen</p>
                    </div>
                  )}
                </div>
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
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  Crear
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
