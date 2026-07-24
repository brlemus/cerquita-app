# Handoff: Icono de app "Cerquita" (dirección 3a)

## Overview

Icono de app para **Cerquita**, marketplace de delivery local. Dirección elegida: **3a — "la pareja, con estás acá"**: una casita y un pin de ubicación inclinándose con afecto uno hacia el otro, casi tocándose; la casita lleva adentro un punto sólido ("estás acá"). El pequeño espacio entre ambas formas es el punto focal.

## About the Design Files

Los archivos de este paquete son **referencias de diseño creadas en HTML/SVG** — no código de producción. La tarea es **integrar estos assets en el proyecto real** (Android Studio / Xcode / web manifest) siguiendo los pipelines de iconos de cada plataforma. Los SVG son los masters vectoriales; rasterizá desde ellos.

## Fidelity

**High-fidelity.** Geometría, color y trazos son finales. Reproducir exactamente; no re-dibujar a ojo.

## Assets incluidos

| Archivo                        | Uso                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `icon-1024.svg`                | Icono completo: glifo blanco sobre fondo sólido #6C4CF1. Exportar a PNG 1024×1024 para App Store / Play Store.                 |
| `icon-adaptive-foreground.svg` | Capa foreground del adaptive icon de Android (glifo blanco sobre transparente). La capa background es un color sólido #6C4CF1. |
| `icon-monochrome.svg`          | Capa monochrome (Android 13+ themed icons / icono de notificaciones). Glifo blanco sobre transparente; el sistema lo tiñe.     |
| `Cerquita Icon.dc.html`        | Canvas de exploración completo (7 direcciones); la elegida es la tarjeta con badge 3a.                                         |

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
