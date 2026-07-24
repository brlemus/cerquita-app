# Chore "feedback de Lili"

**Estado**: Planificado, no iniciado.

## Contexto

Feedback de uso real de la app: (1) el tracking de pedidos muestra el
stepper de estado pero no qué se pidió — el usuario tiene que volver a la
pantalla de confirmación (si la encuentra) para ver el detalle; (2) los
links de texto (no botones) no dan señal visual al tocarlos, así que el
usuario duda y toca dos veces. Dos puntos independientes, un checkpoint
cada uno.

Verificado con dos exploraciones completas (no supuesto):

- **Punto 1**: todos los datos del detalle (`items`, `subtotalCents`,
  `deliveryFeeCents`, `totalCents`, `addressLine`, `instructions`,
  `paymentMethod`, `businessName`, `logoUrl`) ya están en `Order` — cero
  backend nuevo, cero query nueva. `OrderTrackingScreen` hoy solo lee
  `id`/`businessId`/`status`/`etaMinutes`/`review` de `order`, e incluso
  hace un `useBusiness(order.businessId)` **redundante** solo para el
  nombre del negocio (`order.businessName` ya existe desde el chore
  anterior). No existe ningún componente reusable de "items + totales" —
  hay dos implementaciones inline: el resumen de `CheckoutScreen`
  (sobre `CartLine`, con acciones) y el `Row` de `OrderConfirmationScreen`
  (sobre `Order`, sin exportar, solo label/value). El segundo es
  parcialmente reusable: se extrae a un componente compartido.
- **Punto 2**: inventario exhaustivo, 52 `Pressable` + 1 `Link` en todo el
  repo. La convención de pressed que YA existe (`Button`, `QuickAddButton`,
  `ProductCard`, `BusinessCard`, `OrderRow`) es **cambio de color/fondo**,
  nunca opacidad — y opacidad ya está semánticamente ocupada por
  `disabled` (0.5) en 5 lugares. 16 links de texto puro sin pressed +
  1 `<Link>` de expo-router (que ni siquiera es un `Pressable`, es un
  `Text` con `onPress` — no soporta `pressed` de ninguna forma) + la fila
  `SettingsRow` (mismo bug, patrón de fila ya establecido en `OrderRow`).
  Ninguno de los 16 usa `style` como función — la mayoría tiene `style`
  estático o ni siquiera pasa `style`.

## Diseño

### CP1 — Detalle del pedido en tracking

**`src/features/orders/components/OrderInfoRow.tsx`** (nuevo, extraído del
`Row` local no-exportado de `OrderConfirmationScreen`): `{ label, value,
emphasized? }`, mismo layout label-izquierda/value-derecha ya usado ahí.
`OrderConfirmationScreen.tsx` pasa a importarlo en vez de definirlo local
(reuso real, no dos copias).

**`src/features/orders/components/OrderDetailCard.tsx`** (nuevo): recibe
`{ order: Order }`. Card única (`radius.xl`, `surface.subtle`, mismo
patrón que `OrderReviewCard`/`OrderConfirmationScreen`), con:
título "Detalle del pedido" (`subtitle`) → fila negocio (`AvatarFallback`
de marketplace, `uri={order.logoUrl} label={order.businessName}`, 40px,
solo si `businessName` existe) → divider → lista de items (`qty× nombre —
variante`, precio por línea, `unitPriceCents * quantity`, key
`productId|variantOptionId`) → divider → `OrderInfoRow` de Subtotal /
Envío / Total (`emphasized`) → divider → `OrderInfoRow` de Dirección /
Instrucciones (si hay) / Pago (`'Efectivo contra entrega'` para `CASH`,
único método soportado hoy).

**`OrderTrackingScreen.tsx`**: inserta `<OrderDetailCard order={order} />`
en el `ScrollView`, después del stepper (o después del hero si está
cancelado) y antes de `OrderReviewCard` — visible en cualquier estado, no
solo `ENTREGADO`. **Simplificación incluida**: elimina `useBusiness` (ya
redundante, `order.businessName` cubre lo mismo) y usa `order.businessName`
en el hero card en vez de `businessQuery.data?.name` — una sola fuente de
verdad del nombre del negocio en toda la pantalla, en vez de dos.

**Tests**: `OrderDetailCard.test.tsx` (nuevo, mismo patrón `buildOrder()`
que `OrderRow.test.tsx`) — negocio con/sin `businessName`, items con y sin
variante, totales formateados, dirección con y sin instrucciones, forma de
pago. `OrderInfoRow` no lleva test propio (trivial, ya ejercitado por el
test de arriba y por el uso existente en `OrderConfirmationScreen`).

### CP2 — Feedback de pressed en links de texto

**`src/shared/ui/PressableOpacity.tsx`** (nuevo, exportado desde
`shared/ui/index.ts`): wrapper de `Pressable` que compone `opacity: 0.6`
sobre el `style` que ya traiga el caller cuando `pressed && !disabled`
(mismo patrón `typeof style === 'function' ? style(state) : style` que ya
usa `Button.tsx`). **Deliberadamente no toca color de texto** — evita
inventar tokens `danger.pressed`/`secondary.pressed` que no existen hoy
(`colors.danger` solo tiene `default`), y evita romper los casos con texto
anidado de dos colores (`VerifyEmailScreen` "¿Email incorrecto? Volver",
`SignInScreen` "¿No tenés cuenta? Crear cuenta") o con color condicional
(`cooldown > 0 ? 'secondary' : 'brand'` en los reenvíos de código) — el
wrapper es agnóstico a qué hay adentro, es un swap de `Pressable` por
`PressableOpacity`, sin tocar la lógica de color de cada caller. Drop-in:
mismos props que `Pressable` (`PressableProps` sin modificar), así que el
cambio en cada call site es mecánico.

Por qué opacidad y no color, pese a que la convención existente en botones
es color: el color-pressed ya documentado (`colors.brand.pressed`) solo
cubre links `brand` — los `secondary`/`danger` no tienen equivalente, y
crear dos tokens nuevos + actualizar `docs/design/TOKENS.md` para esto es
más trabajo y más superficie que un solo valor de opacidad que funciona
igual para cualquier color de texto. Es un patrón **nuevo pero coherente**:
color/fondo para elementos con caja (ya resuelto), opacidad para texto
pelado (este chore).

**16 call sites — swap directo `Pressable` → `PressableOpacity`** (mecánico,
sin tocar el contenido/color del `Text` de cada uno):
`ProfileScreen.tsx` (Cerrar sesión, Eliminar mi cuenta) ·
`OrderTrackingScreen.tsx` (Cancelar pedido) ·
`VerifyEmailScreen.tsx` (Reenviar código, ¿Email incorrecto? Volver) ·
`SecondFactorScreen.tsx` (Reenviar código) ·
`CompleteNameScreen.tsx` (Cerrar sesión) ·
`CheckoutScreen.tsx` (Cambiar dirección, action del error de checkout) ·
`DeleteAccountScreen.tsx` (Ver la política de privacidad) ·
`AddressFormScreen.tsx` (Marcar como predeterminada, Eliminar dirección) ·
`LocationCaptureCard.tsx` (Actualizar con GPS, Reintentar permiso/Abrir
ajustes, Ingresar manualmente) · `OrderConfirmationScreen.tsx` (Ver
seguimiento).

**`SignInScreen.tsx`** — único `<Link>` del repo: renderiza un `Text` con
`onPress`, no soporta `pressed` de ninguna forma (confirmado en el código
de `expo-router`). Se envuelve `<Link href="..." asChild><PressableOpacity>
...</PressableOpacity></Link>` (patrón estándar de expo-router) — conserva
la navegación declarativa de `Link`, gana el feedback.

**`SettingsRow.tsx`** — no es un link de texto puro (fila con ícono +
label + chevron), pero comparte el bug. **No** usa `PressableOpacity`:
usa el patrón de fila ya establecido en `OrderRow.tsx`/`ProductCard.tsx`
(`pressed && styles.pressed`, `backgroundColor: colors.surface.subtle`) —
mismo mecanismo que las otras filas con caja del repo, consistencia con
ese patrón por sobre forzar la opacidad acá. Afecta a las 4 filas de
Perfil (Mis direcciones, Notificaciones, Privacidad, Enviar comentarios)
con un solo cambio.

**Agregado por decisión del usuario al aprobar el plan**:
`LocationCaptureCard.tsx` — "Usar mi ubicación" (`styles.primaryLink`,
fondo `brand.default`) es un mini-CTA con caja, no un link de texto puro,
pero comparte el mismo problema reportado. Se resuelve con el patrón ya
establecido de `Button.tsx` (`pressed && styles.primaryLinkPressed`,
`backgroundColor: colors.brand.pressed`), no con `PressableOpacity` — es
el mecanismo correcto para un elemento con fondo. Cuarto archivo tocado
dentro de `LocationCaptureCard.tsx` (junto a los 3 links de texto puro del
mismo componente).

**Tests**: `PressableOpacity.test.tsx` (nuevo, mismo patrón que
`Button.test.tsx`: `onPress` se dispara al tocar, no se dispara si
`disabled`). No se agrega test de estilo pressed en sí (ningún componente
con pressed del repo lo testea hoy — `OrderRow`/`ProductCard`/`BusinessCard`
tampoco — sería inventar una barra nueva de testing para este chore).

## Archivos

**Nuevos**: `src/features/orders/components/{OrderInfoRow,OrderDetailCard}.tsx`
(+ test de `OrderDetailCard`) · `src/shared/ui/PressableOpacity.tsx`
(+ test).

**Modificados**: `src/features/orders/screens/OrderTrackingScreen.tsx` ·
`src/features/checkout/screens/OrderConfirmationScreen.tsx` ·
`src/shared/ui/index.ts` · `src/features/profile/components/SettingsRow.tsx`
· los 12 archivos de los 16 call sites de texto (import + rename de tag,
`ProfileScreen.tsx`, `OrderTrackingScreen.tsx`, `VerifyEmailScreen.tsx`,
`SecondFactorScreen.tsx`, `CompleteNameScreen.tsx`, `CheckoutScreen.tsx`,
`DeleteAccountScreen.tsx`, `AddressFormScreen.tsx`,
`LocationCaptureCard.tsx`, `OrderConfirmationScreen.tsx`,
`SignInScreen.tsx`).

**No se toca**: `docs/design/TOKENS.md` / `theme.ts` (cero tokens nuevos —
`brand.pressed` ya existe y es lo que usa el mini-CTA) ·
`Button.tsx`/`QuickAddButton.tsx`/filas con fondo ya resueltas.

## Checkpoints

- **CP1 — Detalle del pedido**: `OrderInfoRow` + `OrderDetailCard` +
  wiring en tracking + simplificación de `useBusiness` + refactor de
  `OrderConfirmationScreen`. Gate: `pnpm exec jest src/features/orders
src/features/checkout --silent` + `tsc --noEmit`.
- **CP2 — Pressed de links de texto**: `PressableOpacity` + 16 call sites
  - `Link` de SignIn + `SettingsRow`. Gate: `pnpm exec jest src/shared/ui
src/features/profile --silent` (suite completa dado el volumen de
    archivos tocados) + `tsc --noEmit`.
- **Cierre**: suite completa + lint.

## Verificación

Automática: gates de arriba + suite completa al cierre.

**Visual — del usuario, en simulador/dispositivo, ANTES del merge (pedido
explícito)**:

1. Tracking de un pedido en cualquier estado: la card "Detalle del
   pedido" muestra negocio (logo si tiene), items con cantidad/variante,
   subtotal/envío/total, dirección, instrucciones si las hay, "Efectivo
   contra entrega". El hero de arriba sigue mostrando el nombre del
   negocio igual que antes (ahora desde `order.businessName`, sin el
   fetch extra — no debería notarse diferencia visual).
2. Tocar y mantener presionado cada uno de los 16 links de texto (o al
   menos una muestra representativa: Cerrar sesión, Cancelar pedido,
   Reenviar código, Marcar como predeterminada) — debe verse un dim
   sutil mientras se sostiene el tap, y volver a la normalidad al soltar.
3. "Crear cuenta" en el login (el único `Link`) — mismo feedback.
4. Las 4 filas de Perfil (Mis direcciones, Notificaciones, Privacidad,
   Enviar comentarios) — fondo gris sutil mientras se sostiene el tap
   (no opacidad, patrón de fila).
5. "Usar mi ubicación" en el formulario de dirección — fondo violeta más
   oscuro (`brand.pressed`) mientras se sostiene el tap, mismo mecanismo
   que el botón "Confirmar pedido".

Aviso explícito al cerrar el chore: se espera la verificación visual del
usuario antes del merge, no solo el gate automático.

## Git

Rama nueva desde `main` (verificar sincronizado con `origin/main` antes de
crear rama — el PR anterior, #15, ya está mergeado). Un commit por
checkpoint, conventional (`feat(orders):`, `refactor(orders):`,
`feat(ui):`). Push + PR por cuenta de Claude Code al cerrar; el **merge**
es siempre del usuario, y en este caso explícitamente espera verificar
visualmente primero.

## Progreso

- [x] **CP1 — Detalle del pedido.** Cerrado.
  - `OrderInfoRow` (nuevo, `orders/components/`) extraído del `Row` local
    de `OrderConfirmationScreen`, que ahora lo importa en vez de definirlo
    — reuso real, sin dos copias del mismo patrón label/value.
  - `OrderDetailCard` (nuevo): negocio (`AvatarFallback`, solo si
    `businessName` existe) → items con cantidad/nombre/variante/precio →
    subtotal/envío/total → dirección/instrucciones/pago. Cero fetch
    nuevo, todo desde `order` ya cargado.
  - `OrderTrackingScreen`: la card se inserta después del stepper (visible
    en cualquier estado, no solo `ENTREGADO`). **Simplificación incluida**:
    se eliminó el `useBusiness` redundante — el hero card ahora usa
    `order.businessName` en vez de `businessQuery.data?.name`, una sola
    fuente de verdad del nombre del negocio en toda la pantalla.
  - Test nuevo `OrderDetailCard.test.tsx` (7 casos: negocio con/sin
    `businessName`, items con variante, totales formateados, dirección
    con/sin instrucciones, forma de pago). Ajuste durante el desarrollo:
    los valores de fixture del primer intento colisionaban entre sí
    (mismo monto formateado en dos lugares, `getByText` ambiguo) —
    corregido con montos todos distintos.
  - Gate: `pnpm exec jest src/features/orders src/features/checkout
--silent` → 11 suites/84 tests OK (un fallo de `useCancelOrder.test.tsx`
    en la primera corrida resultó ser flaky de la suite existente, no
    relacionado — pasó solo y en la corrida siguiente). `pnpm exec tsc
--noEmit` → limpio. `eslint` sobre los archivos tocados → limpio.
- [ ] CP2 — Feedback de pressed en links de texto
- [ ] Cierre: gate completo + PR (esperar verificación visual antes de mergear)
