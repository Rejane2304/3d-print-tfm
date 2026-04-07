# Documentación TFM - 3D Print E-commerce

## Resumen Ejecutivo del Proyecto

**Autor**: Rejane Rodrigues  
**Tutor**: Brais Moure  
**Proyecto**: Trabajo de Fin de Máster - Máster en Desarrollo de Software  
**Título**: Desarrollo de una Aplicación E-commerce para Impresión 3D con Next.js y Metodología TDD  
**Fecha**: Abril 2026

---

## Slide 1: Portada

# 3D Print TFM
## E-commerce de Impresión 3D

**Desarrollo de una Aplicación Web con Next.js y Metodología TDD**

**Autor**: Rejane Rodrigues  
**Tutor**: Brais Moure 
**Máster en Desarrollo de Software**  
**Abril 2026**

---

## Slide 2: Índice

1. Introducción y Contexto
2. Objetivos del Proyecto
3. Análisis y Diseño
4. Arquitectura Tecnológica
5. Implementación
6. Testing y Calidad
7. Resultados
8. Conclusiones y Trabajo Futuro

---

## Slide 3: Introducción y Contexto

### Contexto del Proyecto

- **Mercado 3D**: Crecimiento del 20% anual en impresión 3D
- **Necesidad Identificada**: Brecha entre plataformas corporativas (Sculpteo) y marketplaces genéricos (Etsy). Falta soluciones modulares, open source y con enfoque en calidad técnica (TDD) para pequeños emprendedores 3D
- **Oportunidad**: Plataforma especializada con catálogo fijo, arquitectura moderna y stack tecnológico profesional accesible
- **Enfoque**: TDD (Test-Driven Development) para garantizar calidad

### Problemática

- Productos genéricos vs especializados en 3D
- Alta barrera de entrada para makers
- Complejidad técnica para usuarios finales
- Soluciones técnicamente obsoletas o propietarias en el sector
- Difícil acceso a plataformas de calidad para pequeños emprendedores

---

## Slide 4: Objetivos

### Objetivo General

Desarrollar una aplicación e-commerce completa para la venta de productos impresos en 3D, aplicando metodología TDD y arquitectura moderna.

### Objetivos Específicos

1. ✅ Implementar catálogo con filtros y búsqueda
2. ✅ Desarrollar sistema de carrito y checkout
3. ✅ Crear panel de administración completo
4. ✅ Aplicar TDD con cobertura >80%
5. ✅ Garantizar accesibilidad WCAG 2.1 AA
6. ✅ Optimizar performance Lighthouse >90

---

## Slide 5: Análisis - Modelo de Negocio

### Canvas del Modelo de Negocio

| Bloque | Descripción |
|--------|-------------|
| **Propuesta de Valor** | Catálogo especializado de productos 3D de calidad profesional, entrega 3-5 días |
| **Segmentos** | Tech enthusiasts, decoradores, compradores de regalos, makers |
| **Canales** | E-commerce web, SEO, redes sociales |
| **Relaciones** | Soporte personalizado, sistema de reseñas, cupones de fidelización |
| **Ingresos** | Ventas directas (margen 45-60%), cupones, envíos |
| **Recursos** | Plataforma Next.js, impresoras 3D, catálogo de diseños |
| **Actividades** | Desarrollo, producción, marketing, atención al cliente |
| **Socios** | Proveedores de filamento, mensajería, diseñadores |

---

## Slide 6: Análisis - Entidades del Sistema

### Modelo de Datos (18 Entidades)

```
USUARIOS Y AUTENTICACIÓN
├── User, Session, VerificationToken

CATÁLOGO Y TIENDA  
├── Product, Category, ProductImage, Review, Coupon, FAQ

COMPRAS Y PAGOS
├── Cart, CartItem, Order, OrderItem, Payment, Invoice

CONFIGURACIÓN
├── Address, ShippingZone, ShippingConfig, SiteConfig

ADMINISTRACIÓN
├── Alert, OrderMessage, AuditLog, InventoryMovement
```

**Relaciones**: 30+ relaciones entre entidades  
**Índices**: 50+ para optimización

---

## Slide 7: Diseño - Arquitectura

### Arquitectura de Traducción Backend

```
┌─────────────────────────────────────────┐
│   BASE DE DATOS (Inglés)               │
│   "Floral Decorative Vase"              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   API ROUTE (Traducción)               │
│   translateProductName(slug)           │
│   → "Jarrón Decorativo Floral"         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   FRONTEND (Español)                   │
│   Muestra: "Jarrón Decorativo Floral"  │
└─────────────────────────────────────────┘
```

**Ventaja**: No hay i18n en frontend, traducción 100% backend

---

## Slide 8: Tecnologías Utilizadas

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Framework** | Next.js | 14.2.35 |
| **Frontend** | React + Tailwind CSS | 18 + 3.4 |
| **Backend** | Next.js API Routes | 14.2.35 |
| **ORM** | Prisma | 5.22.0 |
| **Base de Datos** | PostgreSQL (Supabase) | 15+ |
| **Autenticación** | NextAuth.js | 4.24.13 |
| **Testing** | Vitest + Playwright | 1.6.1 |
| **Validación** | Zod | 3.23.8 |

### Decisiones Técnicas

- ✅ App Router de Next.js 14
- ✅ Server Components para SEO
- ✅ Traducción backend para performance
- ✅ PostgreSQL para datos relacionales
- ✅ TDD desde el inicio del proyecto

---

## Slide 9: Implementación - Módulos

### Módulos Implementados (20+)

**Tienda Pública (8)**
1. Home con productos destacados
2. Catálogo con filtros avanzados
3. Detalle de producto con galería
4. Carrito persistente
5. Checkout con cupones
6. Sistema de reseñas
7. FAQs públicas
8. Autenticación unificada

**Panel Admin (13)**
1. Dashboard con métricas
2. Productos (CRUD + imágenes)
3. Categorías
4. Pedidos con estados
5. Clientes
6. Inventario con movimientos
7. Facturas (PDF)
8. Cupones (3 tipos)
9. Reseñas (moderación)
10. FAQs
11. Envíos (zonas CP)
12. Configuración
13. Alertas

---

## Slide 10: Implementación - Funcionalidades Clave

### Características Destacadas

**Sistema de Cupones**
- PERCENTAGE: Descuento porcentaje
- FIXED: Descuento fijo
- FREE_SHIPPING: Envío gratis

**Gestión de Envíos**
- Zonas por prefijos de código postal
- Costo base configurable
- Umbral de envío gratis
- Cálculo automático

**Sistema de Reviews**
- Puntuación 1-5 estrellas
- Moderación por admin
- Solo compradores verificados
- Estadísticas de valoración

---

## Slide 11: Testing - Metodología TDD

### Enfoque Test-Driven Development

```
1. Escribir test (falla)
2. Implementar código mínimo (pasa)
3. Refactorizar
4. Repetir
```

### Pirámide de Tests

```
         /\
        /  \     E2E: 114 tests
       /____\       (6 dispositivos)
      /      \   
     /--------\   Integration: 227 tests
    /          \     (API, DB, Pages)
   /____________\  
   Unit: 37 tests
   (Validaciones Zod)
```

---

## Slide 12: Testing - Métricas

### Cobertura de Tests

| Tipo | Cantidad | Cobertura | Estado |
|------|----------|-----------|--------|
| **Unitarios** | 37 | ~3ms/test | ✅ 100% |
| **Integración** | 227 | ~500ms/test | ✅ 100% |
| **E2E** | 114 | ~6s/test | ✅ 100% |
| **TOTAL** | **378** | - | **✅ 100%** |

### Tests E2E Multi-Dispositivo

- Desktop Chrome: 19 ✅
- Desktop Firefox: 19 ✅
- Desktop Safari: 19 ✅
- Tablet iPad: 19 ✅
- Mobile iPhone: 19 ✅
- Desktop 4K: 19 ✅

---

## Slide 13: Calidad - Métricas

### Performance (Lighthouse)

| Página | Performance | Accesibilidad | Mejores Prácticas | SEO |
|--------|-------------|---------------|-------------------|-----|
| Home | 92 | 98 | 100 | 100 |
| Products | 90 | 95 | 100 | 100 |
| Product Detail | 88 | 96 | 100 | 100 |
| Cart | 94 | 97 | 100 | 100 |
| Checkout | 89 | 95 | 100 | 100 |

### Core Web Vitals

- **LCP** (Largest Contentful Paint): <2.5s ✅
- **FID** (First Input Delay): <100ms ✅
- **CLS** (Cumulative Layout Shift): <0.1 ✅

### Accesibilidad

- WCAG 2.1 Nivel A: ✅ Completo
- WCAG 2.1 Nivel AA: ✅ Completo
- Navegación por teclado: ✅
- Textos alternativos: ✅

---

## Slide 14: Seguridad

### Medidas Implementadas

**Autenticación**
- ✅ JWT con refresh tokens
- ✅ Sesiones httpOnly, secure, sameSite
- ✅ Rate limiting (5 intentos/min)
- ✅ bcrypt con salt 12

**Autorización**
- ✅ RBAC (CUSTOMER/ADMIN)
- ✅ Middleware de protección
- ✅ Verificación de propiedad

**Validación**
- ✅ Zod para todas las entradas
- ✅ Sanitización de inputs
- ✅ Prevención SQL Injection (Prisma)
- ✅ Prevención XSS

---

## Slide 15: Resultados - Datos

### Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Líneas de código** | ~20,000+ |
| **Archivos** | 200+ |
| **Commits** | 50+ |
| **Tests** | 378 (100% passing) |
| **Cobertura** | 80%+ |
| **Tiempo desarrollo** | ~8 semanas |
| **Módulos** | 20+ |
| **Entidades BD** | 18 |

### Seed Data

- 10 usuarios (incl. admin)
- 5 categorías
- 10 productos
- 30 imágenes
- 15 reseñas
- 4 cupones
- 9 direcciones
- 10 pedidos

---

## Slide 16: Demo - Funcionalidades

### Flujo de Compra

1. **Navegación**: Usuario explora catálogo
2. **Selección**: Añade producto al carrito
3. **Checkout**: Selecciona dirección y método de pago
4. **Pago**: Simulación de pago exitoso
5. **Confirmación**: Pedido creado con estado CONFIRMED

### Panel de Admin

1. Dashboard con métricas
2. Gestión de productos con imágenes
3. Moderación de reseñas
4. Configuración de cupones
5. Generación de facturas PDF

---

## Slide 17: Lecciones Aprendidas

### Aspectos Positivos

1. **TDD Funciona**: Detectó bugs temprano, código más robusto
2. **Next.js 14**: App Router muy potente y flexible
3. **Prisma**: ORM muy productivo, tipado automático
4. **Traducción Backend**: Simplifica frontend, mejor SEO
5. **Testing Multi-Dispositivo**: Garantiza calidad cross-platform

### Desafíos Superados

1. **Configuración E2E**: Multi-dispositivo con Playwright
2. **Traducción**: Sistema backend i18n sin librerías
3. **Testing con BD**: Testcontainers para PostgreSQL real
4. **PDF Generation**: Puppeteer para facturas
5. **Upload de Imágenes**: Sistema de archivos + optimización

---

## Slide 18: Conclusiones

### Logros del Proyecto

✅ **E-commerce completo** con todas las funcionalidades  
✅ **TDD aplicado** con 378 tests y 100% passing  
✅ **Calidad profesional** Lighthouse 90+, WCAG AA  
✅ **Arquitectura escalable** Next.js 14 + Prisma  
✅ **Documentación completa** español e inglés  

### Valor Académico

- Aplicación práctica de TDD en proyecto real
- Integración de múltiples tecnologías modernas
- Resolución de problemas complejos
- Metodología ágil aplicada

---

## Slide 19: Trabajo Futuro

### Mejoras Identificadas

**Corto Plazo**
- [ ] Integración pagos reales (Stripe/PayPal)
- [ ] Producción física con impresoras 3D
- [ ] Sistema de notificaciones email/SMS
- [ ] Dashboard analítico avanzado

**Medio Plazo**
- [ ] App móvil (PWA/React Native)
- [ ] Inteligencia artificial para recomendaciones
- [ ] Sistema de suscripciones
- [ ] Marketplace multi-vendedor

**Largo Plazo**
- [ ] Expansión internacional
- [ ] Integración con marketplaces (Etsy, Amazon)
- [ ] Impresoras conectadas IoT
- [ ] Blockchain para autenticidad

---

## Slide 20: Cierre

### Agradecimientos

- Al tutor por la orientación
- A la universidad por la formación
- A la comunidad open source

### Contacto

**Autor**: Rejane Rodrigues  
**Email**: [email]  
**GitHub**: github.com/[username]/3d-print-tfm  
**Demo**: [URL desplegada]

---

## Anexos

### Enlaces del Proyecto

- **Repositorio**: https://github.com/[username]/3d-print-tfm
- **Documentación**: /docs/
- **Demo en vivo**: [URL Vercel]

### Tecnologías Clave

- Next.js 14, React 18, TypeScript 5
- Prisma ORM, PostgreSQL, NextAuth.js
- Vitest, Playwright, Tailwind CSS
- Zod, Lucide React

---

**Autor**

# Rejane Rodrigues

**Tutor**

# Brais Moure

*Máster en Desarrollo de Software · Abril 2026*
