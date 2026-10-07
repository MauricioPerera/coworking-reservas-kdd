# CONTRACT-01 — Reservas de salas — REPORT

Fecha: 2026-10-07.
Spec: `specs/CONTRACT-01-reservas.md`.
CI: https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952

El usuario aprobó explícitamente el commit `ccab5ee9871338afcf9497ed54130cf7267b0624` y la publicación
del repositorio público mediante «Adelante autorizo» en respuesta a la solicitud
que mostraba ese SHA completo. La variable externa `KDD_QUALITY_APPROVED_REF`
contiene esa referencia literal. El gate local pasó después de la aprobación.
El intento 1 del run citado terminó con `success` en Ubuntu 24.04 y Windows
antes de preparar este cierre. El CI del commit de cierre debe autenticar este
run previo y confirmar que desde su SHA solo cambian las tres rutas documentales.

## Resultado por criterio

| ID | Estado | Evidencia |
| --- | --- | --- |
| AC-1 | verified_in_ci | Chromium: reserva válida con título, sala, fecha y horas mostrados; siete casos PASS en cada ejecución; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |
| AC-2 | verified_in_ci | Funcional y Chromium: fin anterior o igual al inicio rechazados sin crear reservas; 35 tests funcionales PASS; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |
| AC-3 | verified_in_ci | Funcional y Chromium: solapamientos en la misma sala y fecha rechazados; se conserva la reserva original; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |
| AC-4 | verified_in_ci | Funcional y Chromium: intervalos contiguos permitidos, con ambos límites comprobados en dominio; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |
| AC-5 | verified_in_ci | Funcional y Chromium: mismo horario permitido en salas distintas y en fechas distintas de la misma sala; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |
| AC-6 | verified_in_ci | Funcional y Chromium: cancelar el ID solicitado conserva otras reservas y libera el intervalo para una reserva nueva; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |
| AC-7 | verified_in_ci | Chromium: reserva conservada tras recargar y reiniciar el navegador; persistencia funcional con seis tests PASS; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |
| AC-8 | verified_in_ci | Adversarial: 49 PASS, incluidos 44 controles de reportes y cinco mutantes detectados por assertions protegidas; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |
| AC-9 | verified_in_ci | KDD: cuatro contratos y sus comandos PASS; Board verifica oráculo, un test Node externo y hashes vigentes; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |
| CI-1 | verified_in_ci | https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37684277952 |

## Comprobaciones

- Los tests funcionales pasan 35 casos: 19 de dominio, seis de persistencia y
  diez de los controles de aceptación. Los adversariales pasan 49: 44 controles
  de reportes y cinco mutaciones de producto.
- Los mutantes aceptan solapamientos, rechazan horarios contiguos, cancelan otra
  reserva, mantienen bloqueado un horario cancelado o pierden datos guardados.
  Cada mutante se detecta por assertions; un fallo de importación o anchor
  incompatible se considera inconcluso y hace fallar el check.
- Los siete casos de Chromium verifican reserva válida, intervalos inválidos,
  solapamientos, horarios contiguos, independencia por sala y fecha, cancelación
  y persistencia tras recargar y reiniciar el navegador. No hay skips, reintentos
  ni uso de modelos en la aceptación obligatoria.
- El gate canónico ejecutó todos los checks dos veces por plataforma; el entry
  point revisado repitió ese gate completo. Ambos registran PASS. KDD validó los
  cuatro contratos y sus comandos; Board verificó el oráculo y sus hashes.
- Se descargaron los dos artefactos reales y se auditaron doce reportes,
  seis por plataforma y siete casos por reporte. Sus hashes, intervalos de
  ejecución, SHA, contrato y metadatos coinciden con el CI autenticado. Los 17
  inputs coinciden con los blobs Git del SHA citado; los hashes de Board también.

## Artefactos comprobados

| Plataforma | Artefacto de GitHub | Ejecuciones de aceptación | Casos por ejecución |
| --- | --- | --- | --- |
| ubuntu-24.04 | 11509694457 | 6 | 7 |
| windows-latest | 11509534602 | 6 | 7 |

El manifiesto conserva los IDs y digests de la API autenticada de GitHub y los
doce hashes de reporte recalculados. Los digests ZIP son los declarados por la
API; los hashes de reportes, inputs y Board fueron comprobados independientemente.
Los artefactos de Actions están sujetos a su retención configurada.

## Secuencia de desarrollo

El primer commit `5bdf8e0679c26012cf403c73ff2f7cdea517f940` registra contratos,
oráculos y stubs antes de implementar; dominio y persistencia produjeron 25
fallos esperados. El commit de implementación cambia solo cinco rutas de
producción. Después se corrigió el manejo de assertions del harness de mutaciones
y se reforzaron tres expectativas del navegador, antes de la aprobación humana.
El historial y los logs originales conservan esta secuencia; esas mejoras
posteriores no se presentan como parte de los oráculos del primer commit.
`docs/VALIDATION.md` conserva la fotografía histórica del bootstrap local previo
a la aprobación. Este reporte registra la validación posterior y el cierre.

## Alcance del cierre

Desde el run citado solo se modifican este reporte, su manifiesto y el spec,
rutas exactas permitidas por la política aprobada. Los controles y la aplicación
corresponden al código ejecutado por ese CI. El repositorio de origen conserva
su historial y evidencia sin modificaciones.

La aplicación guarda reservas de Sala Atlas y Sala Luna en el navegador,
permite intervalos semiabiertos y conserva las cancelaciones en el historial.
El perfil es local y de un navegador; los horarios no se convierten entre zonas.
Los fallos o corrupción del almacenamiento se notifican sin sobrescribir
silenciosamente los datos. Los presupuestos de complejidad del contrato son
metadatos estructurales; este cierre no afirma una medición de complejidad.
