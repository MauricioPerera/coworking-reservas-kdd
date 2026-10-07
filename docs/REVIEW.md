# Revisión de la primera referencia

Esta entrega prepara una base de confianza para revisión; sus commits y hashes
no representan aprobación humana. El primer commit registra tests y stubs antes
de implementar. El candidato final incluye el adaptador funcional y la fixture.
Su aprobación inicial es una revisión de bootstrap, no una certificación
retroactiva de desarrollo contra un baseline aprobado previamente.

El revisor debe inspeccionar:

- Los criterios de `specs/CONTRACT-01-reservas.md` y los siete casos esperados.
- Los tests, helpers, lector de schema, launcher y variables transmitidas al hijo.
- `quality.json`, sus listas exactas, checks y permisos de implementación.
- El lockfile, revisiones externas y workflow.
- Resultados funcionales, mutaciones, UI y prueba del ejecutor canónico de Board.

Después de revisar un commit concreto, conservar su SHA completo fuera del
alcance del implementador y configurar KDD_QUALITY_APPROVED_REF. No copiar
automáticamente la salida de `git rev-parse HEAD` a esa variable como aprobación.
Si se alteran oráculos, helpers, configuración o política, revisar otra referencia.

La gobernanza externa sigue siendo necesaria: proteger la rama y exigir el
workflow revisado como check. Un PR capaz de sustituir el workflow o runner
podría omitir el gate; el script no configura las protecciones de GitHub.

## Cierre posterior en CI

Mantener el spec abierto hasta tener un run real exitoso para el commit de
implementación. Los artefactos de aceptación conservan contrato, commit y URL
del run. La categoría `ui` no demuestra por sí sola que el test sea suficiente.

Para seguir el protocolo de cierre completo de KDD, generar el reporte y
manifiesto de criterios en un commit posterior sin cambios de código/oráculos,
apuntando al run previo. El workflow ya ejecuta `verify_completion_runs.py` del
tooling fijado, que primero aplica `validate_completion.py` y luego autentica el
run mediante la API de GitHub con permiso `actions: read`. Rechaza el run actual,
un run fallido, otro SHA/workflow o cambios de código posteriores al run citado.
Sin manifiestos nuevos conserva verified=0 y no inventa cierres.

Crear docs/reports/CONTRACT-01-REPORT.md y CONTRACT-01-EVIDENCE.json siguiendo
las plantillas del tooling KDD fijado. Cada ID del spec debe coincidir con la
tabla del reporte y el manifiesto; ambos deben enlazar al mismo run previo.
Estos artefactos tienen rutas PM explícitas en la política. Mantener ausentes
los reportes de cierre hasta que exista evidencia real.
