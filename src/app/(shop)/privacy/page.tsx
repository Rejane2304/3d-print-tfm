/**
 * Privacy Policy Page
 * GDPR-compliant privacy policy for e-commerce in Spain
 * Responsive: mobile → 4K
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  User,
  FileText,
  Eye,
  Scale,
  Clock,
  Lock,
  Users,
  Cookie,
  Mail,
  ChevronRight,
  Building,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad | 3D Print",
  description:
    "Información sobre cómo recopilamos, utilizamos y protegemos tus datos personales conforme al RGPD.",
};

interface PrivacySection {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

const privacySections: PrivacySection[] = [
  {
    id: "introduccion",
    icon: Shield,
    title: "1. Introducción",
    content: (
      <>
        <p className="mb-4">
          En <strong>3D Print</strong>, nos tomamos muy en serio la protección
          de tus datos personales. Esta Política de Privacidad describe cómo
          recopilamos, utilizamos, almacenamos y protegemos tu información
          personal cuando utilizas nuestro sitio web y servicios de e-commerce.
        </p>
        <p className="mb-4">
          Nos comprometemos a garantizar la confidencialidad de los datos
          personales que nos proporcionas y a cumplir con las obligaciones
          establecidas en el Reglamento General de Protección de Datos (RGPD)
          2016/679 y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de
          Datos Personales y garantía de los derechos digitales (LOPDGDD).
        </p>
        <p>
          Te recomendamos que leas detenidamente esta política para entender
          cómo tratamos tu información.
        </p>
      </>
    ),
  },
  {
    id: "responsable",
    icon: Building,
    title: "2. Responsable del Tratamiento",
    content: (
      <>
        <p className="mb-4">
          El responsable del tratamiento de tus datos personales es:
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="font-semibold text-gray-900 mb-2">3D Print</p>
          <ul className="space-y-1 text-gray-700">
            <li>CIF: B12345678</li>
            <li>
              Dirección: Calle Admin 123, 08001 Barcelona, Barcelona, España
            </li>
            <li>Email: privacidad@3dprint.com</li>
            <li>Teléfono: +34 930 000 001</li>
          </ul>
        </div>
        <p>
          Para cualquier consulta relacionada con la protección de datos, puedes
          contactar con nuestro Delegado de Protección de Datos (DPD) enviando
          un email a:{" "}
          <a
            href="mailto:dpd@3dprint.com"
            className="text-indigo-600 hover:text-indigo-800"
          >
            dpd@3dprint.com
          </a>
        </p>
      </>
    ),
  },
  {
    id: "datos-recopilados",
    icon: FileText,
    title: "3. Información que Recopilamos",
    content: (
      <>
        <p className="mb-4">
          Podemos recopilar y procesar los siguientes datos personales:
        </p>
        <h4 className="font-semibold text-gray-900 mb-2">
          3.1. Datos de identificación
        </h4>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
          <li>Nombre y apellidos</li>
          <li>Dirección postal completa</li>
          <li>Dirección de correo electrónico</li>
          <li>Número de teléfono</li>
          <li>
            Documento Nacional de Identidad (DNI/NIE) o CIF (para empresas)
          </li>
        </ul>

        <h4 className="font-semibold text-gray-900 mb-2">
          3.2. Datos de transacciones
        </h4>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
          <li>Historial de pedidos y compras</li>
          <li>
            Información de pago (tarjetas, PayPal) - procesada de forma segura
          </li>
          <li>Direcciones de envío y facturación</li>
          <li>Preferencias de compra</li>
        </ul>

        <h4 className="font-semibold text-gray-900 mb-2">
          3.3. Datos técnicos
        </h4>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
          <li>Dirección IP</li>
          <li>Tipo de navegador y sistema operativo</li>
          <li>Información sobre cookies y tecnologías similares</li>
          <li>Datos de uso del sitio web</li>
        </ul>

        <h4 className="font-semibold text-gray-900 mb-2">
          3.4. Datos de comunicación
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>
            Historial de consultas y comunicaciones con atención al cliente
          </li>
          <li>Reseñas y valoraciones de productos</li>
          <li>Suscripción a newsletters y comunicaciones comerciales</li>
        </ul>
      </>
    ),
  },
  {
    id: "uso-datos",
    icon: Eye,
    title: "4. Cómo Utilizamos tus Datos",
    content: (
      <>
        <p className="mb-4">
          Utilizamos tus datos personales para las siguientes finalidades:
        </p>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="font-semibold text-gray-900">
              Gestión de pedidos y compras
            </h4>
            <p className="text-gray-700">
              Procesar tus pedidos, gestionar pagos, enviar productos, facilitar
              facturas y proporcionar confirmaciones de pedido.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="font-semibold text-gray-900">Atención al cliente</h4>
            <p className="text-gray-700">
              Responder a tus consultas, gestionar devoluciones, garantías y
              reclamaciones.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="font-semibold text-gray-900">
              Comunicaciones comerciales
            </h4>
            <p className="text-gray-700">
              Enviar newsletters, ofertas especiales y novedades de productos
              (solo con tu consentimiento previo).
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="font-semibold text-gray-900">Mejora del servicio</h4>
            <p className="text-gray-700">
              Analizar el uso de nuestra web para mejorar la experiencia de
              usuario y personalizar contenidos.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="font-semibold text-gray-900">Cumplimiento legal</h4>
            <p className="text-gray-700">
              Cumplir con obligaciones fiscales, contables y de prevención del
              fraude.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "base-juridica",
    icon: Scale,
    title: "5. Base Jurídica del Tratamiento",
    content: (
      <>
        <p className="mb-4">
          El tratamiento de tus datos personales se basa en las siguientes bases
          jurídicas conforme al artículo 6 del RGPD:
        </p>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-sm font-medium flex-shrink-0 mt-0.5">
              Ejecución de contrato
            </span>
            <span>Para procesar pedidos y entregar productos solicitados.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-sm font-medium flex-shrink-0 mt-0.5">
              Obligación legal
            </span>
            <span>Para cumplir con obligaciones fiscales y contables.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-sm font-medium flex-shrink-0 mt-0.5">
              Consentimiento
            </span>
            <span>Para enviar comunicaciones comerciales y newsletters.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-sm font-medium flex-shrink-0 mt-0.5">
              Interés legítimo
            </span>
            <span>Para prevenir fraudes y mejorar nuestros servicios.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "conservacion",
    icon: Clock,
    title: "6. Conservación de los Datos",
    content: (
      <>
        <p className="mb-4">
          Conservamos tus datos personales durante el tiempo necesario para
          cumplir con las finalidades para las que fueron recopilados:
        </p>
        <ul className="space-y-3 text-gray-700 mb-4">
          <li className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Datos de clientes:</strong> Durante la relación
              contractual y hasta 6 años después (obligaciones fiscales y
              comerciales).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Datos de facturación:</strong> 6 años conforme a la
              normativa fiscal.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Datos de comunicaciones:</strong> Hasta la resolución de
              la consulta y 2 años posteriores.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Datos de marketing:</strong> Hasta que solicites la baja o
              retire tu consentimiento.
            </span>
          </li>
        </ul>
        <p className="text-gray-700">
          Transcurrido el plazo de conservación aplicable, los datos serán
          eliminados de forma segura o anonimizados.
        </p>
      </>
    ),
  },
  {
    id: "derechos",
    icon: User,
    title: "7. Tus Derechos",
    content: (
      <>
        <p className="mb-4">
          Como titular de los datos, tienes los siguientes derechos respecto a
          tus datos personales:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-600" />
              Derecho de acceso
            </h4>
            <p className="text-sm text-gray-700">
              Conocer qué datos personales tratamos y obtener copia de los
              mismos.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Derecho de rectificación
            </h4>
            <p className="text-sm text-gray-700">
              Solicitar la corrección de datos inexactos o incompletos.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              Derecho de supresión
            </h4>
            <p className="text-sm text-gray-700">
              Solicitar la eliminación de tus datos (&quot;derecho al
              olvido&quot;).
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Scale className="h-4 w-4 text-indigo-600" />
              Derecho de limitación
            </h4>
            <p className="text-sm text-gray-700">
              Solicitar la limitación del tratamiento de tus datos.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600" />
              Derecho de portabilidad
            </h4>
            <p className="text-sm text-gray-700">
              Recibir tus datos en formato electrónico y transmitirlos a otro
              responsable.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Derecho de oposición
            </h4>
            <p className="text-sm text-gray-700">
              Oponerte al tratamiento de tus datos, especialmente para
              marketing.
            </p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-indigo-900 mb-2">
            ¿Cómo ejercer tus derechos?
          </h4>
          <p className="text-indigo-800 text-sm mb-2">
            Puedes ejercer estos derechos enviando una solicitud a:
          </p>
          <ul className="text-sm text-indigo-800 space-y-1">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:privacidad@3dprint.com" className="underline">
                privacidad@3dprint.com
              </a>
            </li>
            <li>
              <strong>Correo postal:</strong> Calle Admin 123, 08001 Barcelona,
              Barcelona, España
            </li>
          </ul>
          <p className="text-indigo-800 text-sm mt-2">
            Deberás acompañar copia de tu DNI/NIE para verificar tu identidad.
            Responderemos en un plazo máximo de 1 mes.
          </p>
        </div>
        <p className="text-gray-700 text-sm">
          También tienes derecho a presentar una reclamación ante la Agencia
          Española de Protección de Datos (AEPD) si consideras que el
          tratamiento de tus datos vulnera la normativa aplicable.
        </p>
      </>
    ),
  },
  {
    id: "seguridad",
    icon: Lock,
    title: "8. Seguridad de los Datos",
    content: (
      <>
        <p className="mb-4">
          En 3D Print implementamos medidas de seguridad técnicas y
          organizativas apropiadas para proteger tus datos personales contra el
          acceso no autorizado, la alteración, divulgación o destrucción:
        </p>
        <ul className="space-y-3 text-gray-700 mb-4">
          <li className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Cifrado SSL/TLS:</strong> Todas las comunicaciones entre
              tu navegador y nuestro servidor están cifradas.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Contraseñas seguras:</strong> Las contraseñas se almacenan
              de forma encriptada utilizando algoritmos seguros.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Pagos seguros:</strong> Los datos de pago se procesan a
              través de proveedores certificados (PCI DSS compliant).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Acceso restringido:</strong> Solo el personal autorizado
              puede acceder a los datos personales.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Copias de seguridad:</strong> Realizamos backups
              periódicos para prevenir pérdida de datos.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Monitoreo:</strong> Vigilamos continuamente nuestros
              sistemas para detectar posibles vulnerabilidades.
            </span>
          </li>
        </ul>
        <p className="text-gray-700">
          En caso de producirse una violación de seguridad que afecte a tus
          datos personales, te notificaremos de inmediato y tomaremos las
          medidas necesarias para minimizar el impacto.
        </p>
      </>
    ),
  },
  {
    id: "terceros",
    icon: Users,
    title: "9. Terceros y Cesiones de Datos",
    content: (
      <>
        <p className="mb-4">
          Para prestar nuestros servicios, podemos compartir tus datos con
          terceros proveedores de servicios:
        </p>
        <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                Categoría
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                Finalidad
              </th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3">Pasarelas de pago</td>
              <td className="px-4 py-3">Procesar pagos de forma segura</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3">Empresas de transporte</td>
              <td className="px-4 py-3">Gestionar envíos y entregas</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3">Servicios de email</td>
              <td className="px-4 py-3">Enviar comunicaciones y newsletters</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Servicios de hosting</td>
              <td className="px-4 py-3">Alojar y mantener el sitio web</td>
            </tr>
          </tbody>
        </table>
        <p className="mb-4 text-gray-700">
          Todos nuestros proveedores están obligados contractualmente a mantener
          la confidencialidad y seguridad de tus datos y a utilizarlos
          únicamente para las finalidades específicas indicadas.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">
            Transferencias internacionales
          </h4>
          <p className="text-yellow-800 text-sm">
            Algunos de nuestros proveedores pueden tener servidores ubicados
            fuera del Espacio Económico Europeo (EEE). En estos casos,
            garantizamos que se aplican salvaguardias adecuadas, como cláusulas
            contractuales tipo aprobadas por la Comisión Europea.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "10. Cookies y Tecnologías Similares",
    content: (
      <>
        <p className="mb-4">
          Utilizamos cookies y tecnologías similares para mejorar tu experiencia
          de navegación, analizar el uso de nuestra web y personalizar
          contenidos.
        </p>
        <h4 className="font-semibold text-gray-900 mb-2">
          Tipos de cookies que utilizamos:
        </h4>
        <ul className="space-y-3 text-gray-700 mb-4">
          <li className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs font-medium flex-shrink-0 mt-0.5">
              Necesarias
            </span>
            <span>
              Esenciales para el funcionamiento del sitio (carrito de compra,
              sesión de usuario).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-green-100 text-green-700 rounded px-2 py-0.5 text-xs font-medium flex-shrink-0 mt-0.5">
              Preferencias
            </span>
            <span>
              Permiten recordar tus preferencias (idioma, moneda, etc.).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-yellow-100 text-yellow-700 rounded px-2 py-0.5 text-xs font-medium flex-shrink-0 mt-0.5">
              Estadísticas
            </span>
            <span>Nos ayudan a entender cómo interactúas con la web.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-red-100 text-red-700 rounded px-2 py-0.5 text-xs font-medium flex-shrink-0 mt-0.5">
              Marketing
            </span>
            <span>Utilizadas para mostrarte anuncios relevantes.</span>
          </li>
        </ul>
        <p className="mb-4 text-gray-700">
          Al acceder a nuestra web, se te mostrará un banner de cookies donde
          podrás configurar tus preferencias. Puedes modificar estas
          preferencias en cualquier momento desde el enlace &quot;Configuración
          de cookies&quot; en el footer.
        </p>
        <p className="text-gray-700">
          Para más información, consulta nuestra{" "}
          <Link
            href="/cookies"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            Política de Cookies
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "contacto",
    icon: Mail,
    title: "11. Contacto",
    content: (
      <>
        <p className="mb-4">
          Si tienes alguna pregunta sobre esta Política de Privacidad o sobre
          cómo tratamos tus datos personales, no dudes en contactarnos:
        </p>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Email de privacidad</p>
                <a
                  href="mailto:privacidad@3dprint.com"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  privacidad@3dprint.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Dirección postal</p>
                <p className="text-gray-700">3D Print</p>
                <p className="text-gray-700">Calle Admin 123</p>
                <p className="text-gray-700">
                  08001 Barcelona, Barcelona, España
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-800">
            <strong>Nota importante:</strong> Esta política puede actualizarse
            periódicamente para reflejar cambios en nuestras prácticas de
            privacidad o en la legislación aplicable. Te recomendamos revisarla
            regularmente.
          </p>
          <p className="text-sm text-indigo-800 mt-2">
            <strong>Última actualización:</strong> Abril 2025
          </p>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="h-16 w-16 mx-auto mb-6 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Política de Privacidad
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Tu privacidad es importante para nosotros. Conoce cómo protegemos
              y tratamos tus datos personales.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">
              Política de Privacidad
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Quick Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Resumen Ejecutivo
            </h2>
            <p className="text-gray-700 mb-4">
              En 3D Print tratamos tus datos personales de forma transparente y
              segura. Solo recopilamos la información necesaria para gestionar
              tus pedidos, ofrecerte atención al cliente y, si lo autorizas,
              enviarte comunicaciones comerciales.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <Lock className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-indigo-900">
                  Datos Seguros
                </p>
                <p className="text-xs text-indigo-700">
                  Cifrado SSL y medidas avanzadas
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <Scale className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-indigo-900">
                  Cumplimiento RGPD
                </p>
                <p className="text-xs text-indigo-700">
                  Conforme a la normativa europea
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <User className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-indigo-900">
                  Tus Derechos
                </p>
                <p className="text-xs text-indigo-700">
                  Acceso, rectificación y supresión
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {privacySections.map((section) => {
              const Icon = section.icon;
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow scroll-mt-8"
                >
                  <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <div className="px-6 py-6 text-gray-700 leading-relaxed">
                    {section.content}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-8 text-white text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">
              ¿Tienes preguntas sobre privacidad?
            </h2>
            <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
              Nuestro equipo de privacidad está aquí para ayudarte. No dudes en
              contactarnos para cualquier duda relacionada con tus datos
              personales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:privacidad@3dprint.com"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Mail className="h-5 w-5" />
                Contactar por email
              </a>
              <Link
                href="/faqs"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                Ver FAQs
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Esta política de privacidad está sujeta a cambios. Última
              actualización: Abril 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
