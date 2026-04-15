/**
 * Contact Page
 * Formulario de contacto para consultas y soporte
 * Responsive: mobile → 4K
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, HelpCircle, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacto | 3D Print',
  description:
    'Contacta con nosotros para consultas, soporte o cualquier duda sobre nuestros productos de impresión 3D.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-indigo-600">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">Contacto</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Contacto</h1>
          <p className="mt-2 text-gray-600">
            Estamos aquí para ayudarte. Envíanos tu consulta y te responderemos lo antes posible.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-indigo-600" />
                Enviar mensaje
              </h2>

              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="general">Consulta general</option>
                    <option value="products">Información de productos</option>
                    <option value="orders">Estado de pedido</option>
                    <option value="returns">Devoluciones</option>
                    <option value="technical">Soporte técnico</option>
                    <option value="business">Colaboraciones empresariales</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Escribe tu mensaje aquí..."
                    required
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="privacy"
                    name="privacy"
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-600">
                    He leído y acepto la{' '}
                    <Link href="/privacy" className="text-indigo-600 hover:text-indigo-800">
                      Política de Privacidad
                    </Link>{' '}
                    y el tratamiento de mis datos para responder a mi consulta.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Enviar mensaje
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Contact Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-600" />
                Información de contacto
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <a href="mailto:info@3dprint.com" className="text-sm text-indigo-600 hover:text-indigo-800">
                      info@3dprint.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Teléfono</p>
                    <a href="tel:+34930000001" className="text-sm text-indigo-600 hover:text-indigo-800">
                      +34 930 000 001
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dirección</p>
                    <p className="text-sm text-gray-600">
                      Calle Admin 123
                      <br />
                      08001 Barcelona
                      <br />
                      Barcelona, España
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Horario</p>
                    <p className="text-sm text-gray-600">
                      Lunes a Viernes: 9:00 - 18:00
                      <br />
                      Sábados: 10:00 - 14:00
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
              <h3 className="font-semibold text-indigo-900 mb-3">¿Necesitas ayuda rápida?</h3>
              <p className="text-sm text-indigo-700 mb-4">
                Consulta nuestras preguntas frecuentes para encontrar respuestas inmediatas.
              </p>
              <Link
                href="/faqs"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                Ver FAQs
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Response Time */}
            <div className="bg-green-50 rounded-xl border border-green-100 p-6">
              <h3 className="font-semibold text-green-900 mb-2">Tiempo de respuesta</h3>
              <p className="text-sm text-green-700">
                Normalmente respondemos en menos de 24 horas durante días laborables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
