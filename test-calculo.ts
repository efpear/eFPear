// Test de cálculo del motor
// Ejecutar con: npx tsx test-calculo.ts

import { addDays, isWeekend, isSameDay, format } from 'date-fns';

// Datos del usuario
const modulos = [
  { id: '1', codigo: 'MF1330_1', horasTotal: 30 },
  { id: '2', codigo: 'MF1331_1', horasTotal: 60 },
  { id: '3', codigo: 'MF1332_1', horasTotal: 30 },
];

const configTurno = {
  horaInicio: 16,
  horaFin: 21,
  permitirFinde: false,
  permitirFestivos: false,
};

// Festivo 15/08/2026 (Asunción)
const festivos = [new Date(2026, 7, 15)]; // Mes 7 = Agosto (0-indexed)

// Fecha inicio: 21/07/2026 (martes)
const fechaInicio = new Date(2026, 6, 21); // Mes 6 = Julio (0-indexed)

console.log('=== DATOS DE ENTRADA ===');
console.log('Total horas:', modulos.reduce((acc, m) => acc + m.horasTotal, 0));
console.log('Horas por día:', configTurno.horaFin - configTurno.horaInicio);
console.log('Fecha inicio:', format(fechaInicio, 'yyyy-MM-dd (EEEE)'));
console.log('Permitir finde:', configTurno.permitirFinde);
console.log('Permitir festivos:', configTurno.permitirFestivos);
console.log('Festivos:', festivos.map(f => format(f, 'yyyy-MM-dd')));
console.log('');

function esFinde(fecha: Date): boolean {
  return isWeekend(fecha);
}

function esFestivo(fecha: Date, festivos: Date[]): boolean {
  return festivos.some(f => isSameDay(f, fecha));
}

function generarSesionesPasoAPaso(
  modulos: { id: string; codigo: string; horasTotal: number }[],
  fechaInicioGlobal: Date,
  horasPorDia: number,
  permitirFinde: boolean,
  permitirFestivos: boolean,
  festivos: Date[]
) {
  let fechaActual = new Date(fechaInicioGlobal);
  let sesionGlobal = 1;

  for (const modulo of modulos) {
    console.log(`\n=== MÓDULO ${modulo.codigo} (${modulo.horasTotal}h) ===`);
    
    let horasRestantes = modulo.horasTotal;
    let sesionesModulo = 0;

    while (horasRestantes > 0) {
      const esDiaFinde = esFinde(fechaActual);
      const esDiaFestivo = esFestivo(fechaActual, festivos);
      const diaSemana = format(fechaActual, 'EEEE');
      
      console.log(`  Día ${sesionGlobal}: ${format(fechaActual, 'yyyy-MM-dd')} (${diaSemana}) - Finde: ${esDiaFinde}, Festivo: ${esDiaFestivo}`);
      
      if (esDiaFinde && !permitirFinde) {
        console.log(`    ❌ SALTANDO: es finde y no permitido`);
        fechaActual = addDays(fechaActual, 1);
        continue;
      }
      
      if (esDiaFestivo && !permitirFestivos) {
        console.log(`    ❌ SALTANDO: es festivo y no permitido`);
        fechaActual = addDays(fechaActual, 1);
        continue;
      }
      
      const horasSesion = Math.min(horasPorDia, horasRestantes);
      console.log(`    ✅ SESIÓN: ${horasSesion}h (restantes: ${horasRestantes}h)`);
      
      horasRestantes -= horasSesion;
      sesionesModulo++;
      sesionGlobal++;
      fechaActual = addDays(fechaActual, 1);
    }
    
    console.log(`  -> Módulo terminado con ${sesionesModulo} sesiones`);
  }
  
  // La fecha final es el último día de sesión
  // Pero la fecha se incrementó al final, así que restamos 1 día
  const fechaFinal = addDays(fechaActual, -1);
  console.log(`\n=== RESULTADO ===`);
  console.log(`Fecha final calculada: ${format(fechaFinal, 'yyyy-MM-dd (EEEE)')}`);
  console.log(`Fecha esperada correcta: 21/08/2026 (jueves)`);
  
  return fechaFinal;
}

// Ejecutar simulación
generarSesionesPasoAPaso(
  modulos,
  fechaInicio,
  configTurno.horaFin - configTurno.horaInicio,
  configTurno.permitirFinde,
  configTurno.permitirFestivos,
  festivos
);

// Verificar festivo del 15/08/2026
console.log('\n=== VERIFICACIÓN DE FECHAS ===');
const agosto15 = new Date(2026, 7, 15);
console.log(`15/08/2026 es: ${format(agosto15, 'EEEE')}`); // Debería ser sábado
console.log(`¿Es finde? ${isWeekend(agosto15)}`);
