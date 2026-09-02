# Volare · Journey Map Workshop

Versión vacía del tablero original `Volare_Journey_Map_Standalone.html`, preparada para completar en vivo con Marcelo y Daniel.

## Qué conserva del original

- La identidad visual Volare: encabezado azul, logo, tarjetas introductorias, paleta crema y dorada, tipografías y tabla.
- Las 12 filas de análisis del Journey.
- Ocho momentos iniciales vacíos y editables.
- Edición directa de títulos, preguntas guía y celdas.
- Reordenamiento de momentos por arrastre.
- Alta y eliminación de momentos y filas.
- Oportunidades/proyectos con prioridad, responsable, objetivo y fecha.
- Adjuntos como referencias dentro del tablero.
- Importación y exportación JSON, exportación CSV, impresión/PDF y modo presentación.

## Curva emocional

La fila permite seleccionar cuatro estados:

- Insatisfecho
- Neutro
- Satisfecho
- WOW

Al seleccionar estados en momentos consecutivos, los puntos se conectan automáticamente con una línea.

## Guardado de avances

El contenido se guarda automáticamente en el navegador y dominio donde se utiliza. Para trasladar el trabajo a otro equipo o conservar un respaldo, descargar el archivo JSON desde el botón `JSON` e importarlo luego con `Importar`.

Los adjuntos se registran por nombre y metadatos; el archivo original no se sube a un servidor en esta versión.

## Publicación en GitHub y Render

1. Subir el contenido completo de esta carpeta a la raíz de un repositorio de GitHub.
2. En Render, crear un nuevo Blueprint y conectar ese repositorio.
3. Render detectará `render.yaml` y publicará el tablero como sitio estático.

También puede configurarse manualmente como Static Site:

- Build command: `echo "Static site ready"`
- Publish directory: `.`

## Archivo principal

`index.html` contiene todo el tablero: estructura, diseño, lógica y logo. No requiere dependencias externas.
