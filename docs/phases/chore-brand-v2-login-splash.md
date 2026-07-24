# Chore de marca v2: login + splash + assets (dirección 8b)

### Progreso

- **Plan aprobado**, con un cambio obligatorio y una nota:
  1. **"¿Olvidaste tu contraseña?" se omite de esta fase** — un link visible
     sin flujo detrás es UI rota para quien más lo necesita. Se ajusta el
     espaciado de la hoja para que respire igual sin el link. Se anota como
     chore propio en el backlog de `PLAN_MOBILE_CERQUITA.md`: "flujo de
     recuperación de contraseña (Clerk reset por código) + restaurar el
     link". El link vuelve tal cual lo especifica el README recién cuando
     ese flujo exista.
  2. **`LoginPrimaryButton`** lleva un comentario explícito: es aparte de
     `shared/ui/Button` porque hoy la sombra plana es un momento de marca
     puntual del auth — si se extiende a más CTAs de la app, se promueve a
     variant de `Button`, no se duplica una tercera vez.
     Rama `chore-brand-v2-login-splash` creada desde `main` actualizado (con
     `chore-app-icon` y `fix-logout-unhandled-rejection` ya mergeados).
- **Checkpoint A — cerrado**: Inter 800 instalada en `~/Library/Fonts/`
  (desde el `.ttf` que ya trae `node_modules/@expo-google-fonts/inter`) +
  `fc-cache -f` — confirmado con `fc-list` y con una rasterización de
  prueba comparada visualmente contra `splash-8b-referencia.png` (match:
  tipografía, geometría, sombra). `assets/brand/` actualizado con el
  paquete v2 completo (README nuevo, `sticker-8b.svg`, `splash-8b.svg`,
  `brand-square-8b.svg`, `icon-512-maskable.svg`, 4 PNG de referencia).
  `icon-512-maskable.svg` queda solo como fuente -- sin target web/PWA en
  este repo, no se cablea. `assets/splash.png` nuevo (1080×2340, sin alfa)
  generado desde `splash-8b.svg` con la fuente resuelta;
  `assets/splash-icon.png` (interino, mark 3a) borrado. `app.config.js`:
  plugin `expo-splash-screen` apunta al nuevo asset, `imageWidth` 160→400
  (pieza full-bleed, no un glifo chico). `design_handoff_cerquita_icon/`
  borrada entera (`.dc.html` no commiteados; los wordmark PNG de la
  dirección 5a tampoco -- son un deliverable de marca aparte, no usado por
  splash/login/ícono en este chore, el propio README dice "recrearlo en
  código" para cuando haga falta). Gate: `expo config --type public`
  resuelve, `magick identify` confirma 1080×2340 sin alfa, `tsc`/lint
  limpios.
- **Checkpoint B — cerrado**: `TOKENS.md` actualizado primero
  (`color.brand.shadow` #4A32A8 nuevo, `color.surface.tint` #F4F2FB nuevo,
  `brand.soft` anotado como reusado para la ruta punteada, peso 800 +
  `type.title.lg.heavy` documentados), después `theme.ts`
  (`colors.brand.shadow`, `colors.surface.tint`, `FontWeight`/`fontFamily`
  con `'800'`→`Inter_800ExtraBold`, `typography.titleLgHeavy` 24/800 --
  `titleLg` 24/700 sin tocar, sigue usándose en 5 pantallas).
  `Inter_800ExtraBold` sumada a `useFonts()` en `app/_layout.tsx`. Gate:
  `tsc`/lint limpios.
- **Checkpoint C — cerrado**: `CerquitaSticker.tsx` (transcripción 1:1 de
  `sticker-8b.svg` a `react-native-svg`, wordmark con `SvgText` + Inter 800
  -- sin rasterizar, sin trampa de fuente en el login). `LoginHeader.tsx`
  (280px, sticker + ruta punteada derivada a mano contra la referencia --
  sin `d` exacto provisto para este contexto). `TextField` extendido con
  `variant="filled"` (opt-in, default sigue `outline`, cero cambio en el
  resto de la app -- verificado con la suite completa de auth+shared/ui,
  82/82 sin romper nada) + halo de foco, con test nuevo cubriendo el merge
  de `onFocus`/`onBlur` (react-hook-form depende de `onBlur` para
  `touched`). `LoginPrimaryButton.tsx` (sombra plana vía `View` offset,
  pressed = `translateY(3)` que revela el remanente de sombra
  automáticamente -- sin animar la sombra por separado; comentario
  dejado sobre cuándo promoverlo a variant de `Button`). `SignInScreen.tsx`
  reestructurada sobre `LoginHeader` + hoja blanca; **sin el link
  "¿Olvidaste tu contraseña?"** (correción del usuario al aprobar el plan
  -- ver Progreso). Hallazgo propio no anticipado en el plan: el header
  violeta llega hasta atrás de la status bar -- sin manejo, los íconos
  quedaban oscuros sobre violeta (invisibles). Fix con la API nativa de RN
  (`StatusBar.setBarStyle`, sin sumar `expo-status-bar` como dependencia
  nueva) vía `useFocusEffect`, revierte solo al salir de la pantalla. Gate:
  `tsc`/lint limpios, suite de `auth`+`shared/ui` 17/17 -- 82/82.
- **Checkpoint D — cerrado**: subtítulo **"Los negocios cerca de vos te
  esperan."** agregado a `SignUpScreen` (mismo tratamiento visual que ya
  usa `SignInScreen`, `bodyMd`/`color="secondary"`), sin tocar el resto del
  layout. Toast de éxito **no implementado** (pedido explícito). Sumado el
  ítem de backlog en `PLAN_MOBILE_CERQUITA.md` (recuperación de contraseña
  - restaurar el link). Confirmado `grep -rn "barrio"` vacío en todo
    `src/`/`app/`.
- **Gate de cierre de la fase, completo**: `tsc --noEmit` limpio,
  `pnpm run lint` limpio, suite completa **46/46 -- 236/236 tests**.
- **Fixes del gate visual en iOS**:
  1. **Bug real, causa confirmada** (no a ciegas): `LoginPrimaryButton`
     aplicaba el `style` del caller (`marginTop`) al `Pressable` interno,
     no al `View` externo -- eso corría el pill dentro del wrapper sin
     mover la `View` de sombra (posicionada absoluta relativa al wrapper,
     no al pill), rompiendo la alineación y dejando asomar la sombra por
     arriba ("dos pastillas apiladas"). Fix: `style` ahora entra al
     wrapper externo; pill y sombra quedan siempre alineados sin importar
     el margen que pida el caller. Tipo de `style` acotado a
     `StyleProp<ViewStyle>` (ya no acepta la variante función de
     `PressableProps`, que no aplicaba acá).
  2. **Sospecha verificada en código, con un gap real encontrado**:
     `useFocusEffect` + `StatusBar.setBarStyle` de `SignInScreen` están
     bien implementados (disparan en foco inicial, revierten en
     blur/unmount) y `UIViewControllerBasedStatusBarAppearance` ya está en
     `false` en el Info.plist generado (confirmado con un prebuild real de
     iOS, no asumido) -- precondición necesaria para que la API imperativa
     funcione. El gap real: el default **estático** de Info.plist seguía
     en `UIStatusBarStyleDefault` (oscuro), visible en la ventana entre
     que el splash nativo se oculta y JS monta+corre el efecto -- para un
     usuario deslogueado esa primera pantalla real es el login violeta.
     Fix: `app.config.js` → `ios.infoPlist.UIStatusBarStyle:
'UIStatusBarStyleLightContent'`. Esto por sí solo hubiera roto el
     caso contrario (usuario que ya estaba logueado, nunca pasa por
     `SignInScreen` -- único lugar que tocaba el status bar -- arrancaría
     con el default claro sobre pantallas blancas); se cierra sumando un
     `useEffect` de baseline (`dark-content`) en `app/(app)/_layout.tsx`,
     que se monta una sola vez por sesión autenticada.
     Gate: `tsc`/lint limpios, `expo config` resuelve el nuevo `infoPlist`,
     suite completa **46/46 -- 236/236** de nuevo.
- **Fixes del gate visual en Android + investigación**:
  1. **Bug real, causa confirmada**: `SvgText` mide el wordmark distinto en
     Android vs iOS (motores de shaping/fuente distintos por plataforma),
     así que el pin -- con una x fija copiada del master -- caía sobre la
     "t" en Android y sobre la ı en iOS. Fix de fondo (opción (a) del
     pedido, no el parche por plataforma descartado explícitamente):
     `CerquitaSticker` ya no usa `SvgText` -- el wordmark "cerquıta" se
     convirtió a contornos vectoriales (`<Path>`) extraídos directo del
     `.ttf` de Inter 800 con `fontTools` (Python, instalado en un venv
     descartable, sin tocar el sistema) usando `SVGPathPen` -- geometría
     fija, cero dependencia de cómo cada SO mide texto. De paso, el
     script devolvió el centro real de la ı (x=442.54) en vez del 438 a
     ojo del master -- el pin ahora se ancla ahí.
  2. **Bug real, causa confirmada**: el header violeta de 280px vivía en
     el slot `header` de `KeyboardAwareScreen` (fijo, fuera del
     `ScrollView`) -- en Android, sin espacio para correrlo, el teclado se
     comía el campo de contraseña y el botón. Fix: `LoginHeader` pasa a
     ser el primer hijo _adentro_ del scroll (ya no usa el slot `header`);
     puede desplazarse como el resto del contenido cuando hace falta.
     `sheet` deja de tener `flex:1` (ya no aplica dentro de un
     `ScrollView`; incluye `paddingBottom` propio) y el footer cambia
     `marginTop:'auto'` por un margen fijo -- ambos eran consecuencia
     directa de asumir que `sheet` seguía siendo el único hijo flexible de
     un contenedor no-scrolleable.
  3. **Investigación (sin tocar lógica todavía, solo visibilidad)**: el
     log `__DEV__` de `signIn.create()` vivía DESPUÉS del `if (attempt.status
=== 'complete') return`, así que el caso real de iOS (resuelve
     directo a `complete`, sin pasar por la rama "incompleto") nunca se
     veía en los logs -- solo se podía comparar la mitad de la historia.
     Se movió antes del branch, incondicional, y suma `platform: Platform.OS`
     para poder diferenciar el request de cada plataforma en la misma
     sesión de logs.
     Gate: `tsc`/lint limpios, suite completa **46/46 -- 236/236** de nuevo.
- **Fix del radio de la hoja (bug real, no la causa sospechada)**: el
  shorthand `borderRadius: '32 32 0 0'` que mencionaba el plan file **nunca
  llegó a código** -- el `sheet` ya usaba `borderTopLeftRadius`/
  `borderTopRightRadius` explícitos, sintaxis válida de RN. La causa real
  era otra: `sheet` arrancaba exactamente donde termina `LoginHeader`, sin
  superposición -- el recorte de la esquina redondeada no tenía violeta
  detrás para revelar (blanco de la curva sobre blanco del fondo de
  pantalla), invisible aunque el radio se aplicara perfecto. Fix:
  `marginTop: -spacing.xxxl` (-32, mismo valor que el radio) hace que
  `sheet` pise los últimos 32px del header violeta -- la curva corta
  contra violeta de verdad. `paddingTop` ya era 32 también, se cancela con
  el margen: el contenido (saludo, inputs) no se corre ni un pixel, solo
  el fondo/curva "sube" a superponerse. A verificar en tu gate: que el
  overlap no tape el borde inferior del sticker/ruta (cálculo a mano deja
  ~4px de margen, ajustado pero debería alcanzar).
- **Bug del teclado, segunda vuelta -- diagnóstico verificado esta vez, no
  a ciegas**: el primer intento (mover `LoginHeader` adentro del scroll)
  era necesario pero no alcanzaba. Causa raíz real, confirmada contra
  fuentes externas actuales (no memoria de entrenamiento posiblemente
  desactualizada) y contra un prebuild real de Android (no la doc):
  `windowSoftInputMode="adjustResize"` está seteado (confirmado en el
  manifest generado), pero es una **incompatibilidad documentada** del
  ecosistema RN: con edge-to-edge activo (default de este proyecto desde
  SDK 55+), `adjustResize` deja de redimensionar la ventana de forma
  confiable. `KeyboardAwareScreen` tenía `behavior={undefined}` en
  Android (`behavior` solo aplicaba `'padding'` en iOS) -- sin ese
  mecanismo nativo funcionando, Android no tenía NINGÚN mecanismo de
  reacción al teclado, ninguno. Fix, en `src/shared/ui/KeyboardAwareScreen.tsx`
  (compartido, cero cambio nuevo por pantalla): `behavior="padding"` en
  ambas plataformas -- engancha el listener propio de `Keyboard` de RN en
  vez de depender del resize nativo roto. Se suma `keyboardVerticalOffset`
  como prop opcional pass-through (sin default hardcodeado, ninguna
  pantalla lo necesita hoy -- todas con `headerShown:false`, sin header
  nativo de navegación que desalinee el cálculo) para que una pantalla
  puntual lo ajuste sola si algún día hace falta, sin hornearlo en el
  wrapper compartido.
  - **Efecto esperado, para tu verificación explícita**: como el wrapper
    es compartido, `checkout`/direcciones probablemente tenían el MISMO
    bug latente en Android (menos visible ahí por formularios más cortos
    sin un header de 280px comiéndose la pantalla) -- este fix debería
    arreglarlas también, no solo login. Parte del criterio de aceptación
    ("sin regresión en checkout/direcciones") es justamente confirmar que
    mejoraron o quedaron igual, nunca peor.
    Gate: `tsc`/lint limpios, suite completa **46/46 -- 236/236** de nuevo
    (afectados: `KeyboardAwareScreen`, `auth`, `checkout`).
- Pendiente tu re-verificación visual completa (login en ambas
  plataformas -- incluido el teclado tapando/no tapando el campo de
  contraseña en checkout/direcciones también --, Crear cuenta, splash --
  este último requiere rebuild nativo) y los logs de la investigación del
  segundo factor antes de push + PR.

## Context

El handoff v1 (`chore-app-icon`, ya mergeado) solo cubría el ícono de la
app. Este paquete v2, entregado en `design_handoff_cerquita_icon/` (raíz),
agrega la dirección **8b** ("sticker + ruta punteada") para splash y una
pieza de marca reutilizable, más la spec completa del rediseño de Login.
El README nuevo reemplaza al viejo — es la fuente de verdad, leído entero
antes de planear.

**Los 3 SVG del glifo del ícono (`icon-1024`/`icon-adaptive-foreground`/
`icon-monochrome`) son BYTE-IDÉNTICOS a la v1** (diff vacío, verificado) —
no se toca nada de `icon.png`/`adaptive-icon*.png`/`notification-icon.png`,
ya están correctos y no se regeneran. Lo nuevo real: `sticker-8b.svg`,
`splash-8b.svg`, `brand-square-8b.svg`, `icon-512-maskable.svg`, PNG de
referencia, y la spec de Login.

## Hallazgo propio — trampa de fuente confirmada (no supuesta)

`fc-list | grep -i inter` en esta máquina → **vacío**: el sistema (macOS, lo
que usa `librsvg`/Pango para rasterizar) no tiene Inter instalada, aunque el
`.ttf` de Inter 800 SÍ existe en
`node_modules/@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf`
(el que carga la app vía `expo-font`, un sistema de fuentes completamente
distinto al del rasterizador). Sin resolver esto, rasterizar `splash-8b.svg`
tal cual (su `<text>` no trae `font-family`) cae a un fallback sans-serif
genérico — texto visualmente distinto a la referencia.

**Plan de verificación** (primer paso de implementación, antes de generar
ningún asset final):

1. Instalar el `.ttf` de Inter 800 (ya presente en `node_modules`) en
   `~/Library/Fonts/` (nivel usuario, sin `sudo`) + `fc-cache -f`.
2. Confirmar con `fc-list | grep -i inter` que ahora aparece.
3. En una copia de trabajo (no el master committeado), inyectar
   `font-family="Inter" font-weight="800"` al `<text>` antes de rasterizar
   (los masters no declaran family — se preserva el master tal cual se
   entregó, fidelidad exacta, el ajuste vive solo en el paso de build).
4. Rasterizar y comparar visualmente contra `splash-8b-referencia.png` antes
   de dar el asset por bueno. Si la métrica no coincide, mandan las
   referencias PNG (regla explícita del README) — ajustar la fuente/pipeline,
   no el resultado esperado.

## Checkpoint A — Assets v2 + splash

- `assets/brand/`: reemplazar `README.md`, sumar `sticker-8b.svg`,
  `splash-8b.svg`, `brand-square-8b.svg`, `icon-512-maskable.svg` y los 4 PNG
  de referencia (`splash-8b-referencia.png`, `brand-square-8b-referencia.png`,
  `sticker-final-referencia.png`, `login-final-referencia.png` — comparación,
  no producción, igual criterio que ya usa la carpeta). Los `.dc.html` NO se
  commitean; borrar `design_handoff_cerquita_icon/` entera al final.
- `icon-512-maskable.svg`: **no se cablea** en `app.config.js` — este repo es
  la app mobile (Expo, sin target web/PWA activo). Queda como fuente en
  `assets/brand/` para cuando/si haga falta, anotado como gap de alcance, no
  implementado a ciegas.
- `assets/splash.png` (nuevo, reemplaza `assets/splash-icon.png` interino de
  mark 3a): rasterizado desde `splash-8b.svg` con la fuente resuelta (arriba).
  `app.config.js` → plugin `expo-splash-screen`: `image` apunta al nuevo
  archivo; `imageWidth` sube de 160 (glifo chico) a un ancho que llene la
  pantalla en modo `contain` — el arte es full-bleed 1080×2340 (aspect ratio
  ~0.4615, casi idéntico al de un iPhone estándar en puntos). Con
  `backgroundColor` del plugin = `#6C4CF1` (ya está) el letterboxing de
  `contain` es invisible en cualquier aspect ratio.
- Borrar `assets/splash-icon.png` (interino, ya no se referencia).
- Gate: `npx expo config --type public` (paths resuelven) + `magick
identify` (dimensiones/alpha del nuevo PNG) + comparación visual mía (Read
  del PNG generado) contra la referencia antes de seguir.

## Checkpoint B — Tokens nuevos (`docs/design/TOKENS.md` → `theme.ts`)

Reconciliación contra los tokens ya documentados (no duplicar por variación
mínima; agregar solo lo que es genuinamente nuevo):

| Valor del handoff                       | Token existente más cercano                                                                     | Decisión                                                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#8A70F5` (ruta punteada)               | `brand.soft` `#8A6FF4`                                                                          | **Reusar** `brand.soft` — diferencia de 1 unidad en un canal, ruido de muestreo                                                                     |
| `#1E1633` (texto saludo)                | `text.primary` `#241C19`                                                                        | **Reusar** `text.primary` — diferencia imperceptible a estos tamaños                                                                                |
| `#8B84A0` (texto muted)                 | `text.secondary` `#9A9A9A`                                                                      | **Reusar** `text.secondary` — evita bifurcar el sistema de texto secundario                                                                         |
| `#F4F2FB` (fondo de input)              | ninguno (`brand.tint` `#EDE9FC` es semánticamente distinto: acento de ícono, no fondo de campo) | **Nuevo**: `surface.tint`                                                                                                                           |
| `#4A32A8` (sombra plana)                | `brand.dark` `#3B2A9E` (distinto, no sirve)                                                     | **Nuevo**: `brand.shadow`                                                                                                                           |
| Peso 800 (saludo 24px, wordmark, botón) | nada — la escala llega a 700                                                                    | **Nuevo**: soporte de peso `800` en `theme.ts` + variante `titleLgHeavy` (24px/800; `titleLg` existente 24px/700 sigue igual, usado en 5 pantallas) |

- `app/_layout.tsx`: sumar `Inter_800ExtraBold` a `useFonts()`.
- Actualizar `TOKENS.md` primero (según su propio contrato: "cambio se hace
  ahí primero, `theme.ts` después"), después `theme.ts`.
- Gate: `tsc --noEmit` + tests afectados si los hay.

## Checkpoint C — Login

- **`LoginHeader`** (`src/features/auth/components/`, nuevo): violeta 280px,
  `edges={['bottom']}` en `KeyboardAwareScreen` (el header maneja su propio
  inset con `useSafeAreaInsets()`). Compone:
  - **Sticker**: transcripción 1:1 de `sticker-8b.svg` a `react-native-svg`
    — **no rasterizado**. Wordmark con `<SvgText>` + `Inter_800ExtraBold`
    (evita la trampa de fuente por completo para el login). `viewBox 0 0
640 320`, escalado ≈0.44× (font 28px), offset óptico +26/+34 desde el
    centro del header.
  - **Ruta punteada**: sin `d` exacto provisto para este contexto — derivada
    a mano contra `login-final-referencia.png` (permitido explícitamente
    por el pedido). `stroke={brand.soft}`, width 4.5, `dasharray "0.5 13"`,
    `width="100%"` para estirar con el dispositivo.
- **`TextField`** (`shared/ui`, extendido): nuevo prop opcional `variant?:
'outline' | 'filled'` (default `'outline'`, cero cambio visual en el
  resto de la app). `'filled'`: sin borde, fondo `surface.tint`, foco con
  halo + borde `brand.default` (onFocus/onBlur mergeados con los que ya
  pasa react-hook-form).
- **`LoginPrimaryButton`** (`src/features/auth/components/`, nuevo — no se
  toca `shared/ui/Button`): pill, sombra plana vía `View` offset (no shadow
  nativo difuminado), pressed = `translateY(3px)` + sombra a `0 1px`.
  Comentario en el componente: aparte de `Button` porque hoy es un momento
  de marca puntual del auth — si el estilo se extiende a más CTAs, se
  promueve a variant de `Button` en vez de duplicarse una tercera vez.
- **`SignInScreen.tsx`**: reestructurada sobre `LoginHeader` + hoja blanca
  (`borderRadius: '32 32 0 0'`) con saludo (`titleLgHeavy`) + subtítulo
  **"Todo lo que querés, cerquita."** (FINAL) + inputs `filled` +
  `LoginPrimaryButton` + footer existente sin cambios. **Sin** el link
  "¿Olvidaste tu contraseña?" (omitido esta fase — ver Progreso; el
  espaciado entre el bloque de inputs y el botón se ajusta para que la
  hoja respire igual sin ese link). `SocialSignInButtons` queda intacto.
- `PLAN_MOBILE_CERQUITA.md` (Backlog post-MVP): sumar "flujo de recuperación
  de contraseña (Clerk reset por código) + restaurar el link '¿Olvidaste
  tu contraseña?' del login, omitido en este chore".

Gate: `tsc --noEmit` + lint + tests afectados.

## Checkpoint D — Crear cuenta (solo copy)

**No se toca el layout de `SignUpScreen`.** Se agrega el subtítulo pedido,
**"Los negocios cerca de vos te esperan."**, bajo el título "Crear cuenta"
existente (mismo tratamiento que ya usa `SignInScreen`:
`bodyMd`/`color="secondary"`). El toast de éxito sugerido por el README
**no se implementa** (presume un pedido que puede no existir).

## Verificación

- Automática (mía): `tsc --noEmit`, lint, tests afectados por checkpoint;
  suite completa como gate de cierre.
- Visual (tuya, dispositivo, ambas plataformas): login completo (header con
  sticker + ruta, hoja blanca, inputs con foco, botón con sombra/pressed),
  Crear cuenta con el subtítulo nuevo, social login (Google + Apple en iOS)
  intacto, y el splash nuevo (**requiere rebuild nativo** — no llega con
  reload de Metro; comandos de EAS al cerrar, no los corro yo).

## Archivos clave

Nuevos: `src/features/auth/components/LoginHeader.tsx`,
`src/features/auth/components/LoginPrimaryButton.tsx`, `assets/splash.png`,
este archivo.
Editados: `assets/brand/*`, `app.config.js`, `docs/design/TOKENS.md`,
`src/shared/ui/theme.ts`, `src/shared/ui/TextField.tsx`, `app/_layout.tsx`,
`src/features/auth/screens/SignInScreen.tsx`,
`src/features/auth/screens/SignUpScreen.tsx`, `PLAN_MOBILE_CERQUITA.md`
(backlog: recuperación de contraseña).
Borrados: `design_handoff_cerquita_icon/`, `assets/splash-icon.png`.

## Git

Rama `chore-brand-v2-login-splash`, desde `main` actualizado. Commits
convencionales, probablemente uno por checkpoint dado el tamaño. PR propio.
Push y PR solo con confirmación explícita del usuario — nada de `git
push`/`eas build` de mi parte.
