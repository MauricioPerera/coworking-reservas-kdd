# Impacto del soporte de idiomas

Fecha: 2026-10-07. Estado: probado localmente; nuevo baseline pendiente de revisión humana.
Implementación comprobada: `0769cbdd420c775d9475578ce191b831ba1b12a1`. Contrato: `specs/CONTRACT-02-idiomas.md`.

La aplicación ofrece español de México, inglés de Estados Unidos y portugués de
Brasil mediante un selector. Español es el idioma inicial. La elección persiste
separadamente de las reservas y conserva los textos escritos por el usuario.

## Cambios medidos

| Área | Antes | Con idiomas |
| --- | --- | --- |
| Idiomas de la aplicación | Español | Español, inglés y portugués |
| Textos del catálogo por idioma | Textos dispersos | 49 claves completas en cada catálogo |
| Contratos KDD | 4 | 5 |
| Oráculo Chromium original | 7 casos | Los mismos 7, archivo y assertions conservados |
| Oráculo de idiomas adicional | Ausente | 34 casos: 21 flujos y 13 comprobaciones adicionales |
| Funcionales y adversariales | 35 y 49 | 35 y 49 PASS |
| Checks de la política | 4 | 5; agrega ui-languages |
| Controles protegidos, incluida la política | 45 | 47 |
| Rutas de producción autorizadas | 5 | Las mismas 5; solo 2 modificadas |
| Schema de reservas | v1, fechas ISO y HH:mm | Conservado, sin migración |
| Preferencia | Sin idioma guardado | Otra clave: coworking-reservas:locale:v1 |
| Dependencias de runtime nuevas | 0 | 0 |
| Playwright de desarrollo | Transitivo, 1.63.0 | Declarado directamente, misma versión y mismos paquetes |

| Archivo de presentación | Bytes antes | Bytes después |
| --- | --- | --- |
| example/client.mjs | 3950 | 12733 |
| example/index.html | 7971 | 9685 |

Los catálogos están en el cliente existente; el servidor, el modelo de reservas
y la persistencia de reservas mantienen sus bytes. No se añaden servicios de
traducción ni peticiones de red en tiempo de uso. Los horarios siguen siendo
locales de la agenda y no se convierten entre zonas.

## Comportamiento comprobado

- Los siete flujos de reserva pasan en cada idioma, incluidos errores, fechas,
  salas, cancelación y persistencia tras recarga y un reinicio real del navegador.
- Cambiar idioma conserva exactamente el JSON guardado, los identificadores,
  los títulos del usuario, el borrador, la sala elegida y el filtro activo.
- Los estados de éxito y error existentes se vuelven a presentar en el idioma
  elegido. Las etiquetas accesibles, placeholders, nombres de sala, plurales y
  acciones de cancelación se traducen.
- La fecha 2030-06-12 se muestra como 12/06/2030 en español y portugués y
  06/12/2030 en inglés. La agenda conserva el día en Los Ángeles, UTC y Auckland
  mediante un límite de calendario UTC explícito. El valor del formulario y del
  almacenamiento permanece ISO. Los widgets nativos de fecha y hora conservan
  las convenciones del navegador o sistema; la agenda usa el locale seleccionado.
- Preferencias desconocidas vuelven a español. Un fallo al guardar la preferencia
  permite usar el idioma durante la sesión y lo informa. La corrupción de reservas
  conserva sus bytes, y una escritura de reserva fallida no anuncia éxito.
- El diseño móvil de 390 px pasa en los tres idiomas sin desbordamiento horizontal.

## Coste de validación

Una ejecución local completa del nuevo comando tardó 16.72 s,
incluidos setup y teardown. En esa ejecución, los siete flujos sumaron
3.13 s en español, 3.02 s en inglés
y 3.02 s en portugués. Son observaciones de Windows,
no una garantía de duración de CI ni una comparación directa con el harness e2e.

La política ejecutará el comando dos veces por gate: aproximadamente
33.4 s adicionales con esta medición. El workflow conserva
sus dos gates y la ejecución declarada del contrato, por lo que se esperan cinco
reportes de idiomas por plataforma además de los seis reportes e2e de siete casos.
El límite del check de idiomas es 60 s; no se aumenta el timeout del oráculo original.

## Efecto sobre la fuerza de los oráculos

El commit `ce8a12e8a3db64d732c783f63721a3971060e922` registra el contrato y oráculo de idiomas antes de
implementar. Produjo 34 fallos por la ausencia del selector. La implementación
posterior cambió solo los dos archivos de presentación y pasó las mismas 34
pruebas. Dos reportes completos verifican sus hashes contra ese commit.

En una copia aislada se cambió deliberadamente el mensaje de intervalo inválido
en inglés a WRONG_TRANSLATION, con todos los oráculos intactos. El oráculo original
de español pasó sus siete casos; el nuevo rechazó exactamente el caso de intervalo
en inglés (33 PASS, 1 FAIL). Esta prueba demuestra la cobertura añadida para ese
defecto concreto. Los cinco mutantes previos siguen detectándose en los 49 adversariales.

## Revisión y CI

La política candidata tiene schema válido. El gate con el baseline humano anterior
rechaza el contrato nuevo como `not in approved reference`; no se autoconcede
aprobación al candidato. Además, comparar futuros cambios con ese baseline vuelve
a considerar nuevo el cierre histórico de CONTRACT-01 y detecta CI_SOURCE_DRIFT
si se intenta atribuirle la implementación de idiomas. El nuevo baseline es también
el límite explícito de esta siguiente etapa de desarrollo.

AGENTS.md exige que los controles nuevos reciban una revisión independiente.
Después de aprobar un SHA concreto se configura esa referencia externa y se
verifican el gate, Ubuntu y Windows. CONTRACT-02 permanece abierto y sus archivos
de cierre estarán ausentes hasta que un run real y sus artefactos sustenten el cierre.
Los reportes de CONTRACT-01 conservan su SHA y run históricos.

La evidencia local detallada y la copia aislada de la mutación se conservan fuera
del repositorio, en prueba-coworking-reservas-kdd/i18n-evidence y
i18n-impact-evidence.json. Los reportes y capturas de ejecución están también en
.e2e/locale-runs. No se presenta esta evidencia local como CI remoto aprobado.
