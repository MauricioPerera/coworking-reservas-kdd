# Objetivo activo — Reservas compartidas y concurrencia

Definido el 2026-10-07. Estado: objetivo activo; implementación candidata
validada localmente. Revisión explícita del baseline, gate aprobado y CI pendientes.

Implementar y validar un prototipo local en el que dos sesiones de usuario
independientes comparten reservas mediante un backend con persistencia
transaccional. Ante dos solicitudes simultáneas para la misma sala, fecha e
intervalo, debe confirmarse exactamente una y rechazarse la otra por conflicto.
Ambos clientes deben terminar mostrando el mismo estado confirmado.

El punto de partida es main 301ae148d8846f6d7912a665ab9b8095c3617a35,
con reservas locales e idiomas ya verificados. Esta referencia describe el
punto de partida; no concede una aprobación de controles nuevos.

## Resultados que deben demostrarse

1. Dos sesiones aisladas envían solicitudes coordinadas en paralelo para una
   misma sala, fecha e intervalo: una confirmación, un conflicto y una sola
   reserva confirmada en el backend. El ganador puede ser cualquiera.
2. Intervalos adyacentes, salas distintas y fechas distintas se aceptan según
   las reglas existentes. Solicitudes inválidas no modifican el estado.
3. Operaciones concurrentes válidas conservan todas las reservas aceptadas,
   con identificadores únicos y sin pérdida de actualizaciones ni cambios en
   los títulos introducidos por los usuarios.
4. Las dos agendas convergen sin recarga manual dentro de cinco segundos en
   el entorno de prueba declarado. Se registran los tiempos observados;
   este límite de aceptación no es una garantía universal de rendimiento.
5. Cancelar conserva el historial, afecta solo a la reserva elegida y libera
   su intervalo para ambos clientes. Cancelaciones repetidas tienen un
   resultado consistente con las reglas existentes.
6. Después de reiniciar realmente el proceso del servidor, el estado conserva
   las reservas confirmadas y canceladas. Un fallo de escritura se comunica
   sin anunciar una confirmación que no se haya guardado.
7. El modo compartido funciona en español es-MX, inglés en-US y portugués
   pt-BR. El modo local conserva sus 35 checks funcionales, 49 adversariales,
   siete casos originales y 34 checks de idiomas, con sus oráculos intactos.
8. Una prueba con un defecto deliberado de concurrencia demuestra que los
   nuevos oráculos detectan una doble reserva o una actualización perdida.
   El defecto y el resultado se identifican; no se atribuye a CI una prueba local.
9. Se registran cambios de arquitectura, código, almacenamiento, cobertura,
   tiempos de validación y latencia de sincronización bajo condiciones concretas.
10. Los nuevos contratos y controles reciben revisión explícita de un SHA
    concreto. Gates, contratos, Board y CI en Ubuntu y Windows pasan; el cierre
    queda respaldado por un run previo autenticado y sus artefactos.

## Alcance

Dos sesiones de navegador y un servicio local compartido. Las sesiones representan
usuarios independientes; esta prueba no incluye autenticación ni permisos de
producción, despliegue público, carga masiva o coordinación entre varios servidores.
Las fechas de calendario y los horarios HH:mm mantienen su significado actual.

Se conserva el modo local como comportamiento comprobado. Los datos locales v1
existentes no se migran ni publican automáticamente al backend compartido.
La preferencia de idioma sigue siendo propia de cada navegador.

## Método y límite de cierre

Primero se preparan contratos, oráculos deterministas y su ejecución fallida antes
de implementar. Los controles nuevos y el perímetro de producción se presentan
para revisión; ninguna referencia se aprueba por deducirse de HEAD o de tests verdes.
Después se implementa, se recopila evidencia real, se verifica el CI y se cierran
los criterios respaldados por sus resultados.

La definición no sustituye al contrato sellado ni acredita el cierre. Los criterios
están en specs/CONTRACT-03-concurrencia.md y la evidencia local en
docs/CONCURRENCY-IMPACT.md; ambos distinguen resultados locales de CI pendiente.
El objetivo se completa únicamente cuando los diez resultados se han demostrado.
El repositorio original kdd-e2e-acceptance permanece intacto.

## Etapas anteriores

- CONTRACT-01: reservas locales, cerrado con su propio SHA y CI.
- CONTRACT-02: español, inglés y portugués, cerrado con su propio SHA y CI.

Sus specs, reportes, manifiestos y oráculos conservan la evidencia histórica.
