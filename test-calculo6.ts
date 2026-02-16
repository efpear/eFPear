// Test 6: Simular el flujo exacto del usuario
// Ejecutar con: npx tsx test-calculo6.ts

import { addDays, isWeekend, isSameDay, format } from 'date-fns';

// =====================================================
// SIMULACIÓN DE LA CLASE CalendarEngine
// =====================================================

class CalendarEngine {
  private festivos: Date[];
  private configTurno: any;

  constructor(configTurno: any, festivos: { fecha: Date }[] = []) {
    this.configTurno = { ...configTurno };
    this.festivos = festivos.map(f => f.fecha);
    console.log('[ENGINE] Constructor - configTurno:', this.configTurno);
  }

  setConfigTurno(config: any): void {
    this.configTurno = { ...config };
    console.log('[ENGINE] setConfigTurno:', this.configTurno);
  }

  getHorasPorDia(): number {
    const horas = this.configTurno.esTurno24h ? 24 : 
      (this.configTurno.horaFin - this.configTurno.horaInicio);
    return horas;
  }

  calcularModulosEnSecuencia(
    modulos: { codigo: string; horasTotal: number }[],
    fechaInicio: Date
  ): { fechaFin: Date }[] {
    const horasPorDia = this.getHorasPorDia();
    console.log(`[ENGINE] Calculando con ${horasPorDia}h/día`);
    
    const resultados: { fechaFin: Date }[] = [];
    let fechaActual = new Date(fechaInicio);

    for (const modulo of modulos) {
      let horasRestantes = modulo.horasTotal;

      while (horasRestantes > 0) {
        if (!isWeekend(fechaActual) && !this.festivos.some(f => isSameDay(f, fechaActual))) {
          horasRestantes -= horasPorDia;
        }
        fechaActual = addDays(fechaActual, 1);
      }

      const fechaFin = addDays(fechaActual, -1);
      resultados.push({ fechaFin });
      console.log(`[ENGINE] Módulo ${modulo.codigo} termina: ${format(fechaFin, 'yyyy-MM-dd')}`);
    }

    return resultados;
  }
}

// =====================================================
// SIMULACIÓN DEL FLUJO DEL USUARIO
// =====================================================

const CONFIG_DEFECTO = { horaInicio: 8, horaFin: 15, permitirFinde: false, permitirFestivos: false, esTurno24h: false };
const CONFIG_USUARIO = { horaInicio: 16, horaFin: 21, permitirFinde: false, permitirFestivos: false, esTurno24h: false };

const modulos = [
  { codigo: 'MF1330_1', horasTotal: 30 },
  { codigo: 'MF1331_1', horasTotal: 60 },
  { codigo: 'MF1332_1', horasTotal: 30 },
];

const festivos = [{ fecha: new Date(2026, 7, 15) }];
const fechaInicio = new Date(2026, 6, 21);

console.log('=== ESCENARIO A: Usuario configura ANTES de cargar módulos ===\n');

// 1. Motor se crea con config por defecto
let motorA = new CalendarEngine(CONFIG_DEFECTO, festivos);

// 2. Usuario cambia configuración (useEffect #3)
motorA.setConfigTurno(CONFIG_USUARIO);

// 3. Usuario carga módulos (se calcula con config actualizada)
console.log('\nCalculando módulos:');
const resultadoA = motorA.calcularModulosEnSecuencia(modulos, fechaInicio);
console.log(`\nFecha final A: ${format(resultadoA[resultadoA.length - 1].fechaFin, 'yyyy-MM-dd (EEEE)')}`);

console.log('\n=== ESCENARIO B: Usuario carga módulos ANTES de configurar ===\n');

// 1. Motor se crea con config por defecto
let motorB = new CalendarEngine(CONFIG_DEFECTO, festivos);

// 2. Usuario carga módulos (se calcula con config por defecto)
console.log('\nCalculando módulos:');
const resultadoB = motorB.calcularModulosEnSecuencia(modulos, fechaInicio);
console.log(`\nFecha final B (incorrecta): ${format(resultadoB[resultadoB.length - 1].fechaFin, 'yyyy-MM-dd (EEEE)')}`);

// 3. Usuario cambia configuración (useEffect #3)
motorB.setConfigTurno(CONFIG_USUARIO);

// 4. useEffect #4 recalcula
console.log('\nRecalculando:');
const resultadoB_recalc = motorB.calcularModulosEnSecuencia(modulos, fechaInicio);
console.log(`\nFecha final B (recalculada): ${format(resultadoB_recalc[resultadoB_recalc.length - 1].fechaFin, 'yyyy-MM-dd (EEEE)')}`);

console.log('\n=== CONCLUSIÓN ===');
console.log('El problema está en que el motor usa la configuración ACTUAL al momento de calcular.');
console.log('Si el usuario carga módulos ANTES de cambiar la configuración, se usa la config por defecto.');
console.log('La solución es recalcular automáticamente cuando la configuración cambie.');
