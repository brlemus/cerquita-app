# Fase 6b — Reviews + Feedback + consumo del contrato nuevo

### Progreso

- Plan aprobado en plan mode (high effort), con **un cambio obligatorio** y
  **una nota de backlog**:
  1. **Manejo de teclado del comentario de reseña en Android** (ver
     "Manejo de teclado" en el Checkpoint 1, reemplaza la mención original a
     `automaticallyAdjustKeyboardInsets` -- ese prop es solo-iOS y no resuelve
     nada en Android, donde edge-to-edge rompe `adjustResize` (root cause ya
     documentada en `docs/phases/chore-brand-v2-login-splash.md`).
  2. **Backlog anotado, no implementado en esta fase**: `GET /orders/:id`
     debería exponer el estado de reseña del pedido (campo aditivo, mismo
     patrón del chore de DTO parity) — hoy `reviewedOrdersStore` es la única
     fuente de verdad porque el contrato no da otra; cuando ese campo exista,
     el store pasa a ser cache y el caso multi-dispositivo queda exacto. Se
     anota en `PLAN_MOBILE_CERQUITA.md` (Backlog post-MVP) al cerrar el
     Checkpoint 1, no se implementa.
- Aprobado tal cual: store persistido con backstop de `409`, feedback como
  pantalla propia, pill defensivo en `ProductCard`, fallback del título en
  `OrderRow`.
- **Checkpoint 1 — código listo, gate automático cerrado**:
  `src/features/reviews/` nuevo completo (`api/types.ts`, `api/createReview.ts`
  — POST `/orders/:id/reviews`, `schemas.ts` — `reviewSchema` zod, `store/
reviewedOrdersStore.ts` — persist zustand espejo de `cartStore`,
  `hooks/useCreateReview.ts` — marca reviewed en éxito y en `409`,
  `components/StarRatingInput.tsx` — 5 estrellas tappables (44pt), reusa el
  `Path` de `RatingBadge`, `components/OrderReviewCard.tsx` — card con
  estado "ya reseñado" / form de calificación, validación local con
  `reviewSchema.safeParse` sin RHF por ser 2 campos). `OrderTrackingScreen.tsx`
  edit: `OrderReviewCard` dentro del `ScrollView` cuando `ENTREGADO`;
  `ScrollView`+footer envueltos en `KeyboardAvoidingView behavior="padding"`
  (ambas plataformas) según lo acordado en el cambio obligatorio de arriba.
  Gate: `tsc --noEmit` limpio, `pnpm run lint` limpio, `jest src/features/reviews`
  14/14, `jest src/features/orders` 25/25 (sin regresión). Sin test unitario
  de `OrderTrackingScreen` (pantalla orquestadora, sin lógica no trivial
  propia — igual que el resto de pantallas del repo).
  Pendiente: tu verificación visual del Checkpoint 1.
- Backlog de `PLAN_MOBILE_CERQUITA.md` (nota 2 del cambio aprobado) anotado
  en la sección "Backlog post-MVP".
- **Checkpoint 2 — código listo, gate automático cerrado**:
  `src/features/feedback/` nuevo completo (`api/types.ts`,
  `api/submitFeedback.ts` — POST `/feedback`, `schemas.ts` — `feedbackSchema`,
  `hooks/useSubmitFeedback.ts`, `screens/FeedbackScreen.tsx`). Ajuste sobre
  el plan original: `category` **no** vive en `react-hook-form` -- es un chip
  de selección simple, no un input controlado, y `watch()` de RHF no memoiza
  bien con el React Compiler (warning real del lint, `react-hooks/incompatible-library`);
  se resuelve con `useState<FeedbackCategory | undefined>` local + un
  sub-schema `feedbackSchema.pick({text:true})` solo para el campo de texto,
  sin duplicar la validación de `text`. `app/(app)/feedback.tsx` nuevo
  (hermana de `(tabs)`, mismo patrón que `search.tsx`). `ProfileScreen.tsx`
  suma la fila "Enviar comentarios" → `router.push('/feedback')`, arriba de
  "Cerrar sesión". Gate: `tsc --noEmit` limpio, `pnpm run lint` limpio (sin
  warnings), `jest src/features/feedback` + `jest src/features/profile`
  7/7. Pendiente: tu verificación visual del Checkpoint 2.
- **Checkpoint 3 — código listo, gate de cierre verde**: `Order.businessName?`
  y `Product.catalogCategoryName?` sumados a los tipos (opcionales,
  comentario apuntando al gap cerrado). `OrderRow.tsx`: título =
  `businessName` con fallback a `Pedido #{shortId}`; cuando hay nombre, el
  número de pedido baja a `footnote` secundario debajo del título
  (`numberOfLines={1}` + `flexShrink:1` en el título para no empujar el
  badge con nombres largos). `ProductCard.tsx`: pill de categoría
  (`surface.tint`/`brand.dark`, `radius.full`) sobre el nombre del producto,
  render defensivo (`catalogCategoryName ? ... : null`) -- `BusinessDetailScreen`
  sin cambios, como estaba previsto. Tests nuevos: `OrderRow.test.tsx`
  (título con/sin `businessName`), `ProductCard.test.tsx` (pill presente/
  ausente).
  **Gate de cierre de fase**: `tsc --noEmit` limpio, `pnpm run lint` limpio
  (sin warnings), **suite completa `pnpm exec jest` → 52/52 suites, 259/259
  tests**, sin regresiones.

## Fase 6b cerrada (código) -- pendiente tu verificación visual

Los 3 checkpoints están implementados y todos los gates automáticos en
verde. Falta tu verificación visual (ver "Verificación end-to-end" arriba)
antes de dar la fase por cerrada del todo y decidir rama/PR/commits.

## Context

La Fase 6a fijó la tab bar y "Mis pedidos" y **difirió a esta 6b** dos features
que comparten poco con ella: la **reseña post-entrega** y el **feedback general**
(ver `docs/phases/phase-6-orders-tabs.md` → "Alcance (partición)"). Además, el
backend ya deployó dos campos nuevos que estaban anotados como gaps de contrato
en la tabla de paridad de `PLAN_MOBILE_CERQUITA.md` (`businessName` en `Order`,
`catalogCategoryName` en `Product`) — este PR los consume.

Resultado buscado: el customer puede **calificar un pedido ENTREGADO** (1-5 +
comentario opcional, una por pedido) desde el tracking, **mandar feedback
general** desde Perfil (que deja de ser stub puro), y la app muestra el
**nombre del negocio** en cada fila de pedido y el **nombre de categoría de
catálogo** en el detalle de negocio.

Contrato relevante: `docs/API_CONTRACT.md` §6 (Reviews), §7 (Feedback), §3
(Product), §4 (Order). Reglas duras: reseña solo sobre `ENTREGADO`, **una por
pedido** (unicidad → `409`); no existe endpoint de listado de reseñas del
customer (ver decisión de "ya reseñado" abajo).

## Estimación y partición

Realista ~60-80 min de implementación (más que la ventana 30-50 de la 6a). Los
**3 checkpoints son puntos de corte naturales**; se mantienen en un solo PR
(6b) por ser cohesivos y CP3 chico.

## Decisiones de diseño (criterio senior, no se consultan)

- **"Ya reseñado" sin endpoint de listado**: el contrato **no** expone forma de
  saber si un pedido ya tiene reseña salvo el `409` al re-postear. Fuente de
  verdad local: un **store persistido** `reviewedOrdersStore` (zustand +
  AsyncStorage, espejo exacto de `cartStore`) con los `orderId` ya reseñados.
  `onSuccess` marca el id; un `409` (conflict) al enviar **también** lo marca
  (backstop si se perdió el estado local o se reseñó en otro device). Así el
  estado "ya reseñado" se resuelve al instante sin sondear la red. Es la opción
  de producto (rector: mejor UX) y cuesta ~40 líneas ya probadas por `cartStore`.
- **Feedback = pantalla propia** empujada sobre las tabs (`/feedback`), no inline
  en Perfil: el form (texto requerido + categoría) merece su espacio y teclado
  manejado; Perfil solo suma una fila de entrada.
- **Reseña inline en el tracking** (no pantalla aparte): es donde el requisito la
  ancla ("detalle/tracking del pedido entregado"). Teclado del comentario:
  `automaticallyAdjustKeyboardInsets` en el `ScrollView` del tracking (fix de 1
  prop, iOS) — sin convertir la pantalla a keyboard-aware.
- **businessName**: se consume solo en `OrderRow` (alcance de CP3). _No_ se
  refactoriza `OrderTrackingScreen`/`OrderConfirmationScreen` para dejar de
  fetchear `useBusiness` en este PR (fuera de alcance) — se anota como posible
  optimización futura (quitaría 2 requests).
- **catalogCategoryName**: **pill por producto** (decisión del usuario, entre 3
  opciones presentadas) — pill compacto en `ProductCard`, render defensivo si
  falta el campo. Se descartó una barra de chips tipo filtro por la semántica
  rota que produciría contra paginación por cursor (filtrar solo lo cargado,
  "cargar más" trayendo de todo el catálogo).

## Checkpoint 1 — Reseña post-ENTREGADO

Nuevos en `src/features/reviews/`:

- `api/types.ts` — `CreateReviewPayload {rating:number; comment?:string}`,
  `Review {id, orderId, businessId, customerId, rating, comment?, createdAt}`
  (espejo §6).
- `api/createReview.ts` — `createReview(orderId, payload): Promise<Review>` vía
  `request` POST `/orders/${orderId}/reviews` (patrón de `createOrder.ts`).
- `schemas.ts` — zod `reviewSchema {rating: int 1..5, comment: max 1000 opt}`
  (espeja la validación del DTO; mismo patrón que `checkout/schemas.ts`).
- `store/reviewedOrdersStore.ts` — persist zustand, `reviewedIds: string[]`,
  `markReviewed(id)`, helper `isOrderReviewed(state, id)`. Config de persist
  calcada de `cartStore` (`name: '@cerquita/reviewed-orders'`).
- `hooks/useCreateReview.ts` — `useMutation`; `onSuccess` → `markReviewed`.
- `components/StarRatingInput.tsx` — 5 estrellas tappables (relleno hasta el
  valor), `value`/`onChange`, `accessibilityRole="adjustable"`. Estrella
  reusa el `Path` de `RatingBadge` (relleno `brand.default` / vacío
  `border.strong`).
- `components/OrderReviewCard.tsx` — lee `reviewedOrdersStore`; si ya reseñado →
  estado "¡Gracias por tu reseña!" (★ + copy, read-only); si no → card con
  `StarRatingInput` + `TextField` multiline opcional ("Contanos cómo te fue")
  - `Button` "Enviar reseña" (loading). Valida con `reviewSchema` (rating>0);
    `409` → `markReviewed` + estado gracias; otros errores → mensaje inline.

Editar:

- `src/features/orders/screens/OrderTrackingScreen.tsx` — render
  `<OrderReviewCard orderId={order.id} />` dentro del `ScrollView` cuando
  `effectiveStatus === 'ENTREGADO'`.

**Manejo de teclado (obligatorio, ambas plataformas)**: la pantalla tiene
header fijo (arriba) + `ScrollView` + footer fijo (`Volver al inicio`, más
`Cancelar` solo si `canCancel` -- nunca simultáneo con la reseña, que solo
aparece en `ENTREGADO`). `KeyboardAwareScreen` no tiene slot de footer, así
que en vez de forzar esta forma (header fijo + scroll + footer fijo, no un
formulario simple de un solo bloque) dentro de ese wrapper, se envuelve
`ScrollView` + footer en `KeyboardAvoidingView behavior="padding"` (el header
queda afuera, no tiene inputs) -- el mismo mecanismo, misma justificación de
root cause, que ya prueba `KeyboardAwareScreen` en Login/`AddressFormScreen`
(`docs/phases/chore-brand-v2-login-splash.md`: con edge-to-edge,
`adjustResize` ya no es confiable en Android; `padding` engancha el listener
de `Keyboard` de RN y funciona en ambas plataformas). Con eso, el
`ScrollView` se achica cuando aparece el teclado y el foco nativo en el
`TextInput` de comentario (built-in de `ScrollView` en ambas plataformas, no
depende de ningún prop adicional) lo desplaza junto con el botón "Enviar
reseña" por encima del teclado -- footer con solo "Volver al inicio" en ese
estado, sin colisión. `keyboardShouldPersistTaps="handled"` en el
`ScrollView`, mismo criterio que `KeyboardAwareScreen`.

Tests (afectados): `reviewedOrdersStore.test.ts` (mark/isReviewed),
`useCreateReview.test.tsx` (marca reviewed en success — patrón de
`useCancelOrder.test.tsx`), `schemas.test.ts` (rating fuera de rango, comment
largo). Gate CP1: `tsc --noEmit` + lint + `jest src/features/reviews`.

Verificación visual (usuario): en un pedido ENTREGADO, card de reseña con
estrellas; enviar → estado "gracias"; reabrir → sigue en "gracias"; pedido no
entregado → sin card.

## Checkpoint 2 — Feedback general

Nuevos en `src/features/feedback/`:

- `api/types.ts` — `FeedbackCategory = 'BUG'|'SUGERENCIA'|'QUEJA'|'OTRO'`,
  `CreateFeedbackPayload {text:string; category?:FeedbackCategory}`,
  `Feedback {id, userId, category?, text, createdAt}` (espejo §7).
- `api/submitFeedback.ts` — POST `/feedback`.
- `schemas.ts` — zod `feedbackSchema {text: min 1 max 2000, category: enum opt}`.
- `hooks/useSubmitFeedback.ts` — `useMutation` (sin cache que invalidar).
- `screens/FeedbackScreen.tsx` — `KeyboardAwareScreen`; header + back; chips de
  categoría opcionales (4, tappables, seleccionable/deseleccionable, touch ≥44);
  `TextField` multiline requerido; `Button` "Enviar" (loading). RHF + zod
  (patrón de `AddressFormScreen`). Éxito → `Alert` "¡Gracias por tu comentario!"
  → `router.back()`.

Nuevos/editar en rutas y Perfil:

- `app/(app)/feedback.tsx` — ruta nueva → `FeedbackScreen` (hermana de `(tabs)`,
  full-screen sobre las tabs, igual que `search.tsx`/`cart.tsx`).
- `src/features/profile/screens/ProfileScreen.tsx` — fila pressable "Enviar
  comentarios" → `router.push('/feedback')` (fila con estilo de lista simple,
  sobre "Cerrar sesión"). Perfil sigue deliberadamente simple.

Tests: `feedback/schemas.test.ts` (texto vacío/largo, categoría inválida).
Gate CP2: `tsc --noEmit` + lint + `jest src/features/feedback`.

Verificación visual (usuario): desde Perfil → Enviar comentarios; escribir y
enviar con/sin categoría; éxito vuelve a Perfil; teclado no tapa el input.

## Checkpoint 3 — Consumo del contrato nuevo

- `src/features/orders/api/types.ts` — agregar `businessName?: string` a `Order`.
- `src/features/orders/components/OrderRow.tsx` — título =
  `order.businessName ?? 'Pedido #'+shortOrderId(order.id)`; cuando hay nombre,
  `Pedido #{shortId}` baja a footnote secundario. Robusto a campo ausente.
- `src/features/marketplace/api/types.ts` — agregar
  `catalogCategoryName?: string | null` a `Product`.
- `src/features/marketplace/components/ProductCard.tsx` — **pill por producto**
  (decisión del usuario): pill compacto con `catalogCategoryName` sobre el
  nombre, render defensivo (`catalogCategoryName ? <pill> : null`). Tokens:
  fondo `surface.tint`/`brand.tint`, texto `brand.dark`, `radius.full`, patrón
  visual del pill de `minOrderBanner`/`RatingBadge`. Sin filtro ni secciones.
  `BusinessDetailScreen` no cambia.

Tests: `OrderRow.test.tsx` (fallback de título con/sin `businessName`) +
`ProductCard.test.tsx` (pill presente/ausente según `catalogCategoryName`).
Gate CP3 = **cierre de fase**: `tsc --noEmit` + lint + **suite completa**
(`pnpm exec jest`).

Verificación visual (usuario): filas de "Mis pedidos" muestran el nombre del
negocio; detalle de negocio muestra el pill de categoría por producto; ambos
sin romperse si el backend omite el campo.

## Archivos clave

Nuevos: `src/features/reviews/{api/types.ts,api/createReview.ts,schemas.ts,
store/reviewedOrdersStore.ts,hooks/useCreateReview.ts,
components/StarRatingInput.tsx,components/OrderReviewCard.tsx}`,
`src/features/feedback/{api/types.ts,api/submitFeedback.ts,schemas.ts,
hooks/useSubmitFeedback.ts,screens/FeedbackScreen.tsx}`,
`app/(app)/feedback.tsx`. Más los `*.test` listados.

Editar: `src/features/orders/screens/OrderTrackingScreen.tsx`,
`src/features/orders/components/OrderRow.tsx`,
`src/features/orders/api/types.ts`, `src/features/marketplace/api/types.ts`,
`src/features/profile/screens/ProfileScreen.tsx`,
`src/features/marketplace/components/ProductCard.tsx` (pill de categoría),
`PLAN_MOBILE_CERQUITA.md` (cerrar los 2 gaps de contrato + fila 6b).

## Patrones a reusar (no reinventar)

- Mutations: `useCreateOrder`/`useCreateAddress` (`useMutation`, invalidación).
- Store persistido: `cartStore` (zustand + AsyncStorage + `partialize`).
- API POST: `createOrder.ts` (`request<T>` con body).
- Form: `AddressFormScreen` + `checkout/schemas.ts` (RHF + zod).
- UI: `TextField` (multiline), `Button` (loading), `EmptyState`/`ErrorState`,
  `Text`, tokens de `theme.ts` (incl. `brand.shadow`/`surface.tint`),
  estrella de `RatingBadge`, `KeyboardAwareScreen`.
- Ruta full-screen sobre tabs: `search.tsx`/`cart.tsx` como hermanas de `(tabs)`.

## Verificación end-to-end

- Automático: `tsc --noEmit`, lint, tests por checkpoint
  (`jest src/features/reviews`, `jest src/features/feedback`,
  `jest src/features/orders`); **suite completa** como gate de cierre.
- Manual (usuario, dev build): reseñar un pedido entregado y ver "ya reseñado"
  al reabrir; feedback desde Perfil con/sin categoría; nombre de negocio en Mis
  pedidos; pill de categoría en detalle de negocio; robustez si el backend
  omite los campos nuevos.

## Git

Rama/PR: los define el usuario (sin ramificar ni pushear sin confirmación). Un
PR para la 6b. Conventional commits (ej. `feat(reviews): add post-delivery
order review`, `feat(feedback): add app feedback form`, `feat(orders): show
business name in order row`). Sin trailer de co-autoría.
