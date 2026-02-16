// =====================================================
// INFORME DE ANÁLISIS DEL BUG EN eFPear CertiCalc
// =====================================================

/**
 * PROBLEMA: El motor de cálculo da fecha final incorrecta (11/08 en lugar de 21/08)
 * 
 * DATOS DEL USUARIO:
 * - 3 módulos: MF1330_1 (30h), MF1331_1 (60h), MF1332_1 (30h) = 120h total
 * - Horario: 16:00-21:00 (5h/día)
 * - Inicio: 21/07/2026 (martes)
 * - permitirFinde: false (solo lunes a viernes)
 * - Festivo: 15/08/2026 (Asunción) - cae en SÁBADO
 * 
 * RESULTADO ESPERADO: 21/08/2026 (viernes)
 * RESULTADO ACTUAL: 11/08/2026 (incorrecto)
 * 
 * ANÁLISIS:
 * =========
 * 
 * 1. CÁLCULO CORRECTO (con 5h/día):
 *    - 120h / 5h = 24 días de clase
 *    - 24 días laborables desde 21/07 = 21/08/2026 ✅
 * 
 * 2. CÁLCULO CON CONFIG POR DEFECTO (7h/día):
 *    - 120h / 7h = ~18 días de clase
 *    - 18 días laborables desde 21/07 = ~14/08/2026 ✗
 * 
 * 3. CÁLCULO QUE COINCIDE CON EL ERROR (11/08):
 *    - Del 21/07 al 11/08 hay 16 días laborables
 *    - 120h / 16 días = ~7.5h/día
 *    - Esto sugiere que se está usando ~7-8h/día
 * 
 * CAUSA RAÍZ:
 * ===========
 * 
 * El motor está usando la configuración por defecto (7h/día) en lugar de
 * la configuración del usuario (5h/día).
 * 
 * POSIBLES CAUSAS:
 * 
 * A) Flujo incorrecto de useEffects en page.tsx:
 *    - El useEffect de inicialización crea el motor con configTurno por defecto
 *    - El usuario carga módulos ANTES de cambiar la configuración
 *    - El cálculo se hace con 7h/día
 * 
 * B) Race condition:
 *    - El recálculo no se ejecuta después de cambiar la configuración
 *    - O se ejecuta antes de que el motor se actualice
 * 
 * C) Problema en el useCallback de recalcular:
 *    - No tiene configTurno en las dependencias
 *    - Puede usar valores stale
 * 
 * SOLUCIÓN:
 * =========
 * 
 * Ver archivo: fix-calculo.md
 */

console.log('Análisis completado. Ver informe arriba.');
