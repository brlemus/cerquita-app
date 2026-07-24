# Handoff: Icono de app "Cerquita" (dirección 3a)

## Overview

Icono de app para **Cerquita**, marketplace de delivery local. Dirección elegida: **3a — "la pareja, con estás acá"**: una casita y un pin de ubicación inclinándose con afecto uno hacia el otro, casi tocándose; la casita lleva adentro un punto sólido ("estás acá"). El pequeño espacio entre ambas formas es el punto focal.

## About the Design Files

Los archivos de este paquete son **referencias de diseño creadas en HTML/SVG** — no código de producción. La tarea es **integrar estos assets en el proyecto real** (Android Studio / Xcode / web manifest) siguiendo los pipelines de iconos de cada plataforma. Los SVG son los masters vectoriales; rasterizá desde ellos.

## Fidelity

**High-fidelity.** Geometría, color y trazos son finales. Reproducir exactamente; no re-dibujar a ojo.

## Assets incluidos — LOS 4 ICONOS (deliverable principal)

| Archivo                        | Uso                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `icon-1024.svg`                | 1. Icono completo: glifo blanco sobre fondo sólido #6C4CF1. Exportar a PNG 1024×1024 para App Store / Play Store.              |
| `icon-adaptive-foreground.svg` | 2. Capa foreground del adaptive icon de Android (glifo blanco sobre transparente). La capa background es color sólido #6C4CF1. |
| `icon-monochrome.svg`          | 3. Capa monochrome (Android 13+ themed icons / icono de notificaciones). Glifo blanco sobre transparente; el sistema lo tiñe.  |
| `icon-512-maskable.svg`        | 4. PWA/web: exportar a PNG 512×512 y 192×192, `purpose: "any maskable"` (el glifo ya respeta la safe zone).                    |

### Brand extra (NO es el icono de app)

| Archivo                                             | Uso                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wordmark-5a-violeta.png` / `wordmark-5a-claro.png` | Lockup «cerquita» (dirección 5a): wordmark Inter ExtraBold minúsculas donde el punto de la «i» es el pin de la marca. Para splash, headers y marketing. Recrearlo en código: texto "cerqu" + "ı" (i sin punto, U+0131) + "ta", con el pin (teardrop sólido `M 0 8 C -3.5 3.5 -5 1.5 -5 -1 A 5 5 0 1 1 5 -1 C 5 1.5 3.5 3.5 0 8 Z`) posicionado sobre la ı. El icono de app NUNCA lleva texto. |
| `Cerquita Icon.dc.html`                             | Canvas de exploración completo; icono elegido = tarjeta 3a, lockup elegido = tarjeta 5a.                                                                                                                                                                                                                                                                                                      |

## Geometría exacta (viewBox 0 0 100 100)

Glifo = 3 elementos, todos blancos (#FFFFFF), trazos redondeados (`stroke-linecap/linejoin: round`), sin degradados ni sombras:

1. **Casita** — grupo `translate(34 52) rotate(7)`:
   - Path `M -10.5 11 L -10.5 -3 L 0 -11.5 L 10.5 -3 L 10.5 11 Z`, `fill:none`, `stroke-width:8`.
   - Punto interior: círculo `cx 0, cy 3.5, r 4`, relleno sólido.
2. **Pin (gota)** — grupo `translate(67 49) rotate(-9)`:
   - Path `M 0 15 C -7 6.5 -10.5 2 -10.5 -3 A 10.5 10.5 0 1 1 10.5 -3 C 10.5 2 7 6.5 0 15 Z`, `fill:none`, `stroke-width:8.5`.

El conjunto cabe dentro de un círculo de diámetro 66 centrado en (50,50) → cumple la **safe zone del 66%** del adaptive icon de Android sin ajustes.

## Design Tokens

- Violeta de marca: **#6C4CF1** (exacto, único color de fondo)
- Glifo: **#FFFFFF**
- Sin texto en el icono. Tipografía de la app: Inter, bold-first (no aplica al icono).

## Export / Integración

- **Android adaptive icon**: `ic_launcher.xml` con `<background>` = color `#6C4CF1`, `<foreground>` = vector drawable derivado de `icon-adaptive-foreground.svg`, `<monochrome>` = derivado de `icon-monochrome.svg`. Importar los SVG vía Android Studio → Vector Asset.
- **iOS**: rasterizar `icon-1024.svg` a PNG 1024×1024 (sin alpha) para el AppIcon set; Xcode genera el resto de tamaños.
- **Web/PWA**: PNG 512 y 192 desde `icon-1024.svg`; `icon-adaptive-foreground.svg` sirve como `maskable` con background #6C4CF1.
- Verificar legibilidad a 24px (ya validada en el canvas: tarjeta 3a, tiles 48px/24px).

## Files

- `Cerquita Icon.dc.html` — exploración completa con las 3 vistas por dirección (grande + safe zone, 48px, 24px, monocromo).

## Splash & pieza de marca — dirección 8b (sticker + ruta)

### Composición

El artwork es UNA unidad: sticker + ruta punteada posicionada **relativa al sticker** (la ruta entra por el borde superior de la composición y llega cerquita del borde superior derecho del sticker). Nunca anclar la ruta a las esquinas de la pantalla: el splash se renderiza como imagen centrada (modo **contain**) sobre fondo #6C4CF1 y debe sobrevivir cualquier aspect ratio.

### Assets

| Archivo                                                       | Uso                                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `splash-8b.svg`                                               | Splash vertical 1080×2340, fondo sólido incluido. Renderizar centrado, contain, con background color #6C4CF1 rellenando el resto de la pantalla. |
| `brand-square-8b.svg`                                         | Formato cuadrado 1080×1080 (stores, screenshots, redes). Misma composición adaptada.                                                             |
| `sticker-8b.svg`                                              | El sticker solo (con su sombra plana), sobre transparente — asset de marca reutilizable (canvas local 640×320).                                  |
| `splash-8b-referencia.png` / `brand-square-8b-referencia.png` | Referencias raster pixel-true tomadas del diseño vivo (tarjeta 8b del canvas). Ante cualquier duda de métrica, mandan estas.                     |

### Especificación exacta del sticker (canvas local 640×320)

Todo dentro de `<g transform="rotate(-5 320 160)">` — **inclinación -5°**:

- **Pastilla**: rect 420×142 en (150,90), rx 71, blanco; **sombra plana** = mismo rect offset **+17,+17** en **#4A32A8** (sin blur).
- **Wordmark COMPLETO (regla dura)**: Inter ExtraBold (800) 64px, letter-spacing -0.02em, fill #6C4CF1, texto `cerquıta` (con **ı sin punto**, U+0131), baseline (255, 184). Las 8 letras se leen siempre — el badge nunca pisa la «c».
- **Pin de la «i»**: teardrop sólido `M 0 8 C -3.5 3.5 -5 1.5 -5 -1 A 5 5 0 1 1 5 -1 C 5 1.5 3.5 3.5 0 8 Z` en `translate(438 121) scale(2.35)`, fill #6C4CF1 — flota sobre la ı con micro-espacio.
- **Badge (el pin que asoma)**: cuadrado 138×138 rx 42 en (47,92), #6C4CF1 con borde blanco de 10, rotado +8° extra; **solape mínimo**: pisa solo el borde izquierdo de la pastilla (borde derecho del badge en x≈185; el texto empieza en x=255). Sombra plana +12,+12 #4A32A8; adentro el glifo 3a escalado 1.18.
- **Ruta punteada**: stroke **#8A70F5** (tono sobre tono), width 11, `stroke-linecap:round`, `stroke-dasharray:1 32`.

### Reglas

- Paleta estricta: #6C4CF1, #FFFFFF, sombra #4A32A8, ruta #8A70F5. Sin degradados, sin estrellas/destellos, sin blur.
- Los SVG usan `<text>` con Inter: para render fiel, tener **Inter 800** disponible (o convertir el texto a contornos en producción). Las referencias PNG muestran el resultado esperado.
- El launcher icon NO es esta pieza: sigue siendo el glifo 3a (los 4 iconos de la sección anterior).

## Login — spec de implementación (referencia, no código de producción)

Frame aprobado: header violeta + hoja blanca. Referencia pixel-true: `login-final-referencia.png` (y `sticker-final-referencia.png` para el sticker corregido). Mapear colores/espaciados a los tokens de `docs/design/TOKENS.md` del repo mobile; nombres sugeridos entre paréntesis — si el token existe con otro nombre, manda TOKENS.md.

### Header violeta (`color.brand` = #6C4CF1)

- Alto: **280px** desde el top del viewport (incluye status bar), flex centrado.
- **Sticker**: la composición master a escala **font 28px** (≈0.44× del canvas local); offsets ópticos: +26px a la derecha, +34px abajo del centro del header (compensan badge y pin).
- **Ruta punteada** (`color.brand.route` = #8A70F5): stroke 4.5, `dasharray 0.5 13`, linecap round; entra por el borde izquierdo (~y 84) y llega cerca del borde superior derecho del sticker. Anclada al header, no a la pantalla.

### Hoja blanca (`surface.base` = #FFFFFF)

- `border-radius: 32px 32px 0 0`, padding `32px 24px 0` (`space.8 space.6`), ocupa el resto del viewport.
- **Saludo**: "¡Hola de nuevo!" — Inter 800, 24px, `color.text` #1E1633, letter-spacing -0.02em.
- **Subtítulo (copy FINAL)**: "Todo lo que querés, cerquita." — Inter 500, 14px, `color.text.muted` #8B84A0, gap 4px bajo el saludo.
- **Inputs**: label Inter 700 13px #1E1633; campo 16px #1E1633, padding 14px 16px, radius 14px, fondo `surface.tint` #F4F2FB, sin borde (focus: borde #6C4CF1 + halo rgba(108,76,241,0.15)); gap entre campos 16px; bloque a 26px del subtítulo.
- **Link "¿Olvidaste tu contraseña?"**: Inter 600 13px, `color.brand`, alineado a la derecha.
- **Botón primario**: pill (radius 99px), fondo `color.brand`, texto Inter 800 16px blanco, min-height 54px, **sombra plana** `0 4px 0 #4A32A8` (`color.brand.shadow`); pressed: se hunde (translateY 3px, sombra 0 1px). A 24px del link.
- **Footer**: "¿No tenés cuenta?" Inter 500 14px #8B84A0 + "Crear cuenta" Inter 700 14px `color.brand`.

### Copy (regla del proyecto: la palabra "barrio" NO se usa en ningún texto de la app)

- Login — subtítulo FINAL: **"Todo lo que querés, cerquita."**
- Crear cuenta — sugerido equivalente: título "¡Bienvenido!" (o "Creá tu cuenta"), subtítulo **"Los negocios cerca de vos te esperan."**
- Toast de éxito del login: "¡Hola de nuevo! Tu pedido te espera."
