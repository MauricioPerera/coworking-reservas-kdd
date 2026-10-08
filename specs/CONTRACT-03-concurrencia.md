# CONTRACT-03 — Reservas compartidas y concurrencia

## Criterios de aceptación

- [ ] [AC-1] Confirmar exactamente una reserva ante solicitudes simultáneas idénticas o solapadas con `npm run test:shared`.
- [ ] [AC-2] Conservar escrituras concurrentes válidas, IDs únicos, intervalos adyacentes y salas/fechas distintas con npm run test:shared-api.
- [ ] [AC-3] Sincronizar dos agendas sin recarga en 5000 ms en el entorno declarado y rechazar snapshots atrasados con npm run test:shared-ui.
- [ ] [AC-4] Cancelar solo el objetivo, conservar historial, comunicar repetición y liberar el intervalo con npm run test:shared.
- [ ] [AC-5] Persistir después de reiniciar realmente el servidor y fallar sin falsa confirmación ante errores de escritura con npm run test:shared.
- [ ] [AC-6] Mantener español, inglés y portugués, borradores, filtros, datos locales y layout móvil con npm run test:shared-ui.
- [ ] [AC-7] Conservar los oráculos históricos y sus regresiones con los checks declarados, validate:kdd y probe:board.
- [ ] [AC-8] Demostrar detección de un defecto deliberado de concurrencia y registrar su alcance local o CI.
- [ ] [AC-9] Medir arquitectura, código, almacenamiento, cobertura, sincronización y coste de validación en docs/CONCURRENCY-IMPACT.md.
- [ ] [CI-1] Revisar explícitamente el SHA nuevo, pasar gate y CI Ubuntu/Windows y cerrar contra un run previo autenticado.

## Restricciones

Tocar SOLO example/server.mjs, example/client.mjs, example/index.html,
example/shared-api.mjs, example/shared-store.mjs y example/shared-client.mjs
para implementar, y las rutas PM exactas declaradas para este contrato.
Modelo, persistencia local, oráculos y cierres históricos conservan sus bytes.
Los controles nuevos se sellan antes de implementar para una nueva revisión
humana explícita; ninguna aprobación anterior se transfiere al nuevo SHA.
Después del CI solo se permite cerrar este spec y sus dos archivos de reporte.
- ABORTAR SI se necesita debilitar tests, migrar datos locales sin solicitud,
  inventar aprobación o atribuir a CI resultados obtenidos únicamente de forma local.

## Alcance

Dos sesiones aisladas y un backend en loopback, con SQLite en archivo y revisión
monótona. API JSON bajo /api/bookings y modo compartido bajo /compartidas.
El modo /reservas conserva almacenamiento local v1. No se incluyen autenticación
real, exposición pública, carga masiva ni coordinación entre varios servidores.
La agenda conserva fechas ISO y HH:mm; el locale es una preferencia del navegador.
