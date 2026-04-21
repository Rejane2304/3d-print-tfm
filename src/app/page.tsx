/**
 * Página de Inicio - Optimizada
 * Muestra productos destacados y bienvenida
 * Usa caché para reducir conexiones a BD (Session Mode optimization)
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedProducts, getCategories } from '@/lib/services/products-cache';
import { translateCategoryName } from '@/lib/i18n';

export default async function HomePage() {
  // Usar funciones cacheadas para reducir conexiones a BD
  const [featuredProducts, categories] = await Promise.all([getFeaturedProducts(3), getCategories()]);

  const translatedCategories = categories.map(category => ({
    ...category,
    name: translateCategoryName(category.slug),
  }));

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-bg.jpg"
            alt="Ambiente de producción 3D"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/95 via-indigo-900/80 to-purple-900/70" />
        </div>

        <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white/90">Impresión 3D Profesional</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white mb-6">
              Transforma tu
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                Idea en Realidad
              </span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-white/80 mb-8 max-w-2xl leading-relaxed">
              Descubre nuestra colección de productos impresos en 3D con los mejores materiales PLA y PETG.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-indigo-900 bg-white hover:bg-gray-100 transition-all shadow-lg"
              >
                Explorar Productos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Section */}
      <section className="pt-16 pb-12 lg:pt-20 lg:pb-16 bg-gray-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Explora por categorías
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {translatedCategories.map(category => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug.toUpperCase()}`}
                className="group relative overflow-hidden rounded-xl aspect-[4/3]"
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2">
                  <span className="text-base sm:text-lg lg:text-2xl font-bold text-center px-2 sm:px-4">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gray-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-3 sm:px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              Más Populares
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Productos Destacados
            </h2>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {featuredProducts.map(product => (
                <Link key={product.id} href={`/products/${product.slug}`} className="group block">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 h-full flex flex-col">
                    <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Sin imagen</div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2">
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <span className="text-2xl font-bold text-indigo-600">
                            {Number(product.price).toFixed(2)}
                            <span className="text-lg text-indigo-400">€</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos destacados</h3>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
