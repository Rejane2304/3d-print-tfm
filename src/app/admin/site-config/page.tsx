/**
 * Admin Site Config Page
 * Configuration form for site settings
 */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Building2,
  Phone,
  Mail,
  Percent,
  AlertTriangle,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface SiteConfig {
  _ref: string;
  nombreEmpresa: string;
  cifNif: string;
  direccionEmpresa: string;
  ciudadEmpresa: string;
  provinciaEmpresa: string;
  codigoPostalEmpresa: string;
  telefonoEmpresa: string;
  emailEmpresa: string;
  ivaPorDefecto: number;
  umbralStockBajo: number;
  actualizadoEn: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function AdminSiteConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Form state
  const [formData, setFormData] = useState<Partial<SiteConfig>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/site-config");
      return;
    }

    if (status === "authenticated") {
      const user = session?.user as { rol?: string } | undefined;
      if (user?.rol !== "ADMIN") {
        router.push("/");
        return;
      }
      loadConfig();
    }
  }, [status, session, router]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/site-config");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando configuración");
      }

      const configData = data.config;
      setConfig(configData);
      setFormData(configData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.nombreEmpresa?.trim()) {
      errors.nombreEmpresa = "El nombre de la empresa es obligatorio";
    }

    if (!formData.cifNif?.trim()) {
      errors.cifNif = "El CIF/NIF es obligatorio";
    }

    if (!formData.direccionEmpresa?.trim()) {
      errors.direccionEmpresa = "La dirección es obligatoria";
    }

    if (!formData.ciudadEmpresa?.trim()) {
      errors.ciudadEmpresa = "La ciudad es obligatoria";
    }

    if (!formData.provinciaEmpresa?.trim()) {
      errors.provinciaEmpresa = "La provincia es obligatoria";
    }

    if (!formData.codigoPostalEmpresa?.match(/^\d{5}$/)) {
      errors.codigoPostalEmpresa = "El código postal debe tener 5 dígitos";
    }

    if (!formData.telefonoEmpresa?.match(/^\+?\d{9,20}$/)) {
      errors.telefonoEmpresa = "El teléfono debe tener entre 9 y 20 dígitos";
    }

    if (!formData.emailEmpresa?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.emailEmpresa = "El email no es válido";
    }

    if (
      formData.ivaPorDefecto === undefined ||
      formData.ivaPorDefecto < 0 ||
      formData.ivaPorDefecto > 100
    ) {
      errors.ivaPorDefecto = "El IVA debe estar entre 0 y 100";
    }

    if (
      formData.umbralStockBajo === undefined ||
      formData.umbralStockBajo < 1
    ) {
      errors.umbralStockBajo = "El umbral debe ser al menos 1";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error guardando configuración");
      }

      setConfig(data.config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SiteConfig, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración...</p>
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
              <Settings className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Configuración del Sitio
              </h1>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
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
              <span className="text-gray-900 font-medium">Configuración</span>
            </li>
          </ol>
        </nav>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">
              Configuración guardada correctamente
            </p>
          </div>
        )}

        {/* Config Reference */}
        {config?._ref && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">
              Referencia:{" "}
              <span className="font-mono font-medium text-gray-700">
                {config._ref}
              </span>
            </p>
            {config.actualizadoEn && (
              <p className="text-sm text-gray-500 mt-1">
                Última actualización:{" "}
                {new Date(config.actualizadoEn).toLocaleString("es-ES", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Información de la Empresa
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="nombreEmpresa"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nombre de la Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombreEmpresa"
                    value={formData.nombreEmpresa || ""}
                    onChange={(e) =>
                      handleChange("nombreEmpresa", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.nombreEmpresa
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="3D Print"
                  />
                  {formErrors.nombreEmpresa && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.nombreEmpresa}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="cifNif"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    CIF/NIF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cifNif"
                    value={formData.cifNif || ""}
                    onChange={(e) => handleChange("cifNif", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.cifNif ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="B12345678"
                  />
                  {formErrors.cifNif && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.cifNif}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="direccionEmpresa"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="direccionEmpresa"
                    value={formData.direccionEmpresa || ""}
                    onChange={(e) =>
                      handleChange("direccionEmpresa", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.direccionEmpresa
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Calle Admin 123"
                  />
                  {formErrors.direccionEmpresa && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.direccionEmpresa}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="ciudadEmpresa"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ciudad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="ciudadEmpresa"
                    value={formData.ciudadEmpresa || ""}
                    onChange={(e) =>
                      handleChange("ciudadEmpresa", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.ciudadEmpresa
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Barcelona"
                  />
                  {formErrors.ciudadEmpresa && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.ciudadEmpresa}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="provinciaEmpresa"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Provincia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="provinciaEmpresa"
                    value={formData.provinciaEmpresa || ""}
                    onChange={(e) =>
                      handleChange("provinciaEmpresa", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.provinciaEmpresa
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Barcelona"
                  />
                  {formErrors.provinciaEmpresa && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.provinciaEmpresa}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="codigoPostalEmpresa"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Código Postal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="codigoPostalEmpresa"
                    value={formData.codigoPostalEmpresa || ""}
                    onChange={(e) =>
                      handleChange("codigoPostalEmpresa", e.target.value)
                    }
                    maxLength={5}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.codigoPostalEmpresa
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="08001"
                  />
                  {formErrors.codigoPostalEmpresa && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.codigoPostalEmpresa}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <Phone className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Contacto</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="telefonoEmpresa"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      id="telefonoEmpresa"
                      value={formData.telefonoEmpresa || ""}
                      onChange={(e) =>
                        handleChange("telefonoEmpresa", e.target.value)
                      }
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.telefonoEmpresa
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="+34 930 000 001"
                    />
                  </div>
                  {formErrors.telefonoEmpresa && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.telefonoEmpresa}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="emailEmpresa"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="emailEmpresa"
                      value={formData.emailEmpresa || ""}
                      onChange={(e) =>
                        handleChange("emailEmpresa", e.target.value)
                      }
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.emailEmpresa
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="info@3dprint.com"
                    />
                  </div>
                  {formErrors.emailEmpresa && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.emailEmpresa}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* VAT Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <Percent className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Configuración de IVA
              </h2>
            </div>
            <div className="p-6">
              <div className="max-w-xs">
                <label
                  htmlFor="ivaPorDefecto"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tipo de IVA por defecto (%){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="ivaPorDefecto"
                    value={formData.ivaPorDefecto || ""}
                    onChange={(e) =>
                      handleChange(
                        "ivaPorDefecto",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    min={0}
                    max={100}
                    step={0.01}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-8 ${
                      formErrors.ivaPorDefecto
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="21"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
                {formErrors.ivaPorDefecto && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.ivaPorDefecto}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Se utilizará en el cálculo de totales en el checkout
                </p>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Configuración del Sistema
              </h2>
            </div>
            <div className="p-6">
              <div className="max-w-xs">
                <label
                  htmlFor="umbralStockBajo"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Umbral de Stock Bajo <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="umbralStockBajo"
                  value={formData.umbralStockBajo || ""}
                  onChange={(e) =>
                    handleChange(
                      "umbralStockBajo",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  min={1}
                  max={1000}
                  step={1}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    formErrors.umbralStockBajo
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="5"
                />
                {formErrors.umbralStockBajo && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.umbralStockBajo}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Se generarán alertas cuando el stock de un producto sea menor
                  o igual a este valor
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
