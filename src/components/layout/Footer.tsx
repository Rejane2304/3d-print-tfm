/**
 * Footer Component - Modern Design
 * Responsive: mobile → 4K
 * Logo en color, diseño moderno, Barcelona como ubicación
 */
import Link from 'next/link';
import Image from 'next/image';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Heart,
  Share2,
  MessageCircle,
  Globe
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Logo y descripción - ocupa más espacio */}
          <div className="lg:col-span-5">
            {/* Logo en color */}
            <div className="mb-6">
              <Image
                src="/images/logo.svg"
                alt="3D Print"
                width={180}
                height={60}
                className="h-12 w-auto brightness-0 invert"
                style={{ filter: 'none' }}
              />
            </div>
            
            <p className="text-gray-300 text-sm lg:text-base leading-relaxed mb-6 max-w-md">
              E-commerce especializado en productos impresos en 3D de alta calidad.
            </p>

            {/* Social Links */}
            
            <div className="flex items-center gap-4">
              
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all duration-300 group"
                aria-label="Instagram"
              >
                
                <Share2 className="h-5 w-5 text-gray-300 group-hover:text-white" />
              </a>
              
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all duration-300 group"
                aria-label="Facebook"
              >
                
                <MessageCircle className="h-5 w-5 text-gray-300 group-hover:text-white" />
              </a>
              
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all duration-300 group"
                aria-label="Twitter"
              >
                
                <Globe className="h-5 w-5 text-gray-300 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
              Enlaces
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors"></span>
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors"></span>
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors"></span>
                  Mi Cuenta
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors"></span>
                  Carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Información legal */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <span className="text-gray-400 hover:text-white text-sm cursor-pointer transition-colors flex items-center gap-2">
                  Términos y condiciones
                </span>
              </li>
              <li>
                <span className="text-gray-400 hover:text-white text-sm cursor-pointer transition-colors flex items-center gap-2">
                  Política de privacidad
                </span>
              </li>
              <li>
                <span className="text-gray-400 hover:text-white text-sm cursor-pointer transition-colors flex items-center gap-2">
                  Política de cookies
                </span>
              </li>
              <li>
                <span className="text-gray-400 hover:text-white text-sm cursor-pointer transition-colors flex items-center gap-2">
                  Aviso legal
                </span>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="lg:col-span-3">
            <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
              Contacto
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                  <Mail className="h-4 w-4 text-gray-300 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <a href="mailto:info@3dprint-tfm.com" className="text-gray-300 hover:text-white text-sm transition-colors">
                    info@3dprint-tfm.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                  <Phone className="h-4 w-4 text-gray-300 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Teléfono</p>
                  <a href="tel:+34900123456" className="text-gray-300 hover:text-white text-sm transition-colors">
                    +34 900 123 456
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                  <MapPin className="h-4 w-4 text-gray-300 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Ubicación</p>
                  <p className="text-gray-300 text-sm">
                    Barcelona, España
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left flex items-center gap-1">
              © {currentYear} 3D Print. Hecho con 
              <Heart className="h-4 w-4 text-red-500 fill-red-500" /> 
              en Barcelona
            </p>
            <p className="text-gray-500 text-xs text-center md:text-right flex items-center gap-2">
              <span className="bg-white/5 px-3 py-1 rounded-full">
                Next.js · Prisma · PostgreSQL · Tailwind
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
