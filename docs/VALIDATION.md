# Validación local del candidato de reservas

Fecha: 2026-10-07. Estado: bootstrap preparado para revisión humana.
El nuevo proyecto no tiene baseline aprobado ni CI remoto acreditado.

## Resultados

| Comprobación | Resultado local en Windows |
| --- | --- |
| Test-first: dominio y persistencia contra stubs | 25 fallos esperados, 0 PASS |
| Tests funcionales | 35 PASS |
| Tests adversariales | 49 PASS: 44 de reportes y 5 mutaciones de producto |
| Chromium real | 7 casos PASS; 1 test Node externo |
| Metadatos KDD | 4 contratos, 6 nodos OKF y 1 spec válidos |
| Comandos declarados de los contratos | 4 PASS |
| Ejecutor canónico de KDD Board | Oráculo verificado y hashes vigentes |
| Gate sin KDD_QUALITY_APPROVED_REF | Rechazado correctamente |

El primer commit registra contratos, oráculos y stubs antes de implementar.
La implementación posterior solo cambia las cinco rutas de producción.
El harness de mutaciones se corrigió en un commit separado: un rechazo incorrecto
de una operación válida debe convertirse en fallo de assertion del oráculo.
Se mantuvieron todas las reglas y escenarios; el fallo anterior está conservado.

Antes de aprobar el baseline, la auditoría de alcance reforzó tres expectativas
de los mismos siete casos UI: comprobar la fecha y horas mostradas, rechazar
inicio y fin iguales, y aceptar otra fecha en la misma sala y horario. Estas
assertions adicionales quedan registradas después de la implementación inicial;
no se presentan como parte del primer commit test-first. No cambia producción
ni se eliminan expectativas para obtener resultados verdes.

Los cinco defectos deliberados son aceptar solapamientos, rechazar intervalos
contiguos, cancelar la reserva equivocada, impedir que la cancelación libere
disponibilidad y perder los datos guardados. Cada mutante parte de controles que
pasan y se rechaza por un fallo de assertions. Anchors incompatibles o errores
de importación fallan como inconclusos, sin contarse como detecciones.

El contrato de persistencia comprueba corrupción y fallos del almacenamiento sin
sobrescribir los datos originales. La UI escribe primero y solo entonces actualiza
su estado; no anuncia éxito si el guardado falla.

## Evidencia y límites

Los logs del laboratorio están fuera del proyecto, en prueba-coworking-reservas-kdd.
Las ejecuciones de navegador, hashes y traces están en .e2e/runs. Las fixtures
de reportes son datos sintéticos de tests; no se presentan como runs de reservas.

Los resultados locales no acreditan Ubuntu ni una ejecución real de GitHub Actions.
No se ejecutó el gate con una referencia inventada como aprobada. El spec permanece
abierto y sus archivos de cierre siguen ausentes. Tras la revisión humana del
candidato concreto se verificará el gate, CI en ambas plataformas y sus artefactos.

El perfil es local y de un solo navegador, sin garantías de concurrencia entre
usuarios. Los horarios no se convierten entre zonas. Los runners y dependencias
forman parte de la base de confianza. No se afirma cobertura universal ni que se
hayan medido los presupuestos de complejidad declarados en los contratos.
