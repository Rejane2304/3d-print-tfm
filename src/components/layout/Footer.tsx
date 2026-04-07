/**
 * Footer Component - Modern Design
 * Responsive: mobile → 4K
 * Logo en color, diseño moderno, Barcelona como ubicación
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Heart,
  HelpCircle
} from 'lucide-react';

// Iconos SVG para redes sociales
const InstagramIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.126-5.864 10.126-11.854z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.8-.1 3.61.21 4.43.64.81.43 1.28 1.07 1.28 2.06 0 .98-.47 1.63-1.28 2.06-.82.43-2.63.74-4.43.64-1.8-.1-3.61-.21-4.43-.64-.81-.43-1.28-1.07-1.28-2.06 0-.98.47-1.63 1.28-2.06.82-.43 2.63-.74 4.43-.64zm0 4.11c1.8.1 3.61-.21 4.43-.64.81-.43 1.28-1.07 1.28-2.06 0-.98-.47-1.63-1.28-2.06-.82-.43-2.63-.74-4.43-.64-1.8.1-3.61.21-4.43.64-.81.43-1.28 1.07-1.28 2.06 0 .98.47 1.63 1.28 2.06.82.43 2.63.74 4.43.64zM19.825 6.2v8.54c0 3.58-2.91 6.5-6.5 6.5s-6.5-2.92-6.5-6.5V6.2h-2v8.54c0 4.69 3.81 8.5 8.5 8.5s8.5-3.81 8.5-8.5V6.2h-2z"/>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: session } = useSession();
  const isAdmin = session?.user?.rol === 'ADMIN';

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
                href="https://instagram.com/3dprint_tfm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all duration-300 group"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>

              <a
                href="https://facebook.com/3dprint_tfm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all duration-300 group"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>

              <a
                href="https://tiktok.com/@3dprint_tfm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all duration-300 group"
                aria-label="TikTok"
              >
                <TikTokIcon />
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
                <Link href="/faqs" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors"></span>
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors"></span>
                  Mi Cuenta
                </Link>
              </li>
              {!isAdmin && (
                <li>
                  <Link href="/cart" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors"></span>
                    Carrito
                  </Link>
                </li>
              )}
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
