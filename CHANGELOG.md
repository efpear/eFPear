# Changelog

## [2.2.0] — 2026-02-19 (Swarm Genesis)

### Slice 1: Semáforo de Elegibilidad
- `EligibilityCheck.tsx` — evaluación visual tipo semáforo de requisitos docentes
- `eligibilityEngine.ts` — motor de evaluación contra requisitos BOE
- Golden Cases A (HOTA0308 estándar) y B (MF1057_2 idioma C1)

### Slice 2: Puente Calendario
- Bridge desde resultado elegibilidad → planificador calendario
- Banner contextual con código MF + nombre al llegar desde elegibilidad
- Feature flag: `ENABLE_CALENDAR_BRIDGE`

### Slice 3: Motor Anexo IV + Wizard
**Directiva Estratégica v2.2**: pivot de "generación IA" a "mapeo estructural BOE literal".

#### Engine (Agentes A-B)
- `sanitizeLiteralText.ts` — limpieza profunda de texto BOE (BOM, Unicode invisible, smart quotes, control chars, whitespace)
- `ceUtils.ts` — `clasificarCE()` clasificador determinista de CEs por verbo INCUAL + `buildContenidoCEMap()` heurístico tema→capacidad + `TIPOLOGIA_COLORS`
- `anexoIVMapper.ts` — `derivarCriteriosDesdeContenidos()` (Regla Minerva) + `validarUA()` con 4 checkpoints de calidad
- `types/incual.ts` — tipos canónicos INCUAL (15 exports)
- `types/boe.ts` — tipos estructura BOE (BoeUFData, BoeCertificadoData)

#### Wizard UI (Agente C)
- `ProgramacionWizard.tsx` — wizard 3 pasos estilo Notion
  - Step 1: Asignación de bloques temáticos BOE a UAs (dropdown, editor horas, crear/eliminar UAs)
  - Step 2: Capacidades y CEs derivados automáticamente (solo lectura, badges tipología color)
  - Step 3: SdAs auto-generadas desde cruce CE × contenido (15 metodologías, todos los campos editables inline)
- Auto-assign temas a UAs al inicializar (split equitativo)
- Auto-generación SdAs al entrar en Step 3 (1 SdA por CE o grupo de CEs)

#### Data
- `boeDataHOTA0308.ts` — datos literales BOE para HOTA0308 certificado completo (UF0048: 6 caps, 8 temas, 37 CEs; UF0049: parcial)
- `boeRegistry.ts` — registro de certificados con lookup functions

### Slice 4: Export DOCX
- `anexoIVExport.ts` — generador DOCX 100% client-side (librería `docx@^9.0.0`)
  - Encabezado tabla (certificado, módulo, UF, horas)
  - Sección objetivos (capacidades)
  - Per-UA: Col 1 (capacidades/CEs filtrados), Col 2 (contenidos), Col 3 (tabla SdAs 8 columnas)
- Botón "📄 Generar Anexo IV (.docx)" en Step 3 del wizard
- Sanitización defense-in-depth: `textCell()` y `headerCell()` sanitizan antes de renderizar

### Pre-deploy QA (16 rondas 6 Hats)
**5 bugs corregidos:**
- 🔴 P1: `ensureSdAs` useEffect loop infinito → gate con `initialized` Set
- 🔴 P1: `obtenerDatosMF` import faltante en `boeRegistry.ts`
- 🔴 P1: Wizard invisible con cert default HOTR0208 → CTA "Probar Golden Case"
- 🟡 P2: Sanitizer control chars (`\x0B`, `\x0C`) fusionaban palabras → reemplazar con espacio
- 🟢 P3: `handleCreateUA` stale closure → `nextNum` movido dentro de functional updater

**Verificaciones clean:**
- 35/35 CEs golden case clasificados, 0 fallback hits
- 127/127 strings golden pasan sanitizer sin cambio
- 0 imports rotos (20 archivos verificados)
- Contratos de tipo: UAExport 9/9, SdAExport 8/8, AnexoIVExportData 4/4
- 13/13 imports `docx@9` válidos
- 0 pitfalls de seguridad/calidad

### Infraestructura
- `config/flags.ts` — feature flags para todas las features nuevas
- `vitest.config.ts` — configuración tests con coverage en `src/engine/`
- Tests: `slice3-4.test.ts` — 40+ tests para sanitizer, CE classifier, contenido-CE map

## [2.1.0] — 2026-02-17 (Bloque 4 Stable)
- Tag: `v2.1-prod`
- Distribution engine + curriculum engine
- Calendar engine + SEPE parser
- PWA manifest + offline support
