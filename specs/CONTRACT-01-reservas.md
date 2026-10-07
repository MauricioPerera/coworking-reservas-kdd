# CONTRACT-01 - Reservas de salas

## Criterios de aceptación

- [ ] [AC-1] Crear una reserva válida y mostrar sus datos con `npm run test:ui`.
- [ ] [AC-2] Rechazar fin anterior o igual al inicio con `npm run test:functional` y `npm run test:ui`.
- [ ] [AC-3] Rechazar reservas solapadas de una misma sala y fecha con `npm run test:functional` y `npm run test:ui`.
- [ ] [AC-4] Permitir intervalos contiguos con `npm run test:functional` y `npm run test:ui`.
- [ ] [AC-5] Mantener disponibilidad independiente por sala y fecha con `npm run test:functional` y `npm run test:ui`.
- [ ] [AC-6] Cancelar la reserva solicitada y liberar su horario con `npm run test:functional` y `npm run test:ui`.
- [ ] [AC-7] Conservar reservas al recargar y reiniciar el navegador con `npm run test:ui`.
- [ ] [AC-8] Detectar los cinco defectos deliberados y rechazar evidencia manipulada con `npm run test:adversarial`.
- [ ] [AC-9] Validar contratos y comprobar el oráculo y hashes de Board con `npm run validate:kdd` y `npm run probe:board`.
- [ ] [CI-1] Verificar el baseline explícitamente aprobado y sus controles en Ubuntu y Windows con `npm run verify:quality`, y cerrar contra un run previo autenticado.

## Restricciones

Tocar SOLO las cinco rutas de implementación y las rutas PM exactas de quality.json.
El bootstrap prepara controles nuevos para revisión humana; no concede aprobación.
Después del CI solo se permite cerrar este spec y sus dos rutas de reporte y evidencia.
- ABORTAR SI los oráculos requieren alterarse para aceptar un resultado, falta
  aprobación humana explícita del baseline o el entorno produce evidencia inconclusa.

## Alcance

Aplicación local, dos salas, reservas de un día con horas HH:mm y fechas ISO válidas.
Intervalos semiabiertos: 10:00-11:00 y 11:00-12:00 son compatibles. La cancelación
conserva el historial. Datos guardados en el navegador; no hay sincronización entre
usuarios, servicios externos, autenticación real ni pagos. Los siete casos UI usan
datos de fecha fijos y sesiones independientes; no dependen del reloj del equipo.
