/**
 * Cookies Policy Page
 * Política de Cookies - Cumplimiento LOPD y RGPD (España/UE)
 * Responsive: mobile → 4K
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Cookie,
  Shield,
  BarChart3,
  Megaphone,
  Settings,
  ExternalLink,
  Mail,
  ChevronRight,
  Info,
  Eye
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Cookies | 3D Print',
  description: 'Información sobre el uso de cookies en nuestra tienda online de impresión 3D. Cumplimiento con la normativa LOPD y RGPD.',
  robots: 'index, follow',
};

interface CookieSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function CookieSection({ title, icon, children }: CookieSectionProps) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white py-12 lg:py-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Política de Cookies</span>
          </nav>

          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Cookie className="h-6 w-6 text-yellow-300" />
              </div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">
                Legal
              </span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4">
              Política de Cookies
            </h1>
            <p className="text-lg lg:text-xl text-white/80 leading-relaxed">
              Te informamos sobre qué son las cookies, qué tipos utilizamos en nuestra web 
              y cómo puedes gestionarlas conforme a la normativa vigente.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Sidebar - Quick Navigation */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                Contenidos
              </h3>
              <nav className="space-y-2">
                {[
                  { href: '#que-son', label: '¿Qué son las cookies?' },
                  { href: '#tipos', label: 'Tipos de cookies' },
                  { href: '#esenciales', label: 'Cookies esenciales' },
                  { href: '#analiticas', label: 'Cookies analíticas' },
                  { href: '#marketing', label: 'Cookies de marketing' },
                  { href: '#gestion', label: 'Gestión de cookies' },
                  { href: '#terceros', label: 'Cookies de terceros' },
                  { href: '#contacto', label: 'Contacto' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block py-2 px-3 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* Last Updated */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Última actualización:</span>
                  <br />
                  {new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* What are Cookies */}
            <div id="que-son">
              <CookieSection
                title="¿Qué son las Cookies?"
                icon={<Cookie className="h-5 w-5 text-indigo-600" />}
              >
                <p className="mb-4">
                  Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
                  (ordenador, tablet, móvil o cualquier otro dispositivo) cuando visitas una página web. 
                  Estos archivos permiten que el sitio web recuerde información sobre tu visita, 
                  como tu idioma preferido, las opciones de configuración seleccionadas y otros datos 
                  que facilitan tu navegación y hacen que la experiencia sea más eficiente.
                </p>
                <p className="mb-4">
                  Las cookies desempeñan un papel muy importante, ya que mejoran la experiencia de navegación 
                  y ayudan a que los sitios web funcionen de manera más eficiente. También proporcionan 
                  información valiosa a los propietarios de los sitios web para mejorar sus servicios 
                  y ofrecer una experiencia más personalizada.
                </p>
                <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
                  <p className="text-sm text-indigo-800">
                    <strong>Importante:</strong> Las cookies no pueden dañar tu dispositivo y no contienen 
                    virus ni malware. Tampoco almacenan información sensible como contraseñas o datos 
                    bancarios sin tu consentimiento expreso.
                  </p>
                </div>
              </CookieSection>
            </div>

            {/* Types of Cookies */}
            <div id="tipos">
              <CookieSection
                title="Tipos de Cookies que Utilizamos"
                icon={<Eye className="h-5 w-5 text-indigo-600" />}
              >
                <p className="mb-4">
                  En <strong>3D Print</strong> utilizamos diferentes tipos de cookies para mejorar 
                  tu experiencia de navegación. A continuación te explicamos cada una de ellas:
                </p>
                
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Según su duración</h4>
                      <p className="text-sm text-gray-600">
                        <strong>Cookies de sesión:</strong> Se eliminan automáticamente cuando cierras el navegador.
                        <br />
                        <strong>Cookies persistentes:</strong> Permanecen en tu dispositivo hasta que caducan o las eliminas manualmente.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Según su finalidad</h4>
                      <p className="text-sm text-gray-600">
                        <strong>Técnicas/Esenciales:</strong> Necesarias para el funcionamiento del sitio.
                        <br />
                        <strong>De preferencias:</strong> Recuerdan tus configuraciones y preferencias.
                        <br />
                        <strong>Analíticas:</strong> Nos ayudan a mejorar recopilando datos estadísticos.
                        <br />
                        <strong>De marketing:</strong> Permiten mostrarte publicidad relevante.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Según su origen</h4>
                      <p className="text-sm text-gray-600">
                        <strong>Cookies propias:</strong> Instaladas por nuestro sitio web.
                        <br />
                        <strong>Cookies de terceros:</strong> Instaladas por servicios externos que utilizamos (análisis, pagos, etc.).
                      </p>
                    </div>
                  </div>
                </div>
              </CookieSection>
            </div>

            {/* Essential Cookies */}
            <div id="esenciales">
              <CookieSection
                title="Cookies Esenciales"
                icon={<Shield className="h-5 w-5 text-indigo-600" />}
              >
                <p className="mb-4">
                  Estas cookies son estrictamente necesarias para el funcionamiento de nuestra web. 
                  Sin ellas, no podríamos ofrecerte ciertos servicios básicos como la gestión del 
                  carrito de compra, el inicio de sesión o la navegación segura.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-semibold text-gray-900">Cookie</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Propósito</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Duración</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-3 font-mono text-xs text-indigo-600">session_id</td>
                        <td className="p-3">Mantiene tu sesión activa mientras navegas</td>
                        <td className="p-3">Sesión</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs text-indigo-600">cart_token</td>
                        <td className="p-3">Recuerda los productos en tu carrito</td>
                        <td className="p-3">30 días</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs text-indigo-600">csrf_token</td>
                        <td className="p-3">Protege contra ataques de falsificación de peticiones</td>
                        <td className="p-3">Sesión</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs text-indigo-600">cookie_consent</td>
                        <td className="p-3">Guarda tus preferencias de cookies</td>
                        <td className="p-3">1 año</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm text-green-800">
                    <strong>Nota:</strong> Estas cookies no requieren tu consentimiento según la 
                    normativa vigente, ya que son imprescindibles para el funcionamiento del sitio. 
                    No puedes desactivarlas desde nuestra página de configuración, pero puedes hacerlo 
                    desde la configuración de tu navegador (aunque esto puede afectar al funcionamiento de la web).
                  </p>
                </div>
              </CookieSection>
            </div>

            {/* Analytics Cookies */}
            <div id="analiticas">
              <CookieSection
                title="Cookies Analíticas"
                icon={<BarChart3 className="h-5 w-5 text-indigo-600" />}
              >
                <p className="mb-4">
                  Las cookies analíticas nos permiten analizar cómo los usuarios interactúan con nuestra web, 
                  identificando qué páginas son más visitadas, cuánto tiempo pasan los usuarios en cada sección 
                  y detectando posibles errores. Esta información es anónima y nos ayuda a mejorar continuamente 
                  nuestros servicios.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-semibold text-gray-900">Cookie</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Propósito</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Duración</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-3 font-mono text-xs text-indigo-600">_ga</td>
                        <td className="p-3">Distingue usuarios únicos (Google Analytics)</td>
                        <td className="p-3">2 años</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs text-indigo-600">_gid</td>
                        <td className="p-3">Distingue usuarios (Google Analytics)</td>
                        <td className="p-3">24 horas</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs text-indigo-600">_gat</td>
                        <td className="p-3">Limita la frecuencia de solicitudes</td>
                        <td className="p-3">1 minuto</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-sm text-yellow-800">
                    <strong>Requiere consentimiento:</strong> Estas cookies requieren tu consentimiento previo. 
                    Puedes aceptarlas o rechazarlas mediante nuestro banner de cookies o desde la configuración 
                    de tu navegador.
                  </p>
                </div>
              </CookieSection>
            </div>

            {/* Marketing Cookies */}
            <div id="marketing">
              <CookieSection
                title="Cookies de Marketing"
                icon={<Megaphone className="h-5 w-5 text-indigo-600" />}
              >
                <p className="mb-4">
                  Estas cookies se utilizan para rastrear a los visitantes en nuestra web y mostrar 
                  anuncios personalizados en otras plataformas. También nos ayudan a medir la eficacia 
                  de nuestras campañas publicitarias y a comprender qué productos pueden interesarte más.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-semibold text-gray-900">Cookie</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Propósito</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Duración</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-3 font-mono text-xs text-indigo-600">_fbp</td>
                        <td className="p-3">Publicidad de Facebook/Meta</td>
                        <td className="p-3">3 meses</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs text-indigo-600">_gcl_au</td>
                        <td className="p-3">Conversión de Google Ads</td>
                        <td className="p-3">3 meses</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Actualmente no utilizamos cookies de marketing activamente. Si en el futuro 
                    decidimos implementar publicidad personalizada, actualizaremos esta política 
                    y solicitaremos tu consentimiento expreso.
                  </p>
                </div>
              </CookieSection>
            </div>

            {/* Managing Cookies */}
            <div id="gestion">
              <CookieSection
                title="Gestión de Cookies"
                icon={<Settings className="h-5 w-5 text-indigo-600" />}
              >
                <p className="mb-4">
                  Tienes derecho a decidir si aceptas o rechazas las cookies. Puedes gestionar tus 
                  preferencias de varias formas:
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Desde nuestro banner de cookies</h3>
                <p className="mb-4">
                  Al acceder a nuestra web por primera vez, verás un banner donde podrás:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-6 ml-4">
                  <li><strong>Aceptar todas:</strong> Consientes el uso de todas las cookies.</li>
                  <li><strong>Configurar preferencias:</strong> Seleccionas qué tipos de cookies aceptas.</li>
                  <li><strong>Rechazar todas:</strong> Solo se utilizarán las cookies esenciales.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Desde tu navegador</h3>
                <p className="mb-4">
                  También puedes configurar tu navegador para bloquear o eliminar cookies. 
                  Consulta la document oficial de cada navegador:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                    { name: 'Mozilla Firefox', url: 'https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en' },
                    { name: 'Safari', url: 'https://support.apple.com/es-es/guide/safari/sfri11471/mac' },
                    { name: 'Microsoft Edge', url: 'https://support.microsoft.com/es-es/microsoft-edge' },
                  ].map((browser) => (
                    <a
                      key={browser.name}
                      href={browser.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700">{browser.name}</span>
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                    </a>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <p className="text-sm text-red-800">
                    <strong>Advertencia:</strong> Bloquear todas las cookies puede afectar negativamente 
                    a la funcionalidad de muchos sitios web, incluido el nuestro. Te recomendamos mantener 
                    activadas al menos las cookies esenciales.
                  </p>
                </div>
              </CookieSection>
            </div>

            {/* Third Party Cookies */}
            <div id="terceros">
              <CookieSection
                title="Cookies de Terceros"
                icon={<ExternalLink className="h-5 w-5 text-indigo-600" />}
              >
                <p className="mb-4">
                  En nuestra web utilizamos servicios de terceros que también pueden instalar cookies 
                  en tu dispositivo. Estos proveedores tienen sus propias políticas de privacidad y 
                  cookies, que te recomendamos consultar:
                </p>

                <div className="space-y-4">
                  {[
                    {
                      name: 'Google Analytics',
                      description: 'Servicio de análisis web para estadísticas de uso anónimas.',
                      policy: 'https://policies.google.com/privacy',
                    },
                    {
                      name: 'PayPal',
                      description: 'Procesamiento de pagos seguros (solo durante el proceso de compra).',
                      policy: 'https://www.paypal.com/es/webapps/mpp/ua/privacy-full',
                    },
                    {
                      name: 'Stripe',
                      description: 'Procesamiento de pagos con tarjeta de crédito/débito.',
                      policy: 'https://stripe.com/es/privacy',
                    },
                  ].map((provider) => (
                    <div key={provider.name} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <ExternalLink className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{provider.description}</p>
                        <a
                          href={provider.policy}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Ver política de privacidad
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CookieSection>
            </div>

            {/* Contact */}
            <div id="contacto">
              <CookieSection
                title="Contacto y Más Información"
                icon={<Mail className="h-5 w-5 text-indigo-600" />}
              >
                <p className="mb-4">
                  Si tienes alguna pregunta sobre nuestra política de cookies, sobre cómo utilizamos 
                  tus datos, o si deseas ejercer tus derechos de protección de datos (acceso, rectificación, 
                  supresión, limitación, portabilidad u oposición), puedes contactarnos:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="mailto:privacy@3dprint.com"
            className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <Mail className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">privacy@3dprint.com</p>
            </div>
          </a>

                  <Link
                    href="/faqs"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                      <Info className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preguntas frecuentes</p>
                      <p className="font-medium text-gray-900">Consulta nuestras FAQs</p>
                    </div>
                  </Link>
                </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Responsable del tratamiento</h4>
              <p className="text-sm text-gray-600">
                <strong>3D Print</strong><br />
                CIF: B12345678<br />
                Dirección: Calle Admin 123, 08001 Barcelona, Barcelona, España<br />
                Email: info@3dprint.com<br />
                Teléfono: +34 930 000 001<br />
                <br />
                Delegado de Protección de Datos (DPD): dpd@3dprint.com
              </p>
            </div>

                <div className="mt-6 text-sm text-gray-500">
                  <p>
                    También tienes derecho a presentar una reclamación ante la{' '}
                    <a
                      href="https://www.aepd.es/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Agencia Española de Protección de Datos (AEPD)
                    </a>{' '}
                    si consideras que el tratamiento de tus datos personales infringe la normativa vigente.
                  </p>
                </div>
              </CookieSection>
            </div>

            {/* Additional Legal Info */}
            <div className="bg-gray-100 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-600">
                Esta política de cookies se actualiza periódicamente para reflejar cambios en nuestras
                prácticas de cookies y en la normativa vigente. Te recomendamos revisarla ocasionalmente.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                © {new Date().getFullYear()} 3D Print. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
