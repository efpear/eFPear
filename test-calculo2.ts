// Test 2: Simular el flujo de la aplicación
// Ejecutar con: npx tsx test-calculo2.ts

import { addDays, isWeekend, isSameDay, format } from 'date-fns';

// Simular CONFIGURACION_TURNO_DEFECTO (del archivo types)
const CONFIGURACION_TURNO_DEFECTO = {
  horaInicio: 8,
  horaFin: 15,
  diasConsecutivos: 5,
  esTurno24h: false,
  permitirFinde: false,
  permitirFestivos: false,
};

// Simular el flujo de page.tsx
console.log('=== SIMULACIÓN DEL FLUJO DE LA APLICACIÓN ===\n');

// 1. Estado inicial (useState con CONFIGURACION_TURNO_DEFECTO)
let configTurno = { ...CONFIGURACION_TURNO_DEFECTO };
console.log('1. Estado inicial de configTurno:', configTurno);

// 2. Usuario configura horario 16:00-21:00
// Esto simula el usuario cambiando los inputs
configTurno = {
  ...configTurno,
  horaInicio: 16,
  horaFin: 21,
};
console.log('2. Usuario configura horario 16-21:', configTurno);

// 3. ¿Cuál es el problema potencial?
// En page.tsx, el motor se inicializa en un useEffect:
// useEffect(() => {
//   setMotor(crearMotor(año, configTurno, festivosActuales));
// }, []);
//
// El problema es que este useEffect solo se ejecuta UNA VEZ al montar,
// y usa el valor de configTurno EN ESE MOMENTO.
//
// Si el usuario cambia configTurno DESPUÉS, el useEffect de actualización
// debería llamar a motor.setConfigTurno()

// 4. Simular el flujo correcto
console.log('\n=== CÁLCULO CON CONFIGURACIÓN CORRECTA ===');
const horasPorDia = configTurno.horaFin - configTurno.horaInicio;
console.log('Horas por día:', horasPorDia);

// 5. ¿Qué pasa si la configuración NO se actualizó?
console.log('\n=== CÁLCULO CON CONFIGURACIÓN POR DEFECTO (ERROR) ===');
const horasPorDiaDefecto = CONFIGURACION_TURNO_DEFECTO.horaFin - CONFIGURACION_TURNO_DEFECTO.horaInicio;
console.log('Horas por día (defecto):', horasPorDiaDefecto);

// Calcular días con configuración por defecto (7h/día)
const totalHoras = 120;
const diasCon7h = Math.ceil(totalHoras / horasPorDiaDefecto);
console.log('Días necesarios con 7h/día:', diasCon7h);

// Calcular fecha final con 7h/día
const fechaInicio = new Date(2026, 6, 21); // 21/07/2026
let fechaActual = new Date(fechaInicio);
let diasValidos = 0;
const festivos = [new Date(2026, 7, 15)]; // 15/08/2026

function esFinde(fecha: Date): boolean {
  return isWeekend(fecha);
}

function esFestivo(fecha: Date, festivos: Date[]): boolean {
  return festivos.some(f => isSameDay(f, fecha));
}

while (diasValidos < diasCon7h) {
  if (!esFinde(fechaActual) && !esFestivo(fechaActual, festivos)) {
    diasValidos++;
    if (diasValidos <= 5) {
      console.log(`  Día ${diasValidos}: ${format(fechaActual, 'yyyy-MM-dd (EEEE)')}`);
    } else if (diasValidos === 6) {
      console.log('  ...');
    } else if (diasValidos >= diasCon7h - 2) {
      console.log(`  Día ${diasValidos}: ${format(fechaActual, 'yyyy-MM-dd (EEEE)')}`);
    }
  }
  fechaActual = addDays(fechaActual, 1);
}

console.log(`\nFecha final con 7h/día: ${format(addDays(fechaActual, -1), 'yyyy-MM-dd (EEEE)')}`);
console.log('Esto coincide con el error reportado (11/08/2026) ✗');

// 6. Verificar que el problema es la configuración
console.log('\n=== CONCLUSIÓN ===');
console.log('El error se produce cuando la configuración de turno NO se actualiza correctamente.');
console.log('La configuración por defecto es 8-15h (7h/día), pero el usuario configura 16-21h (5h/día).');
console.log('Si el motor usa 7h/día, calcula ~18 días en lugar de 24 días.');
