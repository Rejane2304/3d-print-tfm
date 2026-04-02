/**
 * Footer Component
 * Responsive: mobile → 4K
 * Información de contacto y enlaces
 */
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo y descripción */}
          <div className="col-span-1 lg:col-span-1">
            <h3 className="text-xl lg:text-2xl font-bold mb-4">3D Print TFM</h3>
            <p className="text-gray-400 text-sm lg:text-base">
              E-commerce de productos impresos en 3D. Proyecto de fin de máster especializado en impresión aditiva.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white text-sm lg:text-base transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white text-sm lg:text-base transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-gray-400 hover:text-white text-sm lg:text-base transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-gray-400 hover:text-white text-sm lg:text-base transition-colors">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>

          {/* Información legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-400 hover:text-white text-sm lg:text-base cursor-pointer transition-colors">
                  Términos y condiciones
                </span>
              </li>
              <li>
                <span className="text-gray-400 hover:text-white text-sm lg:text-base cursor-pointer transition-colors">
                  Política de privacidad
                </span>
              </li>
              <li>
                <span className="text-gray-400 hover:text-white text-sm lg:text-base cursor-pointer transition-colors">
                  Política de cookies
                </span>
              </li>
              <li>
                <span className="text-gray-400 hover:text-white text-sm lg:text-base cursor-pointer transition-colors">
                  Aviso legal
                </span>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-gray-400 text-sm lg:text-base">
              <li>Email: info@3dprint-tfm.com</li>
              <li>Teléfono: +34 900 123 456</li>
              <li>Madrid, España</li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} 3D Print TFM. Proyecto académico de fin de máster.
            </p>
            <p className="text-gray-500 text-xs text-center md:text-right">
              Tecnología: Next.js, Prisma, PostgreSQL, Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
