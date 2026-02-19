// src/engine/validationEngine.ts — Validation Engine for Anexo IV
//
// Runs all quality checks defined in config/validation.json.
// Designed to be extensible: add a rule to the JSON + implement its check here.

export type Severity = "error" | "warning";
export type Scope = "UF" | "UA" | "SdA";

export interface ValidationIssue {
  ruleId: string;
  level: Severity;
  scope: Scope;
  id: string; // ID of the UA or SdA number to locate the issue
  message: string;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Run all validations on a UF structure.
 * @param uf - Full UF data (with uas array, each UA having contenidoBlocks, capacidades, sdas)
 * @param boeRef - Optional BOE reference data for cross-checking
 */
export function runValidations(uf: any, boeRef?: any): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. UF-level rules
  issues.push(...checkUFLevelRules(uf, boeRef));

  // 2. UA-level + SdA-level rules
  const uas = uf.uas || [uf.ua].filter(Boolean);
  uas.forEach((ua: any, uaIdx: number) => {
    issues.push(...checkUALevelRules(ua, uf, uaIdx, uas.length));

    // 3. SdA-level rules
    const sdas = ua.sdas || ua.situacionesAprendizaje || [];
    sdas.forEach((sda: any) => {
      issues.push(...checkSdaLevelRules(sda));
    });
  });

  return issues;
}

// ============================================
// UF-LEVEL RULES
// ============================================

function checkUFLevelRules(uf: any, boeRef: any): ValidationIssue[] {
  const results: ValidationIssue[] = [];

  // BOE_HOURS_MISMATCH: sum of UF hours must match MF total
  if (boeRef?.horasTotalesMF != null) {
    const ufHoras = uf.ufHoras || uf.horas || 0;
    const sumUFHoras = (uf.uas || []).reduce((acc: number, ua: any) => acc + (ua.uaHorasTotales || ua.horas || 0), 0);
    if (sumUFHoras > 0 && boeRef.horasTotalesMF > 0) {
      // Check if UF hours are part of the MF — simplified: just validate internal consistency
      if (ufHoras > boeRef.horasTotalesMF) {
        results.push({
          ruleId: "BOE_HOURS_MISMATCH",
          level: "error",
          scope: "UF",
          id: uf.ufCodigo || uf.codigo || "UF",
          message: `Las horas de la UF (${ufHoras}h) superan las del MF (${boeRef.horasTotalesMF}h).`
        });
      }
    }
  }

  // MISSING_CAPACITY_IN_UF: all C from BOE must be used in at least one UA
  if (boeRef?.capacidades) {
    const uas = uf.uas || [uf.ua].filter(Boolean);
    const usedCapacities = new Set<string>();
    uas.forEach((ua: any) => {
      const caps = ua.capacidades || [];
      caps.forEach((c: any) => usedCapacities.add(c.codigo || c.id));
    });
    boeRef.capacidades.forEach((cap: any) => {
      const capId = cap.codigo || cap.id;
      if (!usedCapacities.has(capId)) {
        results.push({
          ruleId: "MISSING_CAPACITY_IN_UF",
          level: "error",
          scope: "UF",
          id: uf.ufCodigo || uf.codigo || "UF",
          message: `La capacidad ${capId} no se está trabajando en ninguna Unidad de Aprendizaje.`
        });
      }
    });
  }

  return results;
}

// ============================================
// UA-LEVEL RULES
// ============================================

function checkUALevelRules(ua: any, uf: any, uaIdx: number, totalUAs: number): ValidationIssue[] {
  const results: ValidationIssue[] = [];
  const uaId = ua.id || ua.uaNumero ? \`UA-\${ua.uaNumero || uaIdx + 1}\` : \`UA-\${uaIdx + 1}\`;
  const sdas = ua.sdas || ua.situacionesAprendizaje || [];

  // SUM_SDA_HOURS_INCORRECT
  const totalSdaHours = sdas.reduce((acc: number, s: any) => acc + (s.tiempoHoras || s.tiempo || 0), 0);
  const horasTotal = ua.uaHorasTotales || ua.horas || 0;
  const horasEval = ua.uaEvaluacionProcesoHoras || ua.horasEvaluacion || 0;
  const horasAuto = ua.uaAutonomoHoras || ua.horasAutonomo || 0;
  const expectedSdaHours = horasTotal - horasEval - horasAuto;

  if (expectedSdaHours > 0 && totalSdaHours !== expectedSdaHours) {
    results.push({
      ruleId: "SUM_SDA_HOURS_INCORRECT",
      level: "error",
      scope: "UA",
      id: uaId,
      message: \`Las horas no cuadran: hay \${totalSdaHours}h en SdA, pero se esperan \${expectedSdaHours}h.\`
    });
  }

  // ORPHAN_CE_IN_COL1: CEs in capacidades not found in contenido lineas
  const contenidoBlocks = ua.contenidoBlocks || ua.contenidos || [];
  const cesInCol2 = new Set<string>();
  contenidoBlocks.forEach((b: any) => {
    const lineas = b.lineas || b.items || [];
    lineas.forEach((l: any) => {
      const ces = l.ces || l.ceVinculado || l.ce_vinculados || [];
      ces.forEach((ce: string) => cesInCol2.add(ce));
    });
  });

  const capacidades = ua.capacidades || [];
  capacidades.forEach((cap: any) => {
    const allCes = [
      ...(cap.conocimientos || []),
      ...(cap.destrezas || []),
      ...(cap.habilidades || []),
      ...(cap.criterios_evaluacion || []),
      ...(cap.criterios || []),
    ];
    allCes.forEach((ce: any) => {
      const ceId = ce.codigo || ce.id;
      if (ceId && !cesInCol2.has(ceId)) {
        results.push({
          ruleId: "ORPHAN_CE_IN_COL1",
          level: "error",
          scope: "UA",
          id: uaId,
          message: \`El criterio \${ceId} aparece en Columna 1 pero no está vinculado a ningún contenido en Columna 2.\`
        });
      }
    });

    // EMPTY_CAPACITY_IN_UA
    if (allCes.length === 0) {
      results.push({
        ruleId: "EMPTY_CAPACITY_IN_UA",
        level: "warning",
        scope: "UA",
        id: uaId,
        message: \`La capacidad \${cap.codigo || cap.id} no tiene criterios asignados en esta UA.\`
      });
    }
  });

  // FINAL_UA_PO_PPF_MIN: last UA must reserve ≥5h for PO+PPF
  if (uaIdx === totalUAs - 1) {
    if (horasEval < 5) {
      results.push({
        ruleId: "FINAL_UA_PO_PPF_MIN",
        level: "error",
        scope: "UA",
        id: uaId,
        message: \`La última UA debe reservar al menos 5h para PO+PPF, pero solo tiene \${horasEval}h de evaluación.\`
      });
    }
  }

  // AUTONOMO_MARGIN_LOW: autonomous time < 5%
  if (horasTotal > 0 && horasAuto < (horasTotal * 0.05)) {
    results.push({
      ruleId: "AUTONOMO_MARGIN_LOW",
      level: "warning",
      scope: "UA",
      id: uaId,
      message: \`El margen de aprendizaje autónomo (\${horasAuto}h) es inferior al 5% recomendado (\${(horasTotal * 0.05).toFixed(1)}h).\`
    });
  }

  // MISSING_FASE_START_END: if ≥3 SdAs, recommend Inicio + Cierre
  if (sdas.length >= 3) {
    const fases = sdas.map((s: any) => (s.fase || "").toLowerCase());
    const hasInicio = fases.some((f: string) => f === "inicio");
    const hasCierre = fases.some((f: string) => f === "cierre");
    if (!hasInicio || !hasCierre) {
      const missing = [];
      if (!hasInicio) missing.push("Inicio");
      if (!hasCierre) missing.push("Cierre");
      results.push({
        ruleId: "MISSING_FASE_START_END",
        level: "warning",
        scope: "UA",
        id: uaId,
        message: \`Se recomienda incluir al menos una SdA de fase: \${missing.join(" y ")}.\`
      });
    }
  }

  return results;
}

// ============================================
// SdA-LEVEL RULES
// ============================================

const INFINITIVO_REGEX = /^(identificar|justificar|analizar|aplicar|describir|clasificar|calcular|proponer|evaluar|elaborar|formular|comparar|dirigir|diferenciar|argumentar|valorar|resolver|diseñar|redactar|interpretar|definir|enumerar|reconocer|explicar|participar|colaborar|comunicar|demostrar|seleccionar|utilizar|ejecutar|comprobar|verificar|manejar|operar|estimar|plantear|determinar|confeccionar)/i;

const AGRUPAMIENTO_REGEX = /(individual(mente)?|parejas|pequeños? grupos?|grupos? (de )?\d+-?\d*|gran grupo)/i;

function checkSdaLevelRules(sda: any): ValidationIssue[] {
  const results: ValidationIssue[] = [];
  const sdaId = \`SdA-\${sda.numero}\`;
  const objetivo = sda.objetivo || "";
  const desarrollo = sda.desarrollo || sda.desarrollo_actividad || "";

  // SDA_STYLE_POOR: objective must start with infinitive verb
  if (objetivo && !INFINITIVO_REGEX.test(objetivo.trim())) {
    results.push({
      ruleId: "SDA_STYLE_POOR",
      level: "warning",
      scope: "SdA",
      id: sdaId,
      message: \`El objetivo de la SdA \${sda.numero} debe empezar por un verbo en infinitivo.\`
    });
  }

  // SDA_STYLE_POOR: desarrollo must mention agrupamiento
  if (desarrollo && !AGRUPAMIENTO_REGEX.test(desarrollo)) {
    results.push({
      ruleId: "SDA_STYLE_POOR",
      level: "warning",
      scope: "SdA",
      id: sdaId,
      message: \`El desarrollo de la SdA \${sda.numero} no menciona explícitamente el agrupamiento del alumnado.\`
    });
  }

  return results;
}
