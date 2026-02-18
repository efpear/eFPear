# eFPear CertiCalc — Bloque 5: Motor Pedagógico y Anexo IV

> Spec de integración v2.1 → v2.2/v3.0

## Enfoque

No se sustituye el calendario; se **añade una vista nueva** (Programación didáctica / Anexo IV) 
que trabaja sobre los mismos módulos y que opcionalmente se mapea al calendario.

## Estructura de engines

```
src/engine/
  calendarEngine.ts       # ya existe — no tocar en Bloque 5
  distributionEngine.ts   # ✅ ya integrado (Bloom v1.1)
  curriculumEngine.ts     # ✅ ya integrado (pipeline 7 pasos)
  sdaEngine.ts            # NUEVO — generación de SdAs
  sdaEditEngine.ts        # NUEVO — CRUD SdAs (add/dup/del/CE)
  verbsDictionary.ts      # NUEVO — diccionario de verbos Bloom
  textTemplates.ts        # NUEVO — plantillas de texto metodología
  anexoTemplates.ts       # NUEVO — renderizado HTML Anexo IV
```

## Fases

### P1 — Motor de distribución pedagógica
- [x] Integrar `distributionEngine.ts`
- [x] Añadir tipos nuevos en `types/index.ts`
- [ ] Migración DB v3 → v4 con campos `distribucionPedagogicaAvanzada`

### P2 — Motor SdA + edición básica
- [ ] Integrar `sdaEngine.ts`, `sdaEditEngine.ts`, `verbsDictionary.ts`, `textTemplates.ts`
- [ ] Crear pestaña `Programación didáctica / Anexo IV`
- [ ] UI tabla SdA con: Añadir / Duplicar / Borrar / CE

### P3 — Generación automática de Anexo IV
- [ ] Integrar `anexoTemplates.ts`
- [ ] Vista previa del Anexo IV en HTML
- [ ] Exportación a PDF/DOCX

### P4 — Integración opcional con calendario
- [ ] `asignarSdAsACalendario(plan, unidadesPedagogicas)`
- [ ] Mostrar en `WeeklyView` si una sesión tiene SdA ligada

### P5 — Tests y validación pedagógica
- [x] Tests distributionEngine (23 cases)
- [ ] Tests sdaEngine
- [ ] Tests anexoTemplates
- [ ] Caso de prueba UF0048 (HOTA0308) contra "solución Minerva"

## Capa datos — DB v3 → v4

```ts
interface ModuloDBV4 extends ModuloDB {
  distribucionPedagogica?: DistribucionPedagogicaAvanzada;
  unidadesPedagogicas?: UnidadPedagogica[];
}
```

Campos opcionales. Guardar al generar por primera vez; cargar en aperturas posteriores.

## Flujo de usuario

1. Selecciona certificado y módulo
2. Pestaña "Programación didáctica / Anexo IV"
3. [Generar estructura automáticamente] → UAs + SdAs con textos base
4. Edición inline: Añadir / Duplicar / Borrar SdA + gestión CE (chips + dropdown)
5. [Vista previa Anexo IV] → HTML renderizado
6. [Exportar PDF] / [Exportar DOCX]
