# Reservas de salas — coworking-reservas-kdd

Prueba completa de contratos, oráculos y evidencia con kdd-e2e-acceptance.
Aplicación local para reservar Sala Atlas y Sala Luna, cancelar reservas y
conservarlas al recargar. Intervalos contiguos permitidos; solapamientos rechazados.

La interfaz ofrece Español, English y Português mediante el selector del
encabezado. Usa es-MX, en-US y pt-BR, con español por defecto. El idioma se
conserva al recargar y cambiarlo mantiene los datos, títulos, borrador y filtros.
Las fechas de la agenda siguen el formato elegido; los controles nativos de
fecha y hora usan las convenciones del navegador o sistema.

## Preparación y uso

Node 24.8 o posterior, Python 3.10 o posterior y Git. CI fija Node 24.16.0.

```text
npm ci --ignore-scripts --no-audit --no-fund
npm run setup:kdd
npm run install:browser
npm start
```

Abrir http://127.0.0.1:4272/reservas. Los datos pertenecen a ese navegador y origen.
En Linux instalar también Chromium con sus dependencias de host:
`node node_modules/playwright-core/cli.js install --with-deps chromium`.

## Comprobaciones

```text
npm run test:functional
npm run test:adversarial
npm run test:ui
npm run test:i18n
npm run validate:kdd
npm run probe:board
```

El árbol tracked debe estar limpio y los cambios guardados en un commit antes
de recopilar evidencia UI. Cada caso usa una sesión nueva; no hay reintentos,
juicio LLM ni servicios externos. Siete casos internos corresponden a un test
Node externo de Board. Los reportes, hashes y traces quedan en .e2e/runs/UUID.

## Revisión y cierre

Este bootstrap prepara una nueva referencia para revisión humana. Ningún hash,
commit o test local concede aprobación. Seguir docs/REVIEW.md y suministrar el
SHA completo revisado mediante KDD_QUALITY_APPROVED_REF desde fuera del código.
La política protege los controles, autoriza solo cinco rutas de producción y
ejecuta todos los checks dos veces. El spec permanece abierto hasta CI real en
Ubuntu y Windows y cierre posterior que autentique un run exitoso anterior.

La extensión de idiomas agrega un contrato y 34 comprobaciones de navegador
(21 flujos de reservas y 13 checks adicionales). Sus controles nuevos requieren
un baseline revisado explícitamente. Ver [el impacto medido](docs/I18N-IMPACT.md)
y [los criterios de idiomas](specs/CONTRACT-02-idiomas.md); la evidencia y el
cierre de CONTRACT-01 conservan su SHA histórico.

## Alcance

### Candidato de reservas compartidas

`/compartidas` añade una agenda común entre sesiones independientes, con reservas
atómicas, sincronización automática y persistencia en un archivo SQLite del servidor.
`/reservas` conserva el modo local; sus datos no se importan al servicio compartido.
Ambos modos mantienen español, inglés y portugués. La versión comprobada usa
Node 24.16.0 y su módulo SQLite incorporado, sin dependencias nuevas.

Se ejecuta con el mismo `npm start`. `SHARED_DB_PATH` permite elegir la base;
la ubicación por defecto es `.e2e/shared-data/bookings.sqlite` y debe conservarse
si se limpian artefactos. El servidor se limita a loopback. Este prototipo no
incluye autenticación de producción ni coordinación entre varios servidores.

Los 15 checks de API y los 15 de navegador se ejecutan con `npm run test:shared`.
Ver [objetivo](docs/OBJECTIVE.md), [criterios](specs/CONTRACT-03-concurrencia.md)
y [mediciones](docs/CONCURRENCY-IMPACT.md). Los controles nuevos están pendientes
de revisión humana del SHA y de CI; los cierres anteriores conservan su evidencia.

### Modo local comprobado

Reservas locales de un día, horas HH:mm y fechas de calendario válidas.
La cancelación conserva historial; datos corruptos o fallos de almacenamiento
se muestran sin sustituir silenciosamente los datos originales. No hay servidor
de reservas compartido, autenticación, sincronización entre usuarios ni pagos.
Los horarios son horas locales de la agenda y no se convierten entre zonas.

El perfil de Board tiene límite de 30 segundos; el hijo dispone de 24.
Los cinco mutantes comprueban la fuerza observada de los oráculos. Un anchor
incompatible es inconcluso y falla; no equivale a un defecto detectado.
El runner, Git, Node y dependencias instaladas son parte de la base de confianza.
Ver docs/PROVENANCE.md, LICENSE y NOTICE para la integración reutilizada.
