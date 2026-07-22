# Design Tokens — Cerca (customer app)

Extraídos de `docs/design/Cerca.dc.html` (prototipo importado de Claude
Design, proyecto `Prototipo móvil Cerca marketplace`). Este documento es la
fuente para el theme de React Native (`src/shared/ui/theme.ts` o el archivo
que defina la Fase 0) — el prototipo es HTML/web, estos valores son el QUÉ
(colores/tipografía/espaciado/radios); la implementación los traduce a
`StyleSheet`/tokens de RN, no copia CSS.

Los valores del prototipo eran puntuales (ej. `border-radius` con 15
valores distintos entre 4px y 24px). Acá quedan consolidados en una escala
coherente para que el theme no tenga 15 constantes sin relación entre sí.
Donde un valor del prototipo no entra limpio en la escala, se indica.

## Color

### Marca (primario)
| Token | Hex | Uso en el prototipo |
|---|---|---|
| `color.brand.default` | `#6C4CF1` | CTA primario, links, ícono de marca |
| `color.brand.pressed` | `#573BD1` | hover/pressed de links y CTAs |
| `color.brand.dark` | `#3B2A9E` | texto/ícono sobre `brand.tint`, énfasis fuerte |
| `color.brand.tint` | `#EDE9FC` | fondo de íconos con acento de marca (chips, avatares de categoría) |
| `color.brand.tintStrong` | `#C3B8F0` | variante más saturada de `tint`, uso puntual |
| `color.brand.soft` | `#8A6FF4` | variante clara del primario, uso puntual |

### Superficie y fondo
| Token | Hex | Uso |
|---|---|---|
| `color.surface.default` | `#FFFFFF` | tarjetas, inputs, hojas |
| `color.surface.subtle` | `#F7F7F7` | fondo de pantalla (checkout, listas) |
| `color.surface.warm` | `#F4F1EE` | fondo de login/register (contenedor exterior) |
| `color.surface.mutedAlt` | `#F1F1F1` / `#F0F0F0` | variantes puntuales de fondo gris — consolidar en `surface.subtle` salvo que un componente necesite distinguirse |

### Texto
| Token | Hex | Uso |
|---|---|---|
| `color.text.primary` | `#241C19` | texto principal |
| `color.text.secondary` | `#9A9A9A` | texto secundario, placeholders, metadata |
| `color.text.onBrand` | `#FFFFFF` | texto sobre fondo de marca |

### Bordes / separadores
| Token | Hex | Uso |
|---|---|---|
| `color.border.default` | `#EEEEEE` | bordes de cards/inputs |
| `color.border.strong` | `#DDDDDD` / `#C9C9C9` | bordes con más contraste (inputs enfocados sin usar color de marca, dividers) |

### Estado / semántico
| Token | Hex | Uso |
|---|---|---|
| `color.success.default` | `#2F7D48` | texto/ícono de éxito (ej. "Entregado") |
| `color.success.bg` | `#E7F1E9` / `#EAF0EA` | fondo de badge de éxito |
| `color.danger.default` | `#D14343` | error, cancelar, destructivo |

### Overlays (rgba, no hex — para glass/scrims del prototipo iOS)
- `rgba(0,0,0,.04..20)` — sombras y scrims sutiles sobre superficie clara.
- `rgba(255,255,255,.18..92)` — glass/blur sobre imágenes o headers con foto.

Nota: el frame `ios-frame.jsx` (liquid glass, dynamic island, teclado) es
chrome del dispositivo para el prototipo — **no se traduce a componentes
RN**, el propio SO ya lo provee.

## Tipografía

Familia: **Inter** (400, 500, 600, 700) vía Google Fonts en el prototipo.
En RN: `expo-font` + `@expo-google-fonts/inter` (o embebida como asset),
nunca cargada por link externo.

Escala observada (11–28px) consolidada en una escala de tipo con nombres
semánticos:

| Token | px | Peso dominante | Uso |
|---|---|---|---|
| `type.caption` | 11 | 600 | metadata mínima (badges pequeños) |
| `type.footnote` | 12 | 600 | labels de campo, metadata secundaria |
| `type.body.sm` | 13 | 600 | texto secundario de cards |
| `type.body.md` | 14 | 600 | texto de cuerpo estándar |
| `type.body.lg` | 15 | 600 | texto de cuerpo destacado, items de lista |
| `type.subtitle` | 16–17 | 600/700 | subtítulos de sección |
| `type.title.sm` | 18 | 700 | títulos de card/modal |
| `type.title.md` | 20–22 | 700 | headers de pantalla |
| `type.title.lg` | 24–26 | 700 | totales, montos destacados |
| `type.display` | 28 | 700 | pantallas de bienvenida/estado vacío |

Pesos: el prototipo usa casi exclusivamente **600 y 700** (133 y 72
ocurrencias respectivamente) — la UI es "bold-first", casi no hay 400/500.
El theme de RN debe default a 600 para texto de cuerpo, no 400.

## Radios

Consolidados en una escala de 5 pasos (el prototipo tenía 15 valores
puntuales entre 4 y 24px, más `9999` para pills):

| Token | px | Uso |
|---|---|---|
| `radius.sm` | 8 | chips pequeños, inputs compactos |
| `radius.md` | 12 | inputs, botones secundarios |
| `radius.lg` | 14 | cards estándar (el valor más frecuente, 35 ocurrencias) |
| `radius.xl` | 16–18 | cards grandes, hojas (bottom sheets), modales |
| `radius.full` | 9999 | pills, avatares, badges circulares |

## Espaciado

El prototipo no expone una escala explícita de spacing (todo es px
puntual en `padding`/`gap`), pero los valores predominantes en paddings de
pantalla y gaps de lista siguen un patrón de base 4 razonablemente
consistente. Escala recomendada para el theme RN:

`spacing.xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, xxxl=32`

`16px` es el padding horizontal de pantalla dominante en el prototipo
(headers, listas, contenido) — usar como `spacing.screenPadding`.

## Pantallas cubiertas por el diseño (scope customer)

Login, Register, Home, Search, Business Catalog (detalle de negocio +
menú), Product Detail, Cart, Checkout, Orders (historial), Tracking,
Profile. (El bundle también incluye pantallas de owner/admin y un chooser
de rol — **fuera de alcance de esta app**, no se traducen.)

Notas de UX observadas en el prototipo, relevantes para la Fase de
Checkout: la dirección de entrega en el checkout se selecciona de una
lista de direcciones guardadas ("Mis direcciones"), con el texto "Pin GPS
confirmado" como metadata — confirma el flujo de captura por GPS decidido
para la Fase 4 (ver `PLAN_MOBILE_CERQUITA.md`). El prototipo no incluye
una pantalla de alta/edición de dirección con mapa — esa pantalla se
diseña en la Fase 4 siguiendo los mismos tokens, no está en el bundle.
