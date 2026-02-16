// Test 4: Verificar flujo completo de inicialización
// Ejecutar con: npx tsx test-calculo4.ts

import { addDays, isWeekend, isSameDay, format } from 'date-fns';

// =====================================================
// SIMULACIÓN DE LA CLASE CalendarEngine
// =====================================================

class CalendarEngine {
  private festivos: Date[];
  private configTurno: {
    horaInicio: number;
    horaFin: number;
    permitirFinde: boolean;
    permitirFestivos: boolean;
    esTurno24h: boolean;
  };

  constructor(
    private año: number,
    configTurno: any,
    festivosPersonalizados?: { fecha: Date; nombre: string }[]
  ) {
    this.configTurno = { ...configTurno };
    this.festivos = festivosPersonalizados?.map(f => f.fecha) || [];
  }

  setFestivos(festivos: { fecha: Date; nombre: string }[]): void {
    this.festivos = festivos.map(f => f.fecha);
  }

  setConfigTurno(config: any): void {
    this.configTurno = { ...config };
    console.log('  [ENGINE] Config actualizada:', this.configTurno);
  }

  getConfigTurno() {
    return this.configTurno;
  }

  generarSesiones(modulo: { id: string; codigo: string; horasTotal: number }, fechaInicio: Date) {
    const sesiones: { fecha: Date; horas: number }[] = [];
    
    const horasPorDia = this.configTurno.esTurno24h ? 24 : 
      (this.configTurno.horaFin - this.configTurno.horaInicio);
    
    console.log(`  [ENGINE] Horas por día: ${horasPorDia} (inicio: ${this.configTurno.horaInicio}, fin: ${this.configTurno.horaFin})`);
    
    let horasRestantes = modulo.horasTotal;
    let fechaActual = new Date(fechaInicio);

    while (horasRestantes > 0) {
      const esDiaFinde = isWeekend(fechaActual);
      const esDiaFestivo = this.festivos.some(f => isSameDay(f, fechaActual));
      
      if (esDiaFinde && !this.configTurno.permitirFinde) {
        fechaActual = addDays(fechaActual, 1);
        continue;
      }
      
      if (esDiaFestivo && !this.configTurno.permitirFestivos) {
        fechaActual = addDays(fechaActual, 1);
        continue;
      }
      
      const horasSesion = Math.min(horasPorDia, horasRestantes);
      sesiones.push({ fecha: new Date(fechaActual), horas: horasSesion });
      
      horasRestantes -= horasSesion;
      fechaActual = addDays(fechaActual, 1);
    }
    
    return sesiones;
  }

  calcularModulo(modulo: { id: string; codigo: string; horasTotal: number }, fechaInicio: Date) {
    const sesiones = this.generarSesiones(modulo, fechaInicio);
    const fechaFin = sesiones.length > 0 ? sesiones[sesiones.length - 1].fecha : fechaInicio;
    return { ...modulo, sesiones, fechaInicio, fechaFin };
  }

  calcularModulosEnSecuencia(
    modulos: { id: string; codigo: string; horasTotal: number }[],
    fechaInicioGlobal: Date
  ) {
    const modulosCalculados: any[] = [];
    let fechaActual = new Date(fechaInicioGlobal);

    for (const modulo of modulos) {
      console.log(`\n[ENGINE] Calculando módulo ${modulo.codigo} desde ${format(fechaActual, 'yyyy-MM-dd')}`);
      const moduloCalculado = this.calcularModulo(modulo, fechaActual);
      modulosCalculados.push(moduloCalculado);
      fechaActual = addDays(moduloCalculado.fechaFin, 1);
    }

    return modulosCalculados;
  }
}

function crearMotor(año: number, configTurno: any, festivos: any[]) {
  return new CalendarEngine(año, configTurno, festivos);
}

// =====================================================
// SIMULACIÓN DEL FLUJO DE page.tsx
// =====================================================

const CONFIGURACION_TURNO_DEFECTO = {
  horaInicio: 8,
  horaFin: 15,
  diasConsecutivos: 5,
  esTurno24h: false,
  permitirFinde: false,
  permitirFestivos: false,
};

console.log('=== SIMULACIÓN DEL FLUJO DE LA APLICACIÓN ===\n');

// Estado inicial
let configTurno = { ...CONFIGURACION_TURNO_DEFECTO };
let motor: CalendarEngine | null = null;
let modulosMF: any[] = [];
let fechaInicio = '2026-07-21';

const modulosBase = [
  { id: '1', codigo: 'MF1330_1', horasTotal: 30 },
  { id: '2', codigo: 'MF1331_1', horasTotal: 60 },
  { id: '3', codigo: 'MF1332_1', horasTotal: 30 },
];

const festivosActuales = [
  { fecha: new Date(2026, 7, 15), nombre: 'Asunción' }
];

// 1. useEffect de inicialización (solo se ejecuta una vez)
console.log('1. useEffect de inicialización:');
const año = new Date(fechaInicio).getFullYear();
motor = crearMotor(año, configTurno, festivosActuales);
console.log('   Motor creado con configTurno:', motor.getConfigTurno());

// 2. Usuario carga ejemplo ANTES de cambiar la configuración
console.log('\n2. Usuario carga los módulos (sin cambiar configuración):');
const fechaInicioDate = new Date(fechaInicio + 'T00:00:00');
modulosMF = motor.calcularModulosEnSecuencia(modulosBase, fechaInicioDate);

console.log('\n=== RESULTADO CON CONFIGURACIÓN POR DEFECTO (8-15h = 7h/día) ===');
const fechaFinDefault = modulosMF[modulosMF.length - 1].fechaFin;
console.log(`Fecha final: ${format(fechaFinDefault, 'yyyy-MM-dd (EEEE)')}`);

// 3. Usuario cambia la configuración
console.log('\n3. Usuario cambia configuración a 16-21h:');
configTurno = { ...configTurno, horaInicio: 16, horaFin: 21 };
console.log('   Nueva configTurno:', configTurno);

// 4. useEffect de actualización de config (simulado)
console.log('\n4. useEffect de actualización de config:');
if (motor) {
  motor.setConfigTurno(configTurno);
}

// 5. useEffect de recálculo (simulado)
console.log('\n5. useEffect de recálculo:');
if (motor && modulosMF.length > 0) {
  modulosMF = motor.calcularModulosEnSecuencia(modulosBase, fechaInicioDate);
}

console.log('\n=== RESULTADO DESPUÉS DE CAMBIAR CONFIGURACIÓN (16-21h = 5h/día) ===');
const fechaFinCorrecta = modulosMF[modulosMF.length - 1].fechaFin;
console.log(`Fecha final: ${format(fechaFinCorrecta, 'yyyy-MM-dd (EEEE)')}`);

console.log('\n=== CONCLUSIÓN ===');
console.log('La fecha correcta es 2026-08-21 (viernes)');
console.log(`Fecha con config por defecto: ${format(fechaFinDefault, 'yyyy-MM-dd')}`);
console.log(`Fecha con config correcta: ${format(fechaFinCorrecta, 'yyyy-MM-dd')}`);
