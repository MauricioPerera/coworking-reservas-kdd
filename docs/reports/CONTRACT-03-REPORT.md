# CONTRACT-03 — Reservas compartidas y concurrencia — REPORT

Fecha de cierre: 2026-10-08 UTC.
Spec: `specs/CONTRACT-03-concurrencia.md`.
CI previo: https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916, intento 2.

Dos sesiones aisladas comparten una agenda autoritativa bajo /compartidas.
Ante dos solicitudes simultáneas solapadas, una confirma y la otra comunica
conflicto. BEGIN IMMEDIATE protege lectura, reglas existentes, UPDATE y COMMIT;
la API confirma después de persistir. Cancelaciones conservan historial y
liberan disponibilidad; reiniciar el servidor conserva los datos.

El usuario respondió «continua» a la solicitud que mostraba el SHA completo
`36f1eee5c232ab0483d9f23cb8def494cf18dae5` y pedía aprobarlo como baseline y fusionar solamente tras
pasar todos los gates y CI. La variable externa contiene ese valor literal.
La comparación local del baseline y el gate directo de política pasaron; el
lanzador npm local alcanzó su límite global de 180 s y esa invocación queda
fallida por timeout. No se cambiaron los controles para ocultarlo. La misma
entrada npm pasa en ambas plataformas de CI. El intento 2 citado terminó con success en Ubuntu y
Windows antes de preparar este cierre. El CI siguiente debe autenticar este
run previo y verificar que desde su SHA solo cambian este reporte, su manifiesto
y el spec. Los cierres CONTRACT-01/02 conservan sus propios commits y runs.

## Resultado por criterio

| ID | Estado | Evidencia |
| --- | --- | --- |
| AC-1 | verified_in_ci | 15 casos API y 15 UI PASS por suite, con dos POST de navegadores aislados liberados mediante barrera en es-MX, en-US y pt-BR: exactamente un 201 y un 409; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916 |
| AC-2 | verified_in_ci | Doce escrituras paralelas se conservan con IDs únicos; intervalos adyacentes, salas y fechas distintas se aceptan sin pérdida de actualizaciones; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916 |
| AC-3 | verified_in_ci | Dos agendas convergen sin recarga dentro de 5000 ms; 210 observaciones de convergencia y caso de snapshot atrasado PASS. El reloj empieza al comprobar la convergencia después de la operación, no en COMMIT; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916 |
| AC-4 | verified_in_ci | Cancelación concurrente comunica 200 y 409 ALREADY_CANCELLED, conserva historial y otra reserva, y permite reutilizar solo el intervalo liberado; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916 |
| AC-5 | verified_in_ci | Reinicio real del servidor con SIGKILL conserva reservas y cancelaciones; ambos clientes se reconectan. Trigger SQLite y bloqueo de escritor verifican rollback sin falsa confirmación; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916 |
| AC-6 | verified_in_ci | Tres idiomas, borrador, sala, filtros, preferencia individual, datos privados del navegador y layout de 390 px PASS en dos sesiones independientes; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916 |
| AC-7 | verified_in_ci | Oráculos y cierres históricos conservan sus bytes; 35 funcionales, 49 adversariales, siete casos originales de navegador, 34 checks de idiomas, siete contratos KDD y KDD Board PASS; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916 |
| AC-8 | locally_verified | Mutación local aislada 258cceb4f66e01572835442ef62ee33df949e5fd reutiliza un snapshot vacío: el oráculo API rechaza ocho casos y pasan siete; las 25 pruebas originales de dominio/almacenamiento pasan. No se atribuye esta mutación a CI |
| AC-9 | verified_in_ci | docs/CONCURRENCY-IMPACT.md registra arquitectura, bytes, almacenamiento, cobertura y costes locales; este reporte y el manifiesto añaden cinco intervalos API/UI y 105 observaciones de convergencia por plataforma obtenidos de artefactos autenticados; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916 |
| CI-1 | verified_in_ci | https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37708918916 |

## Validación y artefactos

Cada plataforma pasa dos gates que repiten sus siete checks dos veces, los siete
comandos declarados de contratos y KDD Board. Los logs contienen cuatro pasadas
de los 35 funcionales y 49 adversariales, cinco de los 34 checks de idiomas y
cinco de cada suite compartida de 15 casos. No se usan retries de casos.

Se descargaron y auditaron dos artefactos auténticos: doce reportes e2e originales,
diez de idiomas, diez API compartida y diez UI compartida. Se recalcularon los
hashes de reportes, inputs y capturas. Los 27 inputs originales, diez de idiomas
y 16 compartidos coinciden con los blobs Git del commit citado. Cada reporte
compartido identifica quince resultados, runtime, procesos terminados y datos
del run real. Las tres barreras de POST y el reinicio con PID distinto se
comprobaron por reporte correspondiente. Los hashes de Board también coinciden.

Los IDs, digests declarados por GitHub y hashes comprobados figuran en
CONTRACT-03-EVIDENCE.json. No se afirma haber recalculado el hash ZIP completo.
Los artefactos están sujetos a la retención de GitHub Actions.

| Plataforma | Artefacto GitHub | E2E × casos | Idiomas × casos | API × casos | UI compartida × casos |
| --- | --- | --- | --- | --- | --- |
| ubuntu-24.04 | 11520674462 | 6 × 7 | 5 × 34 | 5 × 15 | 5 × 15 |
| windows-latest | 11520902349 | 6 × 7 | 5 × 34 | 5 × 15 | 5 × 15 |

## Medición de CI

Estos intervalos startedAt–finishedAt son cinco observaciones por suite y
plataforma, incluyendo el setup y cierre registrados, no la duración íntegra
del proceso ni un benchmark universal. Los valores son mínimo / máximo / media.

| Plataforma | API s | UI compartida s | Observaciones convergencia | Convergencia ms |
| --- | --- | --- | --- | --- |
| ubuntu-24.04 | 1.47 / 3.38 / 1.88 | 18.93 / 20.45 / 19.34 | 105 | 2 / 766 / 468.4 |
| windows-latest | 2.87 / 3.20 / 3.07 | 22.07 / 23.68 / 22.95 | 105 | 3 / 785 / 430.2 |

La convergencia se mide desde la comprobación posterior a la operación hasta
que las agendas coinciden. No representa latencia completa desde COMMIT, una
garantía de red ni escalabilidad. Las 210 observaciones pasan el límite de
5000 ms del entorno declarado. El polling consulta cada 750 ms.
docs/CONCURRENCY-IMPACT.md conserva su fotografía local previa a aprobación.

## Pruebas selladas y mutación local

`cb4fca2b9b1aa633c8ac015cd24329af50a3eff3` selló contratos, fixture y assertions antes
de implementar: quince FAIL de API y quince FAIL de UI por funcionalidad ausente.
El mismo oráculo pasa después y conserva sus hashes. En una copia aislada,
`258cceb4f66e01572835442ef62ee33df949e5fd` cambia únicamente shared-store.mjs para usar
un snapshot vacío. Ocho casos API fallan, incluidos ganador único y doce
escrituras preservadas; siete pasan y las 25 pruebas originales de dominio y
almacenamiento pasan. Esta mutación y sus reportes son exclusivamente locales.

## Alcance y datos

Un único servicio en loopback y dos sesiones independientes, sin autenticación
de producción ni coordinación entre servidores. Los tres idiomas, borradores,
filtros y datos locales siguen funcionando. No se migran reservas del navegador.
No se agregan dependencias; el lockfile y el modelo/persistencia local conservan
sus bytes. El rechazo de UPDATE mediante trigger es una inyección controlada,
sin atribuirlo a un fallo físico de disco. SQLite queda por defecto en
.e2e/shared-data; debe preservarse al limpiar evidencias o configurarse otro
archivo mediante SHARED_DB_PATH. Complejidad presupuestada es metadata; no se
midieron CPU/memoria, carga masiva ni Firefox/Safari.
