# REGLAS DE SEGURIDAD PARA ELIMINACIÓN DE ARCHIVOS

## ⚠️ REGLA DE ORO

**ANTES DE ELIMINAR CUALQUIER ARCHIVO O CARPETA, SE DEBE:**

1. ✅ **PEDIR CONFIRMACIÓN EXPLÍCITA** al usuario
2. ✅ **VERIFICAR** que el archivo no sea crítico para el proyecto
3. ✅ **CREAR RESPALDO** automático del archivo/carpeta
4. ✅ **DOCUMENTAR** el motivo de la eliminación

---

## 📋 CHECKLIST ANTES DE BORRAR

### Para Archivos:
- [ ] ¿Está en .gitignore? (No importa, igual pedir confirmación)
- [ ] ¿Es un archivo de configuración? (package.json, tsconfig.json, etc.)
- [ ] ¿Es parte del código fuente? (src/, prisma/, tests/)
- [ ] ¿Contiene datos importantes? (.env, seed files, etc.)
- [ ] ¿Está referenciado en otro lugar?

### Para Carpetas:
- [ ] ¿Es una carpeta del sistema? (src/, prisma/, tests/, doc/, etc.)
- [ ] ¿Contiene archivos que no se conocen?
- [ ] ¿Es node_modules o .next? (Estas SÍ se pueden borrar sin confirmar)
- [ ] ¿Tiene subcarpetas?

---

## 🚫 ARCHIVOS/ CARPETAS PROTEGIDOS (Nunca borrar sin autorización)

### Críticos:
- `/prisma/schema.prisma`
- `/prisma/migrations/` (si existe)
- `/prisma/seed.ts`
- `/private/data/` (datos CSV)
- `/doc/` (documentación)
- `/tests/` (todos los tests)
- `/.env` y variantes
- `/package.json`
- `/tsconfig.json`
- `/next.config.*`

### De Código:
- Todo en `/src/` excepto archivos temporales
- `/src/app/api/` - Rutas API
- `/src/components/` - Componentes UI
- `/src/lib/` - Utilidades

---

## ✅ PERMITIDOS PARA BORRAR (Sin confirmar)

- `/node_modules/` (reinstalable)
- `/.next/` (cache de build)
- `/dist/` o `/build/` (output de compilación)
- `/test-results/` (output de tests)
- `/coverage/` (reportes de cobertura)
- `/playwright-report/` (reportes de E2E)
- Archivos temporales (*.tmp, *.log)

---

## 🔄 SISTEMA DE RESPALDO AUTOMÁTICO

**Antes de cualquier eliminación:**

1. Crear backup en: `/backups/[fecha]_[archivo|folder]/`
2. Comprimir si es necesario
3. Registrar en: `/backups/DELETION_LOG.md`

---

## 📞 CONFIRMACIÓN REQUERIDA

**Mensaje estándar:**
```
⚠️ VAS A ELIMINAR: [ruta/archivo]

¿Estás seguro? (Sí/No)

Esta acción:
- [ ] Creará un backup automático
- [ ] Registrará la eliminación
- [ ] No se puede deshacer fácilmente

Responde "SÍ ELIMINAR" para confirmar.
```

---

*Creado: 2026-04-01*
*Última actualización: 2026-04-01*
