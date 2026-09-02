# Volare · Journey Map Workshop

Versión vacía y facilitada del tablero Journey Map de Volare, preparada para completar en vivo con Marcelo y Daniel.

## Qué conserva

- La estructura completa del journey: acciones, puntos de contacto, expectativas, realidad, curva emocional, procesos, lugar, personas, cultura, indicadores, oportunidades y adjuntos.
- Curva emocional interactiva con cuatro niveles: Insatisfecho, Neutro, Satisfecho y WOW.
- Edición directa de todas las celdas.
- Agregar, duplicar, mover y eliminar momentos.
- Agregar, mover y eliminar filas personalizadas.
- Modo presentación, vista ampliada, impresión/PDF y exportación CSV.
- Adjuntos por momento.

## Cómo guarda los avances

El tablero guarda automáticamente el contenido en el navegador del dispositivo que se está usando. Los adjuntos se guardan en el almacenamiento interno del mismo navegador.

Para no depender de un único equipo, usar **Guardar respaldo** al terminar cada sesión. El archivo JSON incluye el tablero y sus adjuntos. Luego puede recuperarse con **Abrir respaldo**, incluso desde otra computadora.

> Esta versión no sincroniza cambios simultáneamente entre varias computadoras. Para eso hace falta agregar una base de datos y un sistema de acceso compartido.

## Publicar desde GitHub en Render

1. Crear un repositorio nuevo en GitHub.
2. Subir todos los archivos de esta carpeta a la raíz del repositorio.
3. En Render, elegir **New > Blueprint** y conectar el repositorio.
4. Render detectará `render.yaml` y creará el sitio estático.
5. Mantener el mismo sitio y dominio para conservar el guardado local en los navegadores que ya lo usaron.

También puede crearse como **Static Site** manualmente usando:

- Build command: `echo "Static site ready"`
- Publish directory: `.`

## Uso local

Se puede abrir `index.html` directamente en un navegador moderno. Para una experiencia idéntica a Render, conviene servir la carpeta con un servidor estático local.

## Archivos

- `index.html`: estructura de la aplicación.
- `styles.css`: diseño y vistas responsive/impresión.
- `app.js`: edición, curva emocional, guardado y exportaciones.
- `render.yaml`: configuración automática para Render.
- `assets/favicon.svg`: ícono del sitio.
