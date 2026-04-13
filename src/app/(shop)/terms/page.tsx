/**
 * Términos y Condiciones
 * Página legal para el e-commerce de productos impresos en 3D
 * Responsive: mobile → 4K
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  ChevronRight,
  Copyright,
  CreditCard,
  Globe,
  Package,
  RotateCcw,
  Scale,
  Shield,
  Truck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | 3D Print',
  description:
    'Términos y condiciones de uso de nuestra tienda de productos impresos en 3D. ' +
    'Información legal sobre compras, envíos, devoluciones y propiedad intelectual.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/terms',
  },
};

interface TermsSection {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

const termsSections: TermsSection[] = [
  {
    id: 'general',
    icon: BookOpen,
    title: '1. Términos Generales',
    content: (
      <div className="space-y-4">
        <p>
          Las presentes condiciones generales de venta se aplican a todas las ventas de productos realizadas a través
          del sitio web 3dprint.com, propiedad de 3D Print (en adelante, &quot;la Empresa&quot;), con domicilio social
          en Calle Admin 123, 08001 Barcelona, Barcelona, España.
        </p>
        <p>
          Al realizar un pedido en nuestra tienda online, el cliente (en adelante, &quot;el Cliente&quot;) acepta sin
          reservas estas condiciones generales de venta, las cuales prevalecen sobre cualquier otra documentación o
          comunicación previa, ya sea verbal o escrita.
        </p>
        <p>
          La Empresa se reserva el derecho de modificar estas condiciones en cualquier momento. Las modificaciones serán
          aplicables únicamente a los pedidos realizados con posterioridad a su publicación en el sitio web.
        </p>
        <p>
          Para cualquier consulta relacionada con estas condiciones, puede contactarnos a través del correo electrónico:{' '}
          <a href="mailto:info@3dprint.com" className="text-indigo-600 hover:text-indigo-800">
            info@3dprint.com
          </a>
        </p>
      </div>
    ),
  },
  {
    id: 'website',
    icon: Globe,
    title: '2. Uso del Sitio Web',
    content: (
      <div className="space-y-4">
        <p>
          El acceso y uso del sitio web está sujeto a la aceptación de estas condiciones. El usuario se compromete a
          utilizar el sitio de forma lícita, conforme a la buena fe y al orden público.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>No está permitido el uso del sitio web para fines ilegales o no autorizados.</li>
          <li>El usuario se obliga a no realizar actividades que puedan dañar, inutilizar o sobrecargar la web.</li>
          <li>
            Queda prohibida la reproducción, distribución o comunicación pública de los contenidos sin autorización
            expresa.
          </li>
          <li>
            La Empresa no garantiza la disponibilidad continua del servicio, pero realizará los esfuerzos razonables
            para mantenerlo operativo.
          </li>
        </ul>
        <p>
          Nos reservamos el derecho de suspender temporalmente el acceso al sitio web por motivos de mantenimiento,
          actualizaciones o reparaciones, sin previo aviso.
        </p>
      </div>
    ),
  },
  {
    id: 'products',
    icon: Package,
    title: '3. Productos y Precios',
    content: (
      <div className="space-y-4">
        <p>
          Nuestros productos son objetos impresos en 3D utilizando materiales de alta calidad, principalmente PLA y
          PETG. Cada pieza es fabricada bajo demanda, lo que permite personalización y garantiza frescura del material.
        </p>
        <p>
          <strong>Características de los productos:</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Todas las piezas están impresas con filamentos de calidad certificada.</li>
          <li>
            Las dimensiones pueden variar ligeramente debido a la naturaleza del proceso de impresión 3D (±0.2mm).
          </li>
          <li>
            Los colores pueden presentar variaciones mínimas respecto a las imágenes mostradas debido a la configuración
            de pantalla.
          </li>
          <li>
            Cada pieza puede presentar marcas leves propias del proceso de fabricación por capas, lo cual es normal y no
            afecta la funcionalidad.
          </li>
        </ul>
        <p>
          <strong>Precios:</strong> Todos los precios indicados en el sitio web incluyen el IVA vigente en España (21%)
          y se expresan en Euros (€). Los precios pueden modificarse sin previo aviso, pero los pedidos confirmados
          mantendrán el precio vigente al momento de la compra.
        </p>
      </div>
    ),
  },
  {
    id: 'orders',
    icon: CreditCard,
    title: '4. Pedidos y Pago',
    content: (
      <div className="space-y-4">
        <p>
          <strong>Proceso de pedido:</strong> Para realizar un pedido, el Cliente debe seguir el proceso de compra en el
          sitio web, añadiendo los productos deseados al carrito y completando la información de envío y pago requerida.
        </p>
        <p>
          <strong>Confirmación:</strong> Una vez realizado el pedido, el Cliente recibirá un correo electrónico de
          confirmación con los detalles de la compra. El contrato de compraventa quedará perfeccionado en el momento de
          la confirmación del pago.
        </p>
        <p>
          <strong>Métodos de pago aceptados:</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Tarjeta de crédito/débito (Visa, Mastercard, American Express)</li>
          <li>PayPal</li>
          <li>Transferencia bancaria (el pedido se procesará tras confirmar el ingreso)</li>
        </ul>
        <p>
          <strong>Seguridad:</strong> Todas las transacciones están protegidas mediante encriptación SSL. No almacenamos
          los datos de las tarjetas de crédito en nuestros servidores.
        </p>
        <p>
          Nos reservamos el derecho de cancelar cualquier pedido sospechoso de fraude o actividad ilícita, notificando
          al Cliente en un plazo máximo de 24 horas.
        </p>
      </div>
    ),
  },
  {
    id: 'shipping',
    icon: Truck,
    title: '5. Envíos y Entrega',
    content: (
      <div className="space-y-4">
        <p>
          <strong>Zonas de envío:</strong> Realizamos envíos a toda España peninsular, Baleares, Canarias, Ceuta y
          Melilla. También ofrecemos envíos internacionales a países de la Unión Europea.
        </p>
        <p>
          <strong>Tiempos de entrega estimados:</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>España peninsular: 3-5 días laborables</li>
          <li>Islas Baleares: 5-7 días laborables</li>
          <li>Islas Canarias, Ceuta y Melilla: 7-10 días laborables</li>
          <li>Unión Europea: 5-10 días laborables</li>
        </ul>
        <p>
          <strong>Costes de envío:</strong> Los gastos de envío se calculan automáticamente durante el proceso de compra
          según la zona de destino y el peso del paquete. Ofrecemos envío gratuito en pedidos superiores a 50€ para
          España peninsular.
        </p>
        <p>
          <strong>Embalaje:</strong> Todos nuestros productos se envían en embalaje protector reciclable para garantizar
          que lleguen en perfectas condiciones. Priorizamos materiales de embalaje sostenibles y reciclables.
        </p>
        <p>
          <strong>Incidencias:</strong> En caso de retraso en la entrega o problema con el paquete, el Cliente debe
          notificarnos en un plazo máximo de 48 horas desde la recepción del pedido o la fecha estimada de entrega.
        </p>
      </div>
    ),
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: '6. Devoluciones y Reembolsos',
    content: (
      <div className="space-y-4">
        <p>
          <strong>Derecho de desistimiento:</strong> De conformidad con la normativa europea, el Cliente dispone de un
          plazo de 14 días naturales desde la recepción del producto para ejercer su derecho de desistimiento sin
          necesidad de justificación.
        </p>
        <p>
          <strong>Condiciones de devolución:</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>El producto debe estar sin usar y en las mismas condiciones en que fue recibido.</li>
          <li>Debe conservar su embalaje original completo.</li>
          <li>Los productos personalizados o hechos a medida no admiten devolución salvo defecto de fabricación.</li>
          <li>Los gastos de devolución corren a cargo del Cliente, salvo que el producto tenga defectos.</li>
        </ul>
        <p>
          <strong>Proceso de devolución:</strong> Para iniciar una devolución, el Cliente debe contactar con nosotros a
          través del correo{' '}
          <a href="mailto:devoluciones@3dprint.com" className="text-indigo-600 hover:text-indigo-800">
            devoluciones@3dprint.com
          </a>{' '}
          indicando el número de pedido y motivo de la devolución.
        </p>
        <p>
          <strong>Reembolso:</strong> Una vez recibido y verificado el producto devuelto, procederemos al reembolso en
          un plazo máximo de 14 días. El reembolso se realizará mediante el mismo método de pago utilizado en la compra
          original.
        </p>
        <p>
          <strong>Productos defectuosos:</strong> Si el producto llega defectuoso o dañado, el Cliente debe notificarlo
          en un plazo de 48 horas, aportando fotografías del defecto. En estos casos, asumimos todos los gastos de
          devolución y envío de un nuevo producto.
        </p>
      </div>
    ),
  },
  {
    id: 'intellectual-property',
    icon: Copyright,
    title: '7. Propiedad Intelectual',
    content: (
      <div className="space-y-4">
        <p>
          Todos los diseños, modelos 3D, logotipos, textos, imágenes y demás contenidos del sitio web son propiedad
          exclusiva de 3D Print o de sus licenciantes, y están protegidos por las leyes de propiedad intelectual e
          industrial.
        </p>
        <p>
          <strong>Derechos reservados:</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            Queda prohibida la reproducción, distribución o comunicación pública de los diseños sin autorización
            expresa.
          </li>
          <li>Los productos adquiridos están destinados exclusivamente al uso personal del Cliente.</li>
          <li>No se autoriza la reproducción, ingeniería inversa o comercialización de los productos comprados.</li>
          <li>Los modelos 3D de diseño propio no se incluyen ni se venden junto con los productos físicos.</li>
        </ul>
        <p>
          <strong>Diseños de terceros:</strong> Algunos de nuestros productos pueden estar basados en diseños con
          licencia Creative Commons u otras licencias de uso. En tales casos, se respeta la atribución correspondiente y
          los términos de la licencia aplicable.
        </p>
        <p>
          El incumplimiento de estos derechos de propiedad intelectual podrá dar lugar a acciones legales conforme a la
          legislación vigente.
        </p>
      </div>
    ),
  },
  {
    id: 'liability',
    icon: Shield,
    title: '8. Limitación de Responsabilidad',
    content: (
      <div className="space-y-4">
        <p>
          La Empresa pone el máximo empeño en garantizar la calidad y seguridad de sus productos. Sin embargo,
          establecemos las siguientes limitaciones de responsabilidad:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>
            <strong>Uso adecuado:</strong> Los productos deben utilizarse conforme a su finalidad y especificaciones. No
            nos hacemos responsables de daños derivados de un uso indebido o contrario a las instrucciones
            proporcionadas.
          </li>
          <li>
            <strong>Productos de decoración:</strong> Los artículos decorativos no son juguetes y no están destinados a
            menores de 14 años sin supervisión adulta.
          </li>
          <li>
            <strong>Resistencia térmica:</strong> Los productos de PLA tienen una resistencia térmica limitada (aprox.
            60°C). No exponer a fuentes de calor directas.
          </li>
          <li>
            <strong>Variaciones del producto:</strong> Las piezas impresas en 3D pueden presentar pequeñas variaciones
            respecto a las imágenes de referencia, propias del proceso de fabricación.
          </li>
        </ul>
        <p>
          <strong>Exclusiones:</strong> No seremos responsables por daños indirectos, lucro cesante o cualquier otro
          daño emergente que no sea consecuencia directa e inmediata del defecto del producto.
        </p>
        <p>
          Nuestra responsabilidad queda limitada al valor del producto adquirido, salvo en casos de dolo o negligencia
          grave.
        </p>
      </div>
    ),
  },
  {
    id: 'governing-law',
    icon: Scale,
    title: '9. Legislación Aplicable',
    content: (
      <div className="space-y-4">
        <p>
          Las presentes condiciones generales se rigen por la legislación española y, en su caso, por las normas del
          comercio electrónico de la Unión Europea.
        </p>
        <p>
          <strong>Jurisdicción:</strong> Para cualquier controversia que pudiera derivarse del acceso al sitio web o de
          las relaciones comerciales establecidas, las partes se someten a los juzgados y tribunales de Barcelona, con
          renuncia expresa a cualquier otro fuero que pudiera corresponderles.
        </p>
        <p>
          <strong>Resolución de conflictos:</strong> En cumplimiento de la normativa europea, informamos al Cliente que
          puede acudir a la plataforma de resolución de litigios en línea de la Unión Europea:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
        <p>
          <strong>Mediación:</strong> Antes de iniciar cualquier procedimiento judicial, las partes se comprometen a
          intentar resolver las diferencias de forma amistosa mediante negociación directa.
        </p>
        <p>
          <strong>Datos registrales:</strong> 3D Print está inscrita en el Registro Mercantil de Barcelona. CIF:
          B12345678. Dirección: Calle Admin 123, 08001 Barcelona, Barcelona, España.
        </p>
      </div>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <Scale className="h-16 w-16 mx-auto mb-6 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Términos y Condiciones</h1>
            <p className="text-xl text-indigo-100 mb-8">
              Información legal sobre el uso de nuestro sitio web y condiciones de compra
            </p>
            <p className="text-sm text-indigo-200">
              Última actualización:{' '}
              {new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenido</h2>
              <nav className="space-y-1">
                {termsSections.map(section => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 \
                      text-gray-700 hover:bg-white hover:shadow-sm group"
                  >
                    <section.icon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                    <span className="text-sm">{section.title.split('. ')[1]}</span>
                  </a>
                ))}
              </nav>

              {/* Quick Contact */}
              <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">¿Tienes dudas?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Si necesitas aclaraciones sobre nuestros términos, estamos aquí para ayudarte.
                </p>
                <Link
                  href="mailto:info@3dprint.com"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  Contactar con nosotros
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {termsSections.map(section => {
                const Icon = section.icon;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-8"
                  >
                    {/* Section Header */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                      </div>
                    </div>

                    {/* Section Content */}
                    <div className="p-6">
                      <div className="prose prose-indigo max-w-none text-gray-600">{section.content}</div>
                    </div>
                  </section>
                );
              })}

              {/* Acceptance Notice */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Scale className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Aceptación de los Términos</h3>
                    <p className="text-gray-600 text-sm">
                      Al realizar una compra en 3D Print, confirmas que has leído, comprendido y aceptado estos términos
                      y condiciones en su totalidad. Estos términos constituyen un acuerdo legalmente vinculante entre
                      el Cliente y la Empresa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Información de Contacto Legal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Razón Social:</p>
                    <p className="text-gray-600">3D Print</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">CIF:</p>
                    <p className="text-gray-600">B12345678</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Email:</p>
                    <a href="mailto:info@3dprint.com" className="text-indigo-600 hover:text-indigo-800">
                      info@3dprint.com
                    </a>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Dirección:</p>
                    <p className="text-gray-600">Calle Admin 123, 08001 Barcelona, Barcelona, España</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Teléfono:</p>
                    <p className="text-gray-600">+34 930 000 001</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Registro:</p>
                    <p className="text-gray-600">Registro Mercantil de Barcelona</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
