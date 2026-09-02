# Volare Journey Map · tablero compartido

Esta carpeta está lista para subir a GitHub y desplegar en Render.

## Activar la memoria compartida (una sola vez)

1. Entrar en el proyecto de Supabase.
2. En el menú izquierdo, abrir **SQL Editor**.
3. Presionar **New query**.
4. Abrir el archivo `supabase-setup.sql` de esta carpeta.
5. Copiar todo su contenido y pegarlo en Supabase.
6. Presionar **Run**.
7. Debe aparecer el mensaje **Success. No rows returned**.

## Publicar la nueva versión

1. En GitHub, reemplazar el contenido del repositorio por estos cuatro archivos.
2. Esperar a que Render termine el despliegue automático.
3. Abrir el sitio de Render y hacer una recarga forzada:
   - Windows: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

## Cómo comprobar que funciona

1. Escribir una palabra en el tablero.
2. Esperar hasta ver **Guardado compartido** abajo a la izquierda.
3. Abrir el mismo enlace en una ventana privada o en otro dispositivo.
4. La palabra debe aparecer también allí.

El tablero usa un único documento compartido llamado `volare-main`. No requiere usuarios ni contraseñas. Cualquier persona que tenga el enlace puede ver y editar el contenido.

