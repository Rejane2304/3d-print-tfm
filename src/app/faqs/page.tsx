/**
 * FAQs Page - Frontend
 * Public FAQ page with accordion display and search
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  Loader2,
  AlertCircle,
  MessageCircle,
  ArrowRight
} from 'lucide-react';

interface FAQ {
  id: string;
  pregunta: string;
  respuesta: string;
  orden: number;
}

interface Category {
  nombre: string;
  faqs: FAQ[];
}

export default function FAQsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/faqs');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando FAQs');
      }

      setCategories(data.categorias || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar FAQs basado en búsqueda
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return categories
      .map(category => ({
        ...category,
        faqs: category.faqs.filter(faq => 
          faq.pregunta.toLowerCase().includes(query) ||
          faq.respuesta.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.faqs.length > 0);
  }, [categories, searchQuery]);

  // Expandir/colapsar item
  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Expandir todos de una categoría
  const expandCategory = (categoryName: string) => {
    const category = categories.find(c => c.nombre === categoryName);
    if (category) {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        category.faqs.forEach(faq => newSet.add(faq.id));
        return newSet;
      });
    }
  };

  // Colapsar todos
  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  // Expandir todos
  const expandAll = () => {
    const allIds = new Set<string>();
    filteredCategories.forEach(cat => {
      cat.faqs.forEach(faq => allIds.add(faq.id));
    });
    setExpandedItems(allIds);
  };

  // Scroll a categoría
  const scrollToCategory = (categoryName: string) => {
    setActiveCategory(categoryName);
    const element = document.getElementById(`category-${categoryName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando preguntas frecuentes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Preguntas Frecuentes | 3D Print</title>
        <meta name="description" content="Encuentra respuestas a las preguntas más comunes sobre nuestros productos impresos en 3D, envíos, devoluciones y más." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 md:py-24">
            <div className="text-center max-w-3xl mx-auto">
              <HelpCircle className="h-16 w-16 mx-auto mb-6 opacity-80" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Preguntas Frecuentes
              </h1>
              <p className="text-xl text-indigo-100 mb-8">
                Encuentra respuestas a tus dudas sobre nuestros productos, envíos y más
              </p>
              
              {/* Search Box */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en las FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-white/30 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
          {/* Error */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && filteredCategories.length === 0 && (
            <div className="text-center py-16">
              <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600 mb-6">
                No hay FAQs que coincidan con tu búsqueda.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredCategories.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar - Category Navigation */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Categorías
                  </h2>
                  <nav className="space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category.nombre}
                        onClick={() => scrollToCategory(category.nombre)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                          activeCategory === category.nombre
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{category.nombre}</span>
                        <span className="text-sm text-gray-400">
                          {category.faqs.length}
                        </span>
                      </button>
                    ))}
                  </nav>

                  {/* Contact CTA */}
                  <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <MessageCircle className="h-8 w-8 text-indigo-600 mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">
                      ¿No encuentras tu respuesta?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Contáctanos y te ayudaremos con tu consulta.
                    </p>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      Contactar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Controls */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-gray-600">
                    {filteredCategories.reduce((acc, cat) => acc + cat.faqs.length, 0)} preguntas encontradas
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={expandAll}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Expandir todo
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={collapseAll}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Colapsar todo
                    </button>
                  </div>
                </div>

                {/* FAQs by Category */}
                <div className="space-y-8">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.nombre}
                      id={`category-${category.nombre}`}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Category Header */}
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-gray-900">
                            {category.nombre}
                          </h2>
                          <button
                            onClick={() => expandCategory(category.nombre)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Expandir
                          </button>
                        </div>
                      </div>

                      {/* FAQs Accordion */}
                      <div className="divide-y divide-gray-200">
                        {category.faqs.map((faq) => (
                          <div key={faq.id} className="border-b border-gray-100 last:border-b-0">
                            <button
                              onClick={() => toggleItem(faq.id)}
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                            >
                              <span className="font-medium text-gray-900 pr-4">
                                {faq.pregunta}
                              </span>
                              {expandedItems.has(faq.id) ? (
                                <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              )}
                            </button>
                            
                            {/* Answer */}
                            {expandedItems.has(faq.id) && (
                              <div className="px-6 pb-4">
                                <div className="prose prose-indigo max-w-none text-gray-600">
                                  {faq.respuesta.split('\n').map((paragraph, idx) => (
                                    <p key={idx} className="mb-2 last:mb-0">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
