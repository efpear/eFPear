# 🍐 eFPear CertiCalc

**Planificación de módulos formativos FP con Anexo IV automático.**

eFPear CertiCalc es una PWA para docentes de Formación Profesional para el Empleo (FPE) que automatiza la generación de la Programación Didáctica (Anexo IV) a partir de los datos oficiales del BOE.

## ✨ Funcionalidades

### 🚦 Semáforo de Elegibilidad (Slice 1)
Evalúa si el perfil del docente cumple los requisitos BOE para impartir un módulo formativo. Muestra resultado visual tipo semáforo (apto/no apto/parcial) con detalle por requisito.

### 📅 Puente Calendario (Slice 2)
Desde el resultado de elegibilidad, accede directamente al planificador de calendario con el contexto del módulo formativo seleccionado.

### 📋 Wizard Programación Didáctica (Slice 3)
Wizard de 3 pasos estilo Notion para construir el Anexo IV:

1. **Contenidos (Col 2)** — Asigna bloques temáticos BOE a Unidades de Aprendizaje (UAs)
2. **Criterios (Col 1)** — Capacidades y CEs derivados automáticamente (solo lectura, con badges de tipología)
3. **Situaciones de Aprendizaje (Col 3)** — Generación automática de SdAs desde el cruce CE × contenido

**Regla Minerva**: Contenidos → Criterios → SdAs. La selección de contenidos dirige todo el proceso.

### 📄 Export DOCX (Slice 4)
Genera el documento Anexo IV completo como `.docx` directamente en el navegador:
- Encabezado con datos del certificado, módulo y UF
- Sección de objetivos (capacidades)
- Por cada UA: Columna 1 (capacidades/CEs), Columna 2 (contenidos), Columna 3 (tabla de SdAs)

## 🏗️ Arquitectura

```
src/
├── components/
│   ├── ProgramacionWizard.tsx   # Wizard 3 pasos Anexo IV
│   ├── EligibilityCheck.tsx     # Semáforo elegibilidad
│   ├── CatalogBrowser.tsx       # Buscador catálogo SEPE
│   └── NotionPlanning.tsx       # Planificador calendario
├── engine/
│   ├── ceUtils.ts               # clasificarCE() — clasificador determinista
│   ├── sanitizeLiteralText.ts   # Limpieza texto BOE
│   ├── anexoIVMapper.ts         # Regla Minerva + validación
│   ├── anexoIVExport.ts         # Generador DOCX (docx library)
│   ├── calendarEngine.ts        # Motor calendario
│   └── sepeParser.ts            # Parser fichas SEPE
├── data/
│   ├── boeDataHOTA0308.ts       # Golden case HOTA0308 (literal BOE)
│   └── boeRegistry.ts           # Registro certificados
├── types/
│   ├── boe.ts                   # Tipos datos BOE
│   ├── incual.ts                # Tipos INCUAL canónicos
│   └── index.ts                 # Tipos generales app
└── config/
    └── flags.ts                 # Feature flags
```

### Principios

- **Texto literal BOE** — Sin parafraseo ni generación IA. Copy-paste exacto.
- **INCUAL Glosario 2023** — Ontología maestra para nombres de campo.
- **Clasificación CE determinista** — Basada en verbos INCUAL, verificable por inspección.
- **Client-side 100%** — Sin backend. GDPR by design. PWA offline.
- **Sanitización defensa en profundidad** — `sanitizeLiteralText()` en entrada Y en export.

## 🚀 Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + TypeScript 5 |
| Build | Vite 6 |
| Estilos | Tailwind CSS 3 |
| UI | Radix UI + Lucide icons |
| Persistencia | IndexedDB (Dexie) |
| Export DOCX | docx@9 |
| PWA | vite-plugin-pwa |
| Tests | Vitest + Testing Library |
| Deploy | Vercel |

## 🧪 Tests

```bash
# Ejecutar todos los tests
npm test

# Watch mode
npm run test:watch

# Solo los engines de Slice 3-4
npx vitest run src/engine/__tests__/slice3-4.test.ts
```

**Cobertura de tests:**
- `sanitizeLiteralText` — 14 tests (BOM, Unicode, smart quotes, control chars, whitespace)
- `clasificarCE` — 25+ tests (conocimiento, destreza, habilidad, patterns, determinismo)
- `buildContenidoCEMap` — 4 tests (mapping, orphan temas, edge cases)

## 📋 Feature Flags

Todas las features nuevas están detrás de flags en `src/config/flags.ts`:

```typescript
ENABLE_ELIGIBILITY: true        // Semáforo elegibilidad
ENABLE_CALENDAR_BRIDGE: true    // Puente calendario
ENABLE_PROGRAMACION_WIZARD: true // Wizard 3 pasos
ENABLE_DOCX_EXPORT: true        // Export DOCX
ENABLE_ANEXO_IV: true           // Engine Anexo IV
```

## 🎯 Golden Cases

| Caso | Certificado | Módulo | Estado |
|------|------------|--------|--------|
| **A** (estándar) | HOTA0308 | MF0265_3 | ✅ Datos completos UF0048 + UF0049 |
| **B** (idioma C1) | — | MF1057_2 | 🔲 Pendiente |

## 📦 Deploy

```bash
# Build local
npm run build

# Deploy a Vercel (autodeploy desde main)
git push origin main
```

**Nota:** Los commits via GitHub API (Git Data API) no activan el webhook de Vercel. Requiere redeploy manual desde el dashboard de Vercel.

## 📝 Limitaciones conocidas (v2.2)

- **Heurístico tema→capacidad**: `buildContenidoCEMap` mapea tema[n] → capacidad[n] por índice. Si hay más temas que capacidades, los extras quedan sin CEs asociados.
- **Solo Golden Case A**: Datos BOE completos solo para HOTA0308/MF0265_3. Otros certificados tienen stubs vacíos.
- **Sin backend**: No hay persistencia en servidor. Los datos se guardan en IndexedDB del navegador.

## 📄 Licencia

Privado — © eFPear 2026
