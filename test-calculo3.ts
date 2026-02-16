// Test 3: Verificar el flujo de useEffects en React
// Ejecutar con: npx tsx test-calculo3.ts

console.log('=== ANÁLISIS DEL FLUJO DE USEEFFECTS EN page.tsx ===\n');

console.log('PROBLEMA IDENTIFICADO:');
console.log('======================\n');

console.log('1. Estado inicial:');
console.log('   const [configTurno, setConfigTurno] = useState(CONFIGURACION_TURNO_DEFECTO);');
console.log('  -> configTurno = { horaInicio: 8, horaFin: 15, ... } (7h/día)\n');

console.log('1. useEffect de inicialización:');
console.log('   useEffect(() => {');
console.log('     setMotor(crearMotor(año, configTurno, festivosActuales));');
console.log('   }, []);');
console.log('  -> El motor se crea con configTurno = 7h/día\n');

console.log('2. useEffect de actualización de config:');
console.log('   useEffect(() => {');
console.log('     if (motor) {');
console.log('       motor.setConfigTurno(configTurno);');
console.log('     }');
console.log('   }, [motor, configTurno]);');
console.log('  -> SI motor existe Y configTurno cambió, se actualiza');
console.log('  -> PERO: configTurno NO ha cambiado aún (usuario no ha tocado nada)\n');

console.log('3. Usuario carga PDF/ejemplo:');
console.log('   calcularModulos(modulosBase) se ejecuta');
console.log('  -> El motor usa configTurno = 7h/día');
console.log('  -> Cálculo INCORRECTO\n');

console.log('4. Usuario cambia horario a 16-21h:');
console.log('   setConfigTurno(p => ({ ...p, horaInicio: 16, horaFin: 21 }))');
console.log('  -> useEffect de actualización se ejecuta');
console.log('  -> motor.setConfigTurno(nuevaConfig)');
console.log('  -> useEffect de recálculo se ejecuta');
console.log('  -> Cálculo CORRECTO (si todo funciona bien)\n');

console.log('=== POSIBLES CAUSAS DEL ERROR ===\n');

console.log('A) El usuario no cambió la configuración de horario antes de ver el resultado');
console.log('   - El cálculo se hace con 7h/día en lugar de 5h/día\n');

console.log('B) El recálculo no se ejecuta después de cambiar la configuración');
console.log('   - Problema con las dependencias del useEffect\n');

console.log('C) Race condition entre los useEffects');
console.log('   - El cálculo se ejecuta antes de que se actualice el motor\n');

console.log('=== VERIFICACIÓN ===\n');

// Simular el problema
console.log('Si el usuario INTRODUCE los datos con horario 16-21h,');
console.log('pero NO cambia el configTurno ANTES de cargar los módulos,');
console.log('el cálculo se hace con 7h/día.\n');

console.log('SOLUCIÓN: La configuración de turno debería aplicarse ANTES de calcular.');
console.log('Alternativamente, el motor debería recalcular automáticamente cuando cambie la configuración.\n');

// Verificar si el useEffect de recálculo tiene todas las dependencias necesarias
console.log('=== ANÁLISIS DEL useEffect DE RECÁLCULO ===\n');
console.log('useEffect(() => {');
console.log('  if (motor && modulosMF.length > 0 && !isLoadingCertificate.current) {');
console.log('    recalcular();');
console.log('  }');
console.log('}, [configTurno, fechaInicio, motor, festivosActuales]);\n');

console.log('PROBLEMA: recalcular está definido como:');
console.log('const recalcular = useCallback(() => { ... }, [motor, modulosMF, fechaInicio]);');
console.log('Нет configTurno en las dependencias de useCallback!\n');

console.log('Esto significa que recalcular podría no actualizarse cuando configTurno cambia,\naunque el useEffect se dispare.\n');
