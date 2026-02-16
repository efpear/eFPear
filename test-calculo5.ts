// Test 5: Verificar comportamiento de findes y festivos
// Ejecutar con: npx tsx test-calculo5.ts

import { isWeekend, format, addDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

console.log('=== VERIFICACIÓN DE FINES DE SEMANA ===\n');

// Verificar que isWeekend funciona correctamente
const fechas = [
  new Date(2026, 7, 10), // Lunes 10/08/2026
  new Date(2026, 7, 11), // Martes 11/08/2026
  new Date(2026, 7, 14), // Viernes 14/08/2026
  new Date(2026, 7, 15), // Sábado 15/08/2026
  new Date(2026, 7, 16), // Domingo 16/08/2026
  new Date(2026, 7, 17), // Lunes 17/08/2026
];

for (const f of fechas) {
  const dia = getDay(f); // 0 = Domingo, 6 = Sábado
  console.log(`${format(f, 'yyyy-MM-dd (EEEE)', { locale: es })} - getDay: ${dia}, isWeekend: ${isWeekend(f)}`);
}

console.log('\n=== VERIFICACIÓN DEL 15/08/2026 ===');
const asuncion = new Date(2026, 7, 15);
console.log(`15/08/2026 (Asunción): ${format(asuncion, 'EEEE', { locale: es })}`);
console.log(`¿Es finde? ${isWeekend(asuncion)}`);
console.log('El 15 de agosto 2026 es SÁBADO, así que el festivo no afecta (ya es finde)');

console.log('\n=== CÁLCULO DE DÍAS LABORABLES DESDE 21/07 HASTA 11/08 ===');

let fechaActual = new Date(2026, 6, 21); // 21/07/2026
const fechaFin = new Date(2026, 7, 11);  // 11/08/2026
let diasLaborables = 0;
let diasFinde = 0;

while (fechaActual <= fechaFin) {
  if (isWeekend(fechaActual)) {
    diasFinde++;
  } else {
    diasLaborables++;
  }
  fechaActual = addDays(fechaActual, 1);
}

console.log(`Días laborables: ${diasLaborables}`);
console.log(`Días de finde: ${diasFinde}`);
console.log(`Total días: ${diasLaborables + diasFinde}`);

console.log('\n=== CÁLCULO DE HORAS CON DIFERENTES CONFIGURACIONES ===');
console.log(`Con 5h/día: ${diasLaborables} días × 5h = ${diasLaborables * 5}h`);
console.log(`Con 7h/día: ${diasLaborables} días × 7h = ${diasLaborables * 7}h`);

console.log('\n=== SI EL MOTOR DA 11/08, SIGNIFICA QUE: ===');
console.log(`- Se necesitan 120h / 5h = 24 días de clase`);
console.log(`- Pero del 21/07 al 11/08 solo hay ${diasLaborables} días laborables`);
console.log(`- Eso equivale a ${diasLaborables * 5}h, no 120h`);
console.log('Algo está mal en el cálculo...');

console.log('\n=== POSIBLE CAUSA: El motor está usando más horas por día ===');
const horasNecesarias = 120;
const diasAl11Ago = 16; // Aproximadamente
const horasPorDiaReales = horasNecesarias / diasAl11Ago;
console.log(`Si 120h caben en ~16 días laborables, las horas/día serían: ${horasPorDiaReales.toFixed(1)}h`);
console.log('Esto sugiere que el motor está usando ~7.5h/día en lugar de 5h/día');
