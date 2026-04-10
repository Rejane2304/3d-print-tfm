/**
 * Footer Component - Modern Design
 * Responsive: mobile → 4K
 * Logo en color, diseño moderno, Barcelona como ubicación
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useSiteConfig } from "@/providers/SiteConfigProvider";
import { Mail, Phone, MapPin, Heart } from "lucide-react";

// Iconos SVG para redes sociales
const InstagramIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.126-5.864 10.126-11.854z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: session } = useSession();
  const { config } = useSiteConfig();
  const isAdmin = session?.user?.rol === "ADMIN";

  // Use config values with fallbacks
  const companyEmail = config?.emailEmpresa || "info@3dprint.com";
  const companyPhone = config?.telefonoEmpresa || "+34 930 000 001";
  const companyCity = config?.ciudadEmpresa || "Barcelona";
  const companyProvince = config?.provinciaEmpresa || "Barcelona";

  // Formatear número de teléfono en grupos de 3
  const formatPhoneNumber = (phone: string): string => {
    // Remover espacios existentes
    const clean = phone.replace(/\s/g, "");
    // Si tiene prefijo internacional (+XX), mantenerlo junto
    if (clean.startsWith("+")) {
      const prefix = clean.substring(0, 3); // +34
      const rest = clean.substring(3);
      // Agrupar el resto en bloques de 3
      const groups = rest.match(/.{1,3}/g) || [];
      return `${prefix} ${groups.join(" ")}`;
    }
    // Sin prefijo, agrupar todo
    const groups = clean.match(/.{1,3}/g) || [];
    return groups.join(" ");
  };

  const formattedPhone = formatPhoneNumber(companyPhone);

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12 lg:py-16">
        {/* Responsive Grid: 1 col mobile, 2 cols sm, 4 cols lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Logo y descripción - spans full width on mobile, 6 cols on lg */}
          <div className="lg:col-span-6">
            {/* Logo en color */}
            <div className="mb-6">
              <Image
                src="/images/logo.svg"
                alt="3D Print"
                width={180}
                height={60}
                className="h-10 sm:h-12 w-auto brightness-0 invert"
                style={{ filter: "none" }}
              />
            </div>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 max-w-md">
              E-commerce especializado en productos impresos en 3D de alta
              calidad.
            </p>

            {/* Social Links - Wrap on small screens */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href="https://instagram.com/3dprint_tfm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all duration-300 min-h-[44px] min-w-[44px]"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>

              <a
                href="https://facebook.com/3dprint_tfm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all duration-300 min-h-[44px] min-w-[44px]"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>

              <a
                href="https://tiktok.com/@3dprint_tfm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all duration-300 min-h-[44px] min-w-[44px]"
                aria-label="TikTok"
              >
                <TikTokIcon />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos - 6 cols on lg */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Quick Links */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="w-1 h-5 bg-indigo-500 rounded-full flex-shrink-0"></span>
                  <span className="truncate">Enlaces</span>
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/"
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group min-h-[24px]"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors flex-shrink-0"></span>
                      <span className="truncate">Inicio</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products"
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group min-h-[24px]"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors flex-shrink-0"></span>
                      <span className="truncate">Catálogo</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/faqs"
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group min-h-[24px]"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors flex-shrink-0"></span>
                      <span className="truncate">FAQs</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/account/profile"
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group min-h-[24px]"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors flex-shrink-0"></span>
                      <span className="truncate">Mi Cuenta</span>
                    </Link>
                  </li>
                  {!isAdmin && (
                    <li>
                      <Link
                        href="/cart"
                        className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group min-h-[24px]"
                      >
                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors flex-shrink-0"></span>
                        <span className="truncate">Carrito</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="w-1 h-5 bg-indigo-500 rounded-full flex-shrink-0"></span>
                  <span className="truncate">Legal</span>
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/terms"
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group min-h-[24px]"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors flex-shrink-0"></span>
                      <span className="truncate">Términos y condiciones</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group min-h-[24px]"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors flex-shrink-0"></span>
                      <span className="truncate">Política de privacidad</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/cookies"
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group min-h-[24px]"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors flex-shrink-0"></span>
                      <span className="truncate">Política de cookies</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/legal"
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group min-h-[24px]"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors flex-shrink-0"></span>
                      <span className="truncate">Aviso legal</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="w-1 h-5 bg-indigo-500 rounded-full flex-shrink-0"></span>
                  <span className="truncate">Contacto</span>
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 group min-h-[44px]">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                      <Mail className="h-4 w-4 text-gray-300 group-hover:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <a
                        href={`mailto:${companyEmail}`}
                        className="text-gray-300 hover:text-white text-sm transition-colors block truncate"
                      >
                        {companyEmail}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 group min-h-[44px]">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                      <Phone className="h-4 w-4 text-gray-300 group-hover:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Teléfono</p>
                      <a
                        href={`tel:${companyPhone.replace(/\s/g, "")}`}
                        className="text-gray-300 hover:text-white text-sm transition-colors block truncate"
                      >
                        {formattedPhone}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 group min-h-[44px]">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                      <MapPin className="h-4 w-4 text-gray-300 group-hover:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Ubicación</p>
                      <p className="text-gray-300 text-sm truncate">
                        {companyCity}, {companyProvince}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center sm:text-left flex items-center justify-center sm:justify-start gap-1 flex-wrap">
              <span className="whitespace-nowrap">
                © {currentYear} 3D Print.
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                Hecho con{" "}
                <Heart className="h-4 w-4 text-red-500 fill-red-500" /> en
                Barcelona
              </span>
            </p>
            <p className="text-gray-500 text-xs text-center sm:text-right">
              <span className="bg-white/5 px-3 py-1 rounded-full inline-block">
                Next.js · Prisma · PostgreSQL · Tailwind
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
