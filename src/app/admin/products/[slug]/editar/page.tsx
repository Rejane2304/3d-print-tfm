/**
 * Edit Product Page - Admin
 * Formulario para editar producto existente
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Loader2,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Save,
} from "lucide-react";

interface Category {
  id: string;
  nombre: string;
}

const MATERIALES = [
  "PLA",
  "PETG",
  "ABS",
  "TPU",
  "RESINA",
  "NYLON",
  "FIBRA_CARBONO",
  "PC",
  "ASA",
];

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
  const [images, setImages] = useState<{ url: string; isMain: boolean }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    previousPrice: "",
    stock: "",
    minStock: "5",
    categoryId: "",
    material: "PLA",
    widthCm: "",
    heightCm: "",
    depthCm: "",
    weight: "",
    printTime: "",
    isActive: true,
    isFeatured: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?callbackUrl=/admin/products");
      return;
    }

    const user = session?.user as { role?: string } | undefined;
    if (status === "authenticated" && user?.role !== "ADMIN") {
      router.push("/");
      return;
    }

    if (status === "authenticated" && slug) {
      loadCategories();
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, slug]);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${slug}`);
      if (!response.ok) {
        throw new Error("Error al cargar producto");
      }
      const data = await response.json();

      if (data.success && data.producto) {
        const p = data.producto;
        // API returns Spanish field names with actual DB data as fallback
        setFormData({
          name: p.nombre || "",
          slug: p.slug || "",
          description: p.descripcion || "",
          shortDescription: p.descripcionCorta || "",
          price: p.precio?.toString() || "",
          previousPrice: p.precioAnterior?.toString() || "",
          stock: p.stock?.toString() || "",
          minStock: p.minStock?.toString() || "5",
          categoryId: p.categoryId || "",
          material: p.material || "PLA",
          widthCm: p.anchoCm?.toString() || "",
          heightCm: p.altoCm?.toString() || "",
          depthCm: p.profundidadCm?.toString() || "",
          weight: p.peso?.toString() || "",
          printTime: p.tiempoImpresion?.toString() || "",
          isActive: p.activo !== false,
          isFeatured: p.destacado === true,
        });
        // Load images from API
        const formattedImages = (p.images || []).map(
          (img: { url: string; isMain?: boolean }) => ({
            url: img.url,
            isMain: img.isMain ?? false,
          }),
        );
        setImages(formattedImages);
      }
    } catch (err) {
      console.error("Error al cargar producto:", err);
      setError("Error al cargar el producto");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const tempUrl = URL.createObjectURL(file);
      setImages((prev) => [
        ...prev,
        { url: tempUrl, isMain: prev.length === 0 },
      ]);
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Error al subir imagen. Intente nuevamente.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlAdd = () => {
    const url = prompt("Ingrese la URL de la imagen:");
    if (url) {
      setImages((prev) => [...prev, { url, isMain: prev.length === 0 }]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some((img) => img.isMain)) {
        newImages[0].isMain = true;
      }
      return newImages;
    });
  };

  const setMainImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isMain: i === index })),
    );
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "El nombre es obligatorio";
    if (!formData.slug.trim()) return "El slug es obligatorio";
    if (!formData.description.trim()) return "La descripción es obligatoria";
    if (!formData.price || parseFloat(formData.price) <= 0)
      return "El precio debe ser mayor a 0";
    if (!formData.categoryId) return "Debe seleccionar una categoría";
    if (images.length === 0) return "Debe agregar al menos una imagen";
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
      const response = await fetch(`/api/admin/products/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          previousPrice: formData.previousPrice
            ? parseFloat(formData.previousPrice)
            : null,
          stock: Number.parseInt(formData.stock) || 0,
          minStock: Number.parseInt(formData.minStock) || 5,
          printTime: formData.printTime
            ? Number.parseInt(formData.printTime)
            : null,
          images,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar producto");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/products");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar producto",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
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
                href="/admin/products"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Editar Producto
                </h1>
                <p className="text-gray-600 mt-1">
                  Modificar producto existente
                </p>
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
              Producto actualizado exitosamente. Redirigiendo...
            </p>
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
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                      placeholder="jarron-decorativo-floral"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="categoryId"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="shortDescription"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Precios y Stock
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                    <label
                      htmlFor="previousPrice"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                    <label
                      htmlFor="material"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Material
                    </label>
                    <select
                      id="material"
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {MATERIALES.map((mat) => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="stock"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                    <label
                      htmlFor="minStock"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Dimensiones y Especificaciones
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label
                      htmlFor="widthCm"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                    <label
                      htmlFor="heightCm"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                    <label
                      htmlFor="depthCm"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                    <label
                      htmlFor="weight"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                  <label
                    htmlFor="printTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Imágenes del Producto *
                </h2>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                        <Upload className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {uploadingImage ? "Subiendo..." : "Subir imagen"}
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

                  {/* Image Gallery */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          className={`relative aspect-square border-2 ${
                            img.isMain ? "border-indigo-500" : "border-gray-200"
                          }`}
                        >
                          <Image
                            src={img.url}
                            alt={`Imagen ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 50vw, 150px"
                            className="object-cover"
                          />
                          {img.isMain && (
                            <span className="absolute top-1 left-1 bg-indigo-600 text-white text-xs px-2 py-1">
                              Principal
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {!img.isMain && (
                            <button
                              type="button"
                              onClick={() => setMainImage(index)}
                              className="absolute bottom-1 left-1 px-2 py-1 bg-gray-800 text-white text-xs hover:bg-gray-700"
                            >
                              Principal
                            </button>
                          )}
                        </div>
                      ))}
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuración
                </h2>

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
                    <label
                      htmlFor="isActive"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
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
                    <label
                      htmlFor="isFeatured"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
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
