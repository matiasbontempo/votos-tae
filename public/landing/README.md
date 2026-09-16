# Landing

Archivos de la landing de la obra (`/`).

## El lettering del título

Poné el lettering del flyer acá como **`wordmark`**, con la extensión que
tengas: `.svg`, `.png`, `.webp`, `.avif` o `.jpg`. Se toma el primero que
aparezca en ese orden. Con eso alcanza: el hero y la imagen que se ve al
compartir el link lo usan solos, y las medidas salen del propio archivo.

- **Con fondo transparente.** La página es negra; un fondo blanco se ve.
- **Ancho de sobra**, 1600 px o más si es mapa de bits. Se muestra hasta a
  820 px y en pantallas retina eso son 1640.
- **No hace falta comprimirlo**: Next lo reescala y lo sirve en AVIF o WebP,
  del tamaño que pida cada pantalla.

Mientras el archivo no esté, el título se compone con la tipografía de la
página, a imitación del flyer. No hay que tocar código en ningún caso.

Los textos, fechas y links de la landing viven en `src/lib/landing-content.ts`.
