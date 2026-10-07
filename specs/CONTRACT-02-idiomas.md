# CONTRACT-02 - Español, inglés y portugués

## Criterios de aceptación

- [ ] [AC-1] Traducir textos, mensajes, pluralización y etiquetas accesibles en español, inglés y portugués con `npm run test:i18n`.
- [ ] [AC-2] Verificar los siete flujos de reservas en cada idioma, 21 casos, con npm run test:i18n.
- [ ] [AC-3] Conservar datos, títulos, borrador, sala y filtro al cambiar idioma con npm run test:i18n.
- [ ] [AC-4] Persistir idioma y reservas al recargar y reiniciar el navegador con npm run test:i18n.
- [ ] [AC-5] Mostrar fechas según locale sin alterar fecha ni horario almacenados con npm run test:i18n.
- [ ] [AC-6] Comprobar fallback, corrupción y fallos de escritura de preferencias y reservas con npm run test:i18n.
- [ ] [AC-7] Comprobar diseño móvil y conservar todas las regresiones anteriores con los checks declarados.
- [ ] [AC-8] Medir cambios de código, controles, cobertura, tiempos y almacenamiento en docs/I18N-IMPACT.md.
- [ ] [CI-1] Aprobar explícitamente el nuevo baseline, verificar su gate y CI en Ubuntu y Windows y cerrar contra un run previo autenticado.

## Restricciones

Tocar SOLO example/client.mjs y example/index.html para la implementación de idiomas,
y las rutas PM exactas declaradas para este contrato en quality.json.
Los controles nuevos se preparan y sellan antes de implementar para revisión
independiente. La aprobación anterior no se transfiere al nuevo SHA.
Los contratos, oráculos y cierres históricos de reservas conservan su evidencia.
Después del CI solo se permite cerrar este spec y sus dos archivos de reporte.
- ABORTAR SI se necesita debilitar assertions, inventar aprobación o atribuir resultados locales a CI remoto.

## Alcance

Español es-MX por defecto, inglés en-US y portugués pt-BR mediante selector.
Fechas ISO y horarios HH:mm permanecen en el almacenamiento de reservas v1;
la preferencia es otra clave. No se traduce el contenido escrito por usuarios.
