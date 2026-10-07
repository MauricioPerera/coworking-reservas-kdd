# CONTRACT-02 — Español, inglés y portugués — REPORT

Fecha: 2026-10-07.
Spec: `specs/CONTRACT-02-idiomas.md`.
CI: https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256

La interfaz permite elegir español de México, inglés de Estados Unidos y portugués
de Brasil, traducir textos y fechas de la agenda y conservar la preferencia.
Cambiar idioma conserva reservas, títulos del usuario, borrador, sala y filtros.
La implementación solo modifica los dos archivos de presentación; el modelo,
servidor y almacenamiento de reservas v1 conservan sus bytes anteriores.

El usuario aprobó explícitamente `3b721cbcc9e2a5f6bcda709b58648ca3716487c1` mediante «Adelante» en respuesta
a la solicitud que mostraba ese SHA completo y autorizaba verificar CI y fusionar
cuando todos los checks pasaran. La variable externa conserva ese valor literal.
El gate local pasó con esa aprobación. El intento 2 del run citado
terminó con success en Ubuntu y Windows antes de preparar este cierre documental.
El workflow posterior debe autenticar este run previo y comprobar que desde su
SHA solo cambian este reporte, su manifiesto y el spec.

## Resultado por criterio

| ID | Estado | Evidencia |
| --- | --- | --- |
| AC-1 | verified_in_ci | 34 checks de idiomas PASS, incluidos catálogos de 49 claves completas, etiquetas accesibles, mensajes y plurales; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256 |
| AC-2 | verified_in_ci | 21 flujos PASS por ejecución: siete en es-MX, siete en en-US y siete en pt-BR; diez reportes de idiomas auditados; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256 |
| AC-3 | verified_in_ci | Cambiar idioma conserva el JSON guardado, títulos, borrador, sala y filtro en el oráculo de idiomas; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256 |
| AC-4 | verified_in_ci | Cada idioma conserva reservas y preferencia después de recarga y reinicio real de Chromium con perfil persistente; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256 |
| AC-5 | verified_in_ci | Fechas de agenda con formato es-MX, en-US y pt-BR, sin cambios de fecha en Los Ángeles, UTC y Auckland ni alteración del almacenamiento; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256 |
| AC-6 | verified_in_ci | Fallback, preferencia no guardable, corrupción intacta y escritura de reservas fallida comprobados sin anunciar éxito indebido; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256 |
| AC-7 | verified_in_ci | Móvil de 390 px en tres idiomas PASS; 35 funcionales, 49 adversariales, cinco mutantes previos, siete casos originales y KDD Board PASS; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256 |
| AC-8 | verified_in_ci | docs/I18N-IMPACT.md registra código, controles, cobertura, tiempos y almacenamiento; este reporte añade tiempos reales de CI y hashes auditados; https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256 |
| CI-1 | verified_in_ci | https://github.com/MauricioPerera/coworking-reservas-kdd/actions/runs/37689121256 |

## Validación y artefactos

- Ambos gates verificaron integridad, perímetro y todos los checks dos veces por
  plataforma. Los logs registran dos PASS de gate por plataforma, cuatro pasadas
  de los 35 funcionales y 49 adversariales y cinco pasadas de los 34 checks nuevos.
- Los cinco contratos y sus comandos pasan. Board verifica el oráculo original,
  sus hashes y un test Node externo con siete casos internos de Chromium.
- Los dos artefactos reales se descargaron y auditaron: doce reportes e2e de
  siete casos y diez reportes de idiomas de 34 casos. En cada reporte de idiomas
  se verifican exactamente los 21 flujos y 13 checks adicionales, resultados,
  tiempos, runtime y metadatos del run autenticado.
- Los hashes de los reportes descargados se recalcularon. Los 19 inputs de e2e
  y los diez del oráculo de idiomas coinciden con los blobs Git del commit citado;
  los hashes de Board también. Los reportes conservan el SHA y URL reales de CI.
- Los IDs y digests de la API autenticada y los hashes comprobados están en
  CONTRACT-02-EVIDENCE.json. Los digests ZIP son los declarados por GitHub,
  sin afirmar que se recalculó el hash del archivo ZIP. Las capturas de los tres
  idiomas en escritorio y móvil también se descargaron y registraron por hash.

| Plataforma | Artefacto de GitHub | Reportes e2e × casos | Reportes de idiomas × casos |
| --- | --- | --- | --- |
| ubuntu-24.04 | 11515773079 | 6 × 7 | 5 × 34 |
| windows-latest | 11516425635 | 6 × 7 | 5 × 34 |

## Impacto y tiempos reales de CI

Se añade un contrato, un check de idiomas y dos controles protegidos, manteniendo
las cinco rutas autorizadas de producción. Los 49 textos por idioma están en el
cliente existente: pasa de 3.950 a 12.733 bytes; HTML pasa de 7.971 a 9.685 bytes.
No se añaden dependencias de runtime ni servicios de traducción. Playwright
1.63.0 se declara como dependencia directa de desarrollo con los mismos paquetes
y versiones que ya estaban en el lockfile.

Los valores siguientes corresponden al intervalo startedAt–finishedAt de los
reportes de idiomas de CI, incluyendo su setup y cierre registrado. La duración
total del proceso Node puede incluir tiempo posterior al reporte. Son cinco
observaciones por plataforma, sin afirmar un benchmark universal.

| Plataforma | Observaciones | Mínimo s | Máximo s | Media s |
| --- | --- | --- | --- | --- |
| ubuntu-24.04 | 5 | 9.08 | 11.04 | 9.65 |
| windows-latest | 5 | 14.06 | 15.08 | 14.47 |

docs/I18N-IMPACT.md conserva la medición local y la fotografía previa a aprobación.
Este reporte registra la validación posterior. Las fechas de agenda usan locale
con límite UTC explícito; los widgets nativos siguen las convenciones del navegador
o sistema. No hay migración del schema de reservas ni conversión de sus horarios.

## Fuerza de los oráculos e historial

El commit `ce8a12e8a3db64d732c783f63721a3971060e922` registra el oráculo y contrato nuevos antes
de implementar. Las 34 pruebas fallaron por la ausencia del selector; el mismo
oráculo pasó tras implementar. Los siete casos originales y sus assertions
conservan su archivo. Una mutación local aislada cambió un mensaje de error inglés
a WRONG_TRANSLATION: el perfil español pasó y el oráculo nuevo rechazó exactamente
el caso de intervalo inglés, con 33 PASS y 1 FAIL. Esa mutación es evidencia local,
no una ejecución de GitHub. Los cinco mutantes anteriores pasan en los adversariales
del CI citado. Los presupuestos de complejidad son metadata, no una medición.

El gate y ambos runs iniciales de revisión rechazaron correctamente el contrato
nuevo antes de la aprobación. El segundo intento citado lo verificó después de
la aprobación explícita. CONTRACT-01, su reporte y manifiesto conservan el SHA y
run de su propio cierre; no se les atribuye la extensión de idiomas. Los artefactos
de GitHub Actions están sujetos a su retención configurada.
