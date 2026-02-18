# Swarm Genesis Prompt - eFPear CertiCalc v2.2

Master document: strategy, specs, contracts and checkpoints.

## Vertical Slices (Order of Delivery)
1. **SLICE 1: El Gancho (Eligibility)** - Semaforo Verde/Amarillo/Rojo
2. **SLICE 2: La Accion (Calendar Integration)** - "Eres Elegible" -> "Planificar Fechas"
3. **SLICE 3: El Valor Profundo (Anexo IV Core)** - UAs + SdAs + Contenidos curados
4. **SLICE 4: Exportacion Final** - PDF/DOCX profesional

## Golden Cases
- **A (Estandar):** HOTA0308 / MF0265_3 / UF0048
- **B (Requisito Especial):** MF1057_2 (Ingles) - idioma C1/B2

## Module Contracts
- Parser -> DB: arrays literales (RPs, Contenidos, CEs)
- Eligibility -> UI: `{ status, reasons[] }`
- Pedagogy -> Renderer: UA con `contenidosLiteral`; SdA con campos separados

## Quality Gates
- Git tag per completed slice
- Feature flags in `src/config/flags.ts`
- Snapshot before version close
