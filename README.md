# Four Makeup · Taller de Automaquillaje

Link para WhatsApp: https://tefaltauno.github.io/four-makeup/

Página estática (HTML/CSS/JS sin dependencias, con CSP estricta y fuentes propias).

## Archivos
- `index.html` — estructura y textos (fechas, contactos, preguntas).
- `style.css` — diseño y animaciones (colores en `:root`).
- `script.js` — intro, logo 3D, carrusel de reels, galería con filtros y visor, tarjetas que giran,
  cuenta regresiva y reserva por WhatsApp con vista previa del mensaje.
- `data.js` — lista de fotos y reels de la galería (para sumar uno, copiá un renglón).
- `media/` — fotos (`.webp`) y reels (`.mp4` H.264 con sonido) de @sj.makeup.beauty y @makeup.by.augusto;
  `hero-loop.mp4` es el video de portada.
- `fonts/` — Instrument Serif y Manrope (OFL).
- `logo-four-mask.png` — "FOUR" para el logo 3D; `logo-four-makeup.png` logo completo; `og-four-makeup.jpg` vista previa de WhatsApp.

## Cambios comunes
- Números de WhatsApp: botones en `index.html` y la lista `WA` en `script.js`.
- Fechas: `data-start` en `index.html` (tarjetas y opciones del formulario). Las fechas pasadas se marcan solas.
- Después de editar, subí el `?v=` de `style.css`, `data.js` y `script.js` en `index.html`.

## Música
- `media/four-theme.mp3` es un tema original (chill pop / ambiental, 100 BPM, 38,4 s en loop), generado con `tools/four_music.py`.
- Arranca con el primer toque en la página (los navegadores no dejan que suene sola) y se pausa con el botón de abajo a la izquierda. Se baja sola cuando se abre un reel con sonido.
