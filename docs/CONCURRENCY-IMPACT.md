# Impacto de las reservas compartidas

Fecha: 2026-10-07. Estado: candidato probado localmente, pendiente de revisión
humana del baseline y de CI. Punto de partida: 301ae148d8846f6d7912a665ab9b8095c3617a35.
Implementación comprobada: 8b3e7cc5a8712b0d83d5cfcfa3c3aacf6e074d11.

## Arquitectura y datos

/compartidas usa un backend central en loopback; /reservas conserva su modo
local. El servicio usa SQLite en archivo con una fila de snapshot v1 y una
revisión monótona. BEGIN IMMEDIATE protege lectura, validación, escritura y
COMMIT; las reglas puras existentes se reutilizan sin cambiar sus bytes.
La API anuncia éxito después de COMMIT y revierte errores. JSON inválido,
métodos incorrectos, contenido incompatible y un Origin ajeno se rechazan.

Cada navegador consulta la agenda automáticamente cada 750 ms, aplica solo
revisiones nuevas y conserva borradores y filtros. No se publican ni migran
reservas locales v1. La preferencia de idioma sigue siendo de cada navegador.
La interfaz desactiva confirmaciones si no puede sincronizar y se reconecta
automáticamente. Mantiene español es-MX, inglés en-US y portugués pt-BR.

Node 24.16.0 proporciona node:sqlite, API en estado release candidate.
No hay dependencias nuevas; package-lock.json conserva sus bytes. Los datos
se guardan por defecto en .e2e/shared-data/bookings.sqlite, un directorio ignorado;
SHARED_DB_PATH permite elegir otro archivo. Las pruebas usan bases aisladas
dentro de cada reporte; el modo local no abre SQLite. Una futura limpieza de
.e2e debe preservar la base usada por la aplicación si se usa esa ubicación.

Fuentes: [Node 24.16 SQLite](https://nodejs.org/download/release/v24.16.0/docs/api/sqlite.html)
y [transacciones de SQLite](https://www.sqlite.org/lang_transaction.html).

## Cobertura y perímetro

| Área | Antes | Candidato |
| --- | --- | --- |
| Contratos KDD | 5 | 7 |
| Controles protegidos, incluida la política | 47 | 52 |
| Rutas de producción declaradas | 5 | 8, pendientes de nueva revisión |
| Checks de política | 5 | 7 |
| API compartida | 0 | 15 casos |
| Navegador compartido | 0 | 15 casos |
| Oráculos originales | 35 funcionales, 49 adversariales, 7 UI y 34 idiomas | Los mismos archivos y assertions, PASS |
| Inputs de aceptación original | 19 | 27; incluye los módulos y controles nuevos |
| Dependencias nuevas | 0 | 0 |

El código de producción cambia en seis archivos; el modelo y almacenamiento
local conservan sus bytes. Cada reporte compartido identifica 16 inputs, el
commit, runtime, resultados, trazas y limpieza de procesos. Los archivos que
no existían en la prueba inicial figuran como null; los reportes verdes tienen
todos los inputs presentes y hashes coincidentes con sus blobs Git.

| Archivo | Bytes antes | Bytes después |
| --- | --- | --- |
| example/client.mjs | 12733 | 13689 |
| example/index.html | 9685 | 10361 |
| example/server.mjs | 1036 | 1744 |
| example/shared-api.mjs | 0 | 2154 |
| example/shared-client.mjs | 0 | 3956 |
| example/shared-store.mjs | 0 | 2227 |

## Comportamiento demostrado localmente

- Dos navegadores aislados coordinan sus POST mediante una barrera: uno recibe
  201 y otro 409, con exactamente una reserva confirmada en el backend y ambas
  agendas. Se comprueba en cada idioma; el ganador no está predeterminado.
- Doce escrituras paralelas válidas se conservan con doce IDs únicos. También
  se aceptan intervalos adyacentes, salas distintas y fechas distintas.
- Cancelaciones concurrentes conservan historial, afectan solo al objetivo y
  liberan su intervalo. La repetición comunica ALREADY_CANCELLED.
- Reinicios reales con SIGKILL y un nuevo proceso conservan el snapshot. Ambos
  clientes detectan la caída y se reconectan sin recargar manualmente.
- Un trigger SQLite que rechaza UPDATE y un escritor que mantiene un bloqueo
  provocan errores reales de escritura: no hay falsa confirmación ni cambio de
  revisión; la operación funciona después de retirar el fallo. No se atribuye
  esa inyección controlada a un fallo físico real de disco.
- Un snapshot corrupto y un archivo no SQLite permanecen intactos; el modo
  local sigue disponible. Datos privados/corruptos del navegador no se importan.
- Un snapshot antiguo recibido después de una confirmación no revierte la
  agenda. Borrador, sala, filtro, preferencia individual y móvil de 390 px pasan.

## Fuerza de los oráculos

cb4fca2b9b1aa633c8ac015cd24329af50a3eff3 selló las pruebas antes de implementar: 15 FAIL de API y
15 FAIL de UI por endpoints/vista ausentes. El mismo oráculo pasa después.
Dos reportes verdes por suite y sus inputs se han auditado. Los siete contratos
y sus comandos, las regresiones originales y KDD Board pasan localmente.

En una copia aislada, 258cceb4f66e01572835442ef62ee33df949e5fd cambia solo shared-store.mjs para
reutilizar un snapshot vacío. El oráculo de API rechaza ocho casos, incluidos
el ganador único y la conservación de doce escrituras paralelas. Siete casos
pasan; las 25 pruebas originales de dominio/almacenamiento también pasan.
Esto demuestra detección del defecto concreto; la mutación es solo local.
La copia, un bundle y los reportes quedan fuera del árbol de producción.

## Coste observado

Los intervalos siguientes son startedAt–finishedAt de los reportes, no la
duración íntegra del proceso Node. Son dos observaciones por suite en Windows,
una de ellas con otros checks ejecutándose; no son un benchmark universal.

| Suite | Observaciones | Mínimo s | Máximo s | Media s |
| --- | --- | --- | --- | --- |
| api | 2 | 12.13 | 14.43 | 13.28 |
| ui | 2 | 29.52 | 30.71 | 30.11 |

La sincronización registró 42 observaciones: mínimo 2 ms,
máximo 700 ms y media 327.3 ms,
todas dentro del límite de aceptación de 5000 ms del entorno declarado.
La periodicidad de consulta no representa una garantía de latencia de red.
El intervalo empieza al invocar la comprobación de convergencia, después de
los resultados y assertions previos de la operación, y termina cuando las
agendas coinciden. Algunas ya coinciden al empezar; esta medición no equivale
al tiempo completo desde el COMMIT del servidor hasta el render del navegador.

El workflow conserva dos gates, cada uno ejecuta todos los checks dos veces,
y añade la ejecución declarada de ambos contratos: se esperan cinco reportes
API y cinco UI compartida por plataforma, además de los seis originales y cinco
de idiomas. Los checks nuevos mantienen límite de 60 s por comando.
No se midieron carga masiva, uso de CPU/memoria ni latencia de un despliegue remoto.

## Revisión pendiente

El baseline humano anterior (3b721cbcc9e2a5f6bcda709b58648ca3716487c1) rechaza los dos contratos
nuevos como not in approved reference. No se cambió la variable ni se creó
aprobación artificial. El candidato necesita revisión explícita de su SHA
antes de certificarse con el gate y CI en Ubuntu y Windows.
CONTRACT-03 conserva sus diez criterios abiertos y no tiene cierre documental.
Los reportes históricos de CONTRACT-01/02 conservan sus propios SHA y CI.

El alcance es un único servicio local y dos sesiones independientes, sin
autenticación de producción ni garantía entre varios servidores. El polling
y los snapshots completos son adecuados para esta prueba pequeña; la evidencia
no acredita escalabilidad ni portabilidad a Firefox/Safari. Los presupuestos
de complejidad son metadata, no mediciones.
