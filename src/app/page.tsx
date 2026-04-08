/**
 * Página de Inicio
 * Muestra productos destacados traducidos y bienvenida
 * Responsive: mobile → 4K
 */

// Force dynamic rendering to prevent static caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db/prisma';
import {
  translateProductName,
  translateProductDescription,
  translateProductShortDescription,
  translateCategoryName,
} from '@/lib/i18n';

async function getFeaturedProducts() {
  // Primero buscar productos marcados como destacados por el admin
  const featuredProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    include: {
      images: {
        where: { isMain: true },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 6,
  });

  // Si no hay suficientes productos destacados, completar con los más vendidos
  let finalProducts = featuredProducts;
  if (featuredProducts.length < 3) {
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
      },
      include: {
        items: true,
      },
    });

    const salesByProduct: Record<string, number> = {};
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        if (item.productId) {
          salesByProduct[item.productId] = (salesByProduct[item.productId] || 0) + item.quantity;
        }
      }
    }

    // Obtener IDs de productos ya seleccionados
    const featuredIds = new Set(featuredProducts.map(p => p.id));

    // Buscar productos más vendidos excluyendo los ya destacados
    const additionalProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: false,
        id: {
          notIn: Array.from(featuredIds),
        },
      },
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
      },
    });

    // Ordenar por ventas y tomar los necesarios
    const topSellingProducts = additionalProducts
      .map((product) => ({
        ...product,
        sales: salesByProduct[product.id] || 0,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6 - featuredProducts.length);

    finalProducts = [...featuredProducts, ...topSellingProducts];
  }

  // Traducir productos destacados al español
  const translatedProducts = finalProducts.slice(0, 6).map((product) => ({
    ...product,
    name: translateProductName(product.slug),
    description: translateProductDescription(product.slug),
    shortDescription: translateProductShortDescription(product.slug),
  }));

  return translatedProducts;
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });

  return categories.map((category) => ({
    ...category,
    name: translateCategoryName(category.slug),
  }));
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
  const categories = await getCategories();

  return (
    <div className="bg-white">
      {/* Hero Section con imagen de fondo 3D */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-bg.jpg"
            alt="Ambiente de producción 3D"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/95 via-indigo-900/80 to-purple-900/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-20 lg:py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white/90">Impresión 3D Profesional</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white mb-6">
              Transforma tu
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                Idea en Realidad
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl lg:text-2xl text-white/80 mb-8 max-w-2xl leading-relaxed">
              Descubre nuestra colección de productos impresos en 3D con los mejores materiales PLA y PETG. 
              Calidad profesional, precios competitivos.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-indigo-900 bg-white hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Explorar Productos
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 hidden lg:block">
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Categorías Section */}
      <section className="pt-16 pb-12 lg:pt-20 lg:pb-16 bg-gray-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-12">
            Explora por categorías
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
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
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-xl lg:text-2xl font-bold text-center px-4">{category.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gray-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
              Más Populares
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Productos Destacados</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Los favoritos de nuestros clientes, impresos con la mejor calidad
            </p>
          </div>
          
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {featuredProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 h-full flex flex-col">
                    {/* Image Container */}
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
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-all duration-500" />
                      
                      {/* Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-lg">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Top #{index + 1}
                        </span>
                      </div>
                      
                      {/* Stock Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.stock > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            product.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                          }`} />
                          {product.stock > 0 ? 'En stock' : 'Agotado'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-1">
                          {product.name}
                        </h3>
                        
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                          {product.shortDescription || product.description}
                        </p>
                      </div>
                      
                      {/* Price and Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <span className="text-xs text-gray-400 block mb-1">Desde</span>
                          <span className="text-2xl font-bold text-gray-900">
                            {Number(product.price).toFixed(2)}
                            <span className="text-lg text-gray-500">€</span>
                          </span>
                        </div>
                        
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos destacados</h3>
              <p className="text-gray-500">Los productos más vendidos aparecerán aquí</p>
            </div>
          )}
          
          {/* View All Button */}
          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              Ver todos los productos
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 lg:py-24 bg-indigo-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: '🏆',
                title: 'Calidad Premium',
                description: 'Productos impresos con los mejores materiales PLA y PETG de alta calidad.',
              },
              {
                icon: '📦',
                title: 'Envío Rápido',
                description: 'Entrega en 3-5 días laborables. Envío gratis en pedidos superiores a 50€.',
              },
              {
                icon: '💬',
                title: 'Soporte Personalizado',
                description: 'Atención al cliente especializada. Resolvemos tus dudas en 24 horas.',
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <span className="text-4xl lg:text-5xl mb-4 block">{feature.icon}</span>
                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            ¿Listo para empezar?
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Descubre nuestra colección única de productos impresos en 3D.
          </p>
          
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Ver productos
          </Link>
        </div>
      </section>
    </div>
  );
}
