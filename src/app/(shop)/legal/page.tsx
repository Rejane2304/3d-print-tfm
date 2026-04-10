/**
 * Legal Notice Page - Aviso Legal
 * Página de información legal requerida para empresas españolas
 * Responsive: mobile → 4K
 */
import type { Metadata } from "next";
import {
  Building2,
  FileText,
  Mail,
  Phone,
  MapPin,
  Scale,
  Shield,
  Globe,
  Copyright,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Aviso Legal | 3D Print",
  description:
    "Información legal, datos de la empresa, propiedad intelectual y condiciones de uso del sitio web 3D Print.",
};

interface LegalSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function LegalSection({ title, icon, children }: LegalSectionProps) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
      </div>
      <div className="p-6 prose prose-indigo max-w-none">{children}</div>
    </section>
  );
}

export default function LegalPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 text-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <Scale className="h-16 w-16 mx-auto mb-6 text-indigo-400" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Aviso Legal</h1>
            <p className="text-xl text-gray-300">
              Información legal y condiciones de uso del sitio web
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <LegalSection
              title="Información de la Empresa"
              icon={<Building2 className="h-6 w-6" />}
            >
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de
                  julio, de Servicios de la Sociedad de la Información y del
                  Comercio Electrónico, se informa que el titular de este sitio
                  web es:
                </p>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="font-semibold text-gray-900 min-w-[140px]">
                        Razón social:
                      </span>
                      <span>3D Print</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-semibold text-gray-900 min-w-[140px]">
                        CIF:
                      </span>
                      <span>B12345678</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-semibold text-gray-900 min-w-[140px]">
                        Domicilio social:
                      </span>
                      <span>
                        Calle Admin 123, 08001 Barcelona, Barcelona, España
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-semibold text-gray-900 min-w-[140px]">
                        Teléfono:
                      </span>
                      <span>+34 930 000 001</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-semibold text-gray-900 min-w-[140px]">
                        Email:
                      </span>
                      <span>info@3dprint.com</span>
                    </li>
                  </ul>
                </div>
              </div>
            </LegalSection>

            {/* Registration Details */}
            <LegalSection
              title="Datos de Registro"
              icon={<FileText className="h-6 w-6" />}
            >
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Esta empresa está registrada en el Registro Mercantil de
                  Barcelona, Tomo 12345, Folio 67, Hoja B-890123, Inscripción
                  1ª.
                </p>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="font-semibold text-gray-900 min-w-[180px]">
                        Registro Mercantil:
                      </span>
                      <span>Registro Mercantil de Barcelona</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-semibold text-gray-900 min-w-[180px]">
                        Número de registro:
                      </span>
                      <span>Tomo 12345, Folio 67, Hoja B-890123</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-semibold text-gray-900 min-w-[180px]">
                        Fecha de inscripción:
                      </span>
                      <span>15 de marzo de 2020</span>
                    </li>
                  </ul>
                </div>
              </div>
            </LegalSection>

            {/* Intellectual Property */}
            <LegalSection
              title="Propiedad Intelectual e Industrial"
              icon={<Copyright className="h-6 w-6" />}
            >
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  Todos los contenidos de este sitio web, incluyendo pero no
                  limitado a: textos, fotografías, gráficos, imágenes, iconos,
                  tecnología, software, enlaces y demás contenidos audiovisuales
                  o sonoros, así como su diseño gráfico y códigos fuente, son
                  propiedad intelectual de 3D Print o de terceros que han
                  autorizado su uso.
                </p>
                <p className="leading-relaxed">
                  Queda prohibida la reproducción, distribución, comunicación
                  pública, transformación o cualquier otro uso de los contenidos
                  de este sitio web sin el previo consentimiento expreso y por
                  escrito de 3D Print.
                </p>
                <p className="leading-relaxed">
                  Las marcas, nombres comerciales o signos distintivos que
                  aparecen en este sitio web son propiedad de 3D Print o de
                  terceros, sin que pueda entenderse que el acceso al sitio web
                  atribuya derecho alguno sobre dichas marcas.
                </p>
              </div>
            </LegalSection>

            {/* Disclaimer */}
            <LegalSection
              title="Exención de Responsabilidad"
              icon={<AlertTriangle className="h-6 w-6" />}
            >
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  3D Print no se hace responsable de los daños y perjuicios que
                  pudieran derivarse de:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    La utilización de los contenidos de este sitio web por parte
                    de los usuarios.
                  </li>
                  <li>
                    La falta de disponibilidad, acceso o continuidad del
                    funcionamiento del sitio web.
                  </li>
                  <li>
                    La presencia de virus o cualquier otro elemento informático
                    dañino.
                  </li>
                  <li>
                    La recepción, obtención, almacenamiento o difusión de
                    contenidos por parte de terceros.
                  </li>
                </ul>
                <p className="leading-relaxed">
                  Los precios y disponibilidad de los productos pueden variar
                  sin previo aviso. Nos esforzamos por mantener la información
                  actualizada, pero no garantizamos la ausencia de errores.
                </p>
              </div>
            </LegalSection>

            {/* Applicable Law */}
            <LegalSection
              title="Legislación Aplicable y Jurisdicción"
              icon={<Globe className="h-6 w-6" />}
            >
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  El presente aviso legal se rige por la legislación española.
                  Para la resolución de cualquier controversia que pudiera
                  derivarse del acceso o uso del sitio web, el usuario y 3D
                  Print se someten expresamente a los juzgados y tribunales de
                  Barcelona, renunciando a cualquier otro fuero que pudiera
                  corresponderles.
                </p>
                <p className="leading-relaxed">
                  En cumplimiento de la normativa vigente, ponemos a disposición
                  de los usuarios los siguientes textos legales:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de
                    la Información y del Comercio Electrónico.
                  </li>
                  <li>
                    Ley Orgánica 3/2018, de 5 de diciembre, de Protección de
                    Datos Personales y garantía de los derechos digitales.
                  </li>
                  <li>
                    Reglamento (UE) 2016/679 del Parlamento Europeo y del
                    Consejo, de 27 de abril de 2016 (RGPD).
                  </li>
                </ul>
              </div>
            </LegalSection>

            {/* Data Protection */}
            <LegalSection
              title="Protección de Datos"
              icon={<Shield className="h-6 w-6" />}
            >
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  En cumplimiento del Reglamento (UE) 2016/679 del Parlamento
                  Europeo y del Consejo, de 27 de abril de 2016, relativo a la
                  protección de las personas físicas en lo que respecta al
                  tratamiento de datos personales, le informamos que los datos
                  personales que nos proporcione serán tratados de forma
                  confidencial y no serán cedidos a terceros, salvo en los casos
                  previstos por ley.
                </p>
                <p className="leading-relaxed">
                  Puede ejercer sus derechos de acceso, rectificación,
                  supresión, oposición, limitación del tratamiento y
                  portabilidad de los datos dirigiéndose a través del email:
                  privacidad@3dprint.com o por correo postal a nuestra dirección
                  fiscal.
                </p>
                <p className="leading-relaxed">
                  Para más información, consulte nuestra{" "}
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Política de Privacidad
                  </a>{" "}
                  y nuestra{" "}
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Política de Cookies
                  </a>
                  .
                </p>
              </div>
            </LegalSection>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Contact */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-indigo-600 border-b border-indigo-700">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contacto Legal
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Email legal
                      </p>
                      <a
                        href="mailto:legal@3dprint.com"
                        className="text-sm text-gray-700 hover:text-indigo-600 transition-colors"
                      >
                        legal@3dprint.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Teléfono</p>
                      <a
                        href="tel:+34930000001"
                        className="text-sm text-gray-700 hover:text-indigo-600 transition-colors"
                      >
                        +34 930 000 001
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Dirección</p>
                      <p className="text-sm text-gray-700">
                        Calle Admin 123
                        <br />
                        08001 Barcelona, Barcelona, España
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
                <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Última actualización
                </h4>
                <p className="text-sm text-indigo-700">
                  Este aviso legal fue actualizado el 8 de abril de{" "}
                  {currentYear}.
                </p>
              </div>

              {/* Related Documents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    Documentos relacionados
                  </h3>
                </div>
                <nav className="divide-y divide-gray-100">
                  <a
                    href="#"
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-indigo-600">
                      Términos y condiciones
                    </span>
                    <span className="text-gray-400">→</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-indigo-600">
                      Política de privacidad
                    </span>
                    <span className="text-gray-400">→</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-indigo-600">
                      Política de cookies
                    </span>
                    <span className="text-gray-400">→</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-indigo-600">
                      Política de devoluciones
                    </span>
                    <span className="text-gray-400">→</span>
                  </a>
                </nav>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
