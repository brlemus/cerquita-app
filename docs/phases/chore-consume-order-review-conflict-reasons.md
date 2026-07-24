# Chore — Consumir `details.reason` + `review` embebida

**Estado**: Planificado, no iniciado.

## Contexto

El backend deployó `details.reason` tipado en los 409 de pedidos/reseñas y
un campo `review` embebido en `GET /orders`/`GET /orders/:id` (PR #16 de
`cerquita-api`, ya en `master`). `docs/API_CONTRACT.md` de este repo ya está
al día (PR #13, mergeado — verificado: `main` local en sync con
`origin/main`, el contrato tiene el catálogo de 9 `reason` y el shape de
`review`). Este chore consume ambos cambios en el cliente.

Verificado línea por línea contra el código actual (dos exploraciones
completas, no supuesto):

- **Clasificador de 409 hoy**: 100% estructural (forma/ausencia de
  `details`), nunca lee `message` ni `reason`. Con el deploy nuevo esto
  **ya está roto en producción**: `classifyOrderConflict.ts` asume "sin
  `details` → bajo el mínimo" pero `BELOW_MINIMUM_ORDER` ahora **sí** trae
  `details`, así que cae a `'unknown'` y el checkout muestra el `message`
  crudo en inglés. Además `PRODUCT_NOT_ACTIVE`/`VARIANT_OPTION_NOT_ACTIVE`
  (ambos solo con `{reason, productId}` o `{reason, variantOptionId}`)
  colisionan con la rama de stock insuficiente → la UI dice "no hay stock"
  cuando el producto fue desactivado.
- **Cancelación**: `useCancelOrder.ts` no distingue ningún 409 (invalida
  cache igual siempre). El copy del `Alert.alert` en
  `OrderTrackingScreen.tsx:87` ("El negocio ya empezó a preparar tu
  pedido") describe un caso que el contrato dice que es **403, no 409** —
  hoy ese texto nunca es cierto cuando se muestra.
- **Reseña**: `useCreateReview.ts` marca `reviewedOrdersStore` en **todo**
  409, sin distinguir `REVIEW_ALREADY_EXISTS` de `ORDER_NOT_DELIVERED` — un
  409 de "no entregado" hoy se guarda permanentemente en AsyncStorage como
  "ya reseñado", bug real y silencioso.
- **`review` embebida**: `Order` (cliente) no tiene el campo. `businessName`
  y `catalogCategoryName` ya están tipados (chores previos); `logoUrl` y
  `review` faltan por completo. `OrderReviewCard` es el único lector de
  `reviewedOrdersStore` y no tiene test propio.
- **`details.reason` ya llega al cliente hoy**, sin tipar — `mapError`
  (`src/shared/api/errors.ts`) propaga `details` intacto a
  `ApiError.details`. La migración no toca transporte, solo tipa y
  clasifica.

## Diseño

### Parte 1 — Clasificador por `details.reason`, con fallback legacy

**`src/shared/api/types.ts`** — agregar el catálogo maestro (mirror 1:1 del
contrato):

```ts
export type OrderConflictReason =
  | 'BUSINESS_NOT_ACCEPTING_ORDERS'
  | 'BELOW_MINIMUM_ORDER'
  | 'PRODUCT_NOT_ACTIVE'
  | 'VARIANT_OPTION_NOT_ACTIVE'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_STATUS_TRANSITION'
  | 'STATUS_CHANGED_CONCURRENTLY'
  | 'ORDER_NOT_DELIVERED'
  | 'REVIEW_ALREADY_EXISTS';
```

**`src/shared/api/errors.ts`** — junto a los demás `extract*` helpers,
`getConflictReason(details)`: lee `details.reason`, lo valida contra un
`Set` de los 9 valores (string desconocido o `details` ausente →
`undefined`, nunca un cast ciego). Uso adicional, **fix de correctness
necesario para que la migración sea segura**: `RE_REGISTER_BLOCKED_PATTERN`
hoy corre sobre el `message` de _cualquier_ 409, y `REVIEW_ALREADY_EXISTS`
solo la esquiva porque su mensaje está en español (`docs/API_CONTRACT.md`
lo marca explícito). Blindaje de una línea: si `details.reason` es un valor
reconocido, ese 409 es inequívocamente del dominio orders/reviews y nunca
`reRegisterBlocked` — se salta el regex.

**`src/features/checkout/utils/classifyOrderConflict.ts`** — `reason`
primero vía un mapa `OrderConflictReason → OrderConflictKind`, fallback a
la heurística estructural actual (sin tocarla) cuando `reason` no viene.
Nuevo kind `'productInactive'` (`PRODUCT_NOT_ACTIVE` y
`VARIANT_OPTION_NOT_ACTIVE`, antes mal clasificados como stock). Rename
`extractStockConflictLine`→`extractConflictLine` (ya no es stock-específico
— `PRODUCT_NOT_ACTIVE` tiene la misma forma `{productId}`/
`{variantOptionId}`, se reusa tal cual). Fix chico en el matcher de
`deriveCheckoutError.ts`: hoy exige `!line.variantOptionId` para matchear
por `productId` solo — correcto para stock (esa forma solo aparece en
líneas sin variante) pero incorrecto para `PRODUCT_NOT_ACTIVE` (siempre
reporta solo `productId`, aunque la línea tenga variante, porque el
backend chequea `isActive` antes de resolver la variante). Se relaja a
matchear por `productId` sin esa condición — no rompe ningún test
existente (verificado contra los casos actuales).
**Los dos tests que parecían "romper seguro" con la migración
(`minOrderNotMet sin details`, `conflict no reconocido`) en realidad NO
rompen** — el fallback preserva exactamente la heurística vieja cuando
`reason` está ausente. Se agregan casos nuevos, no se reescriben esos dos.

**`src/features/orders/utils/classifyCancelConflict.ts`** (nuevo): `reason`
→ `'alreadyDelivered'` (`INVALID_STATUS_TRANSITION` con `details.from ===
'ENTREGADO'`) / `'alreadyCancelled'` (`from === 'CANCELADO'`) /
`'statusChanged'` (`STATUS_CHANGED_CONCURRENTLY`) / `'unknown'` (sin razón
reconocida o sin `reason` — fallback: mismo copy genérico que hoy).
`OrderTrackingScreen.tsx` (`handleCancel`, línea 84-90) usa esto para
reemplazar el `Alert.alert` con el mensaje real por caso — corrige el bug
de copy detectado arriba. `useCancelOrder.ts` (invalidación de cache) **no
se toca** — la clasificación es solo para el texto del `Alert`, vive en el
call-site del `mutate()`, no en el hook.

**`src/features/reviews/utils/classifyReviewConflict.ts`** (nuevo): `reason`
→ `'alreadyReviewed'` (`REVIEW_ALREADY_EXISTS`, y también el fallback sin
`reason` — preserva el comportamiento histórico) / `'orderNotDelivered'`
(`ORDER_NOT_DELIVERED`) / `'unknown'`. Usado en `useCreateReview.ts`
(`onError`: solo `alreadyReviewed` llama `markReviewed`) y
`OrderReviewCard.tsx` (`onError` del submit: `alreadyReviewed` no muestra
nada — el store ya cambió y la card re-renderiza sola; `orderNotDelivered`
muestra "Todavía no podés calificar este pedido"; el resto cae al mensaje
de error genérico ya existente). Corrige el bug real de arriba.

### Parte 2 — `review` como fuente de verdad

**`src/features/reviews/api/types.ts`** — nuevo `OrderReviewSummary { id,
rating, comment?, createdAt }` (subconjunto de `Review`, mismo shape que
`OrderReviewSummaryResponseDto` del backend — no reusar `Review` completo,
trae `orderId`/`businessId`/`customerId` redundantes).

**`src/features/orders/api/types.ts`** — `Order` gana `logoUrl?: string |
null` y `review?: OrderReviewSummary | null` (import de tipo desde
`reviews/api/types`, mismo sentido de dependencia que ya existe a nivel de
pantalla — `OrderTrackingScreen` ya importa `OrderReviewCard` de
`reviews`). Opcionales, mismo criterio que `businessName?` ya en el
archivo. `OrderStatusPoll` no se toca (el contrato es explícito: ese
endpoint no gana estos campos).

**`src/features/reviews/components/StarRatingInput.tsx`** — nuevo prop
`readOnly?: boolean` (`onChange` pasa a opcional). En modo `readOnly`
renderiza las mismas 5 estrellas sin `Pressable`, con un solo
`accessibilityLabel="N de 5 estrellas"` en el contenedor (no interactivo,
no necesita label por estrella). Mismo componente, mismo ícono — sin
duplicar el SVG en un componente nuevo.

**`src/features/reviews/components/OrderReviewCard.tsx`** — nuevo prop
`review: OrderReviewSummary | null | undefined`. `reviewed = review != null
|| locallyReviewed` (combina fuente de verdad del backend + cache
optimista del store — cubre el instante entre calificar y el próximo
refetch, que todavía no trae `review`). Estado "gracias" muestra
`StarRatingInput readOnly` con `review?.rating ?? submittedRating` (el
rating que el propio usuario acaba de enviar, como valor de transición
mientras no llega el `review` real del servidor). `onError` del submit usa
`classifyReviewConflict` (Parte 1).

**`src/features/orders/screens/OrderTrackingScreen.tsx`** — pasa
`review={order.review}` a `<OrderReviewCard>` (línea 145; `order` ya está
en scope).

**`src/features/reviews/hooks/useCreateReview.ts`** — en `onSuccess`, además
de `markReviewed`, invalida `['orders', 'detail', orderId]` y `['orders',
'list']` (keys literales, sin importar los hooks de `orders` — evita
acoplar `reviews` a la capa de hooks de `orders`; TanStack matchea por
prefijo de key, no hace falta el factory). Así el `review` real reemplaza
al eco optimista en cuanto se refetchea.

**`src/features/orders/components/OrderRow.tsx`** — indicador chico
"· Calificado" (texto `footnote`/`secondary`, junto a la fecha) cuando
`order.review != null`. Interpretación de "la lista puede marcar 'ya
calificado' sin costo extra": cambio mínimo, sin ícono nuevo, gateado
100% por el campo ya tipado.

**Limpieza de docs que quedan desactualizados por este chore**:
`reviewedOrdersStore.ts` (docblock dice "gap de contrato... este store es
fuente de verdad hasta que exista `review`" — ya no es cierto);
`PLAN_MOBILE_CERQUITA.md:389-396` (backlog "Estado de reseña en `GET
/orders/:id`" — el gap ya cerró, se borra la entrada).

## Tests

- `src/shared/api/errors.test.ts` — 1 caso nuevo: 409 con `reason`
  reconocido y `message` que matchearía el regex de re-registro igual
  clasifica `conflict`, no `reRegisterBlocked`.
- `classifyOrderConflict.test.ts` — casos nuevos por los 5 `reason` de
  checkout (incluye los 2 que colapsan a `productInactive`) + 1 de
  `reason` fuera de este catálogo (ej. uno de cancelación) → `unknown`.
  Rename de los tests de `extractStockConflictLine`→`extractConflictLine`.
  Los 2 tests de fallback existentes quedan intactos.
- `deriveCheckoutError.test.ts` — casos nuevos: `productInactive` con línea
  matcheada (probando el fix del matcher, con una línea que SÍ tiene
  variante) y sin matchear; `BELOW_MINIMUM_ORDER` con `reason` usa el copy
  fijo, no el `message` crudo.
- `classifyCancelConflict.test.ts` (nuevo) — reason path (statusChanged,
  alreadyDelivered, alreadyCancelled) + fallback (sin `reason` → unknown).
- `classifyReviewConflict.test.ts` (nuevo) — reason path
  (alreadyReviewed/orderNotDelivered) + fallback (sin `reason` →
  alreadyReviewed, preserva comportamiento histórico).
- `useCreateReview.test.tsx` — el test existente sin `details` (fallback)
  queda intacto; se agregan `REVIEW_ALREADY_EXISTS` (marca) y
  `ORDER_NOT_DELIVERED` (NO marca, caso nuevo que hoy es un bug) + 1 caso
  de invalidación de queries en éxito.
- `OrderReviewCard.test.tsx` (nuevo, no existía): sin `review` ni marca
  local → formulario; con `review` del backend → "gracias" + estrellas
  reales; marcado solo localmente (optimista) → "gracias" también.
- `OrderRow.test.tsx` — 1 caso nuevo: `order.review` poblada → muestra
  "Calificado".

## Archivos

**Nuevos**: `src/features/orders/utils/classifyCancelConflict.ts` (+test) ·
`src/features/reviews/utils/classifyReviewConflict.ts` (+test) ·
`src/features/reviews/components/OrderReviewCard.test.tsx`.

**Modificados**: `src/shared/api/{types,errors,index}.ts` (+errors.test) ·
`src/features/checkout/utils/{classifyOrderConflict,deriveCheckoutError}.ts`
(+tests) · `src/features/orders/screens/OrderTrackingScreen.tsx` ·
`src/features/orders/api/types.ts` · `src/features/orders/components/OrderRow.tsx`
(+test) · `src/features/reviews/api/types.ts` ·
`src/features/reviews/components/{StarRatingInput,OrderReviewCard}.tsx` ·
`src/features/reviews/hooks/useCreateReview.ts` (+test) ·
`src/features/reviews/store/reviewedOrdersStore.ts` (docblock) ·
`PLAN_MOBILE_CERQUITA.md` (backlog).

**No se toca**: `useCancelOrder.ts`, `useOrder.ts`, `useOrders.ts`,
`useOrderStatus.ts`, `OrderStatusPoll`, `src/shared/api/client.ts`.

## Checkpoints

- **CP1 — Clasificador (Parte 1)**: los 3 classify* + fix de `errors.ts` +
  wiring en `useCreateReview`/`OrderTrackingScreen`. Gate: `pnpm exec jest
src/shared/api src/features/checkout src/features/orders/utils
src/features/reviews --silent` + `tsc --noEmit`.
- **CP2 — Review como fuente de verdad (Parte 2)**: tipos, card, store,
  row, invalidación, limpieza de docs. Gate: `pnpm exec jest
src/features/reviews src/features/orders --silent` + `tsc --noEmit`.
- **Cierre**: `pnpm exec jest --silent` (suite completa) + `pnpm lint`.

## Verificación

- Automática: gates de arriba por checkpoint + suite completa al cierre.
- Visual (usuario, en simulador — no se verifica UI desde acá):
  1. Forzar un pedido bajo el mínimo → mensaje "no alcanza el mínimo",
     nunca el texto crudo en inglés.
  2. Forzar un producto desactivado en el carrito → "ya no está
     disponible" (no "sin stock").
  3. Cancelar un pedido que otro dispositivo ya canceló/entregó → mensaje
     específico, no "el negocio ya empezó a preparar".
  4. Calificar un pedido, volver a la lista de pedidos → fila muestra
     "Calificado"; volver a entrar al tracking → "gracias" con las
     estrellas reales, no el texto fijo de antes.

## Git

Rama nueva desde `main` (confirmado sincronizado con `origin/main`).
Nombre: `feat/consume-order-review-conflict-reasons`. Un commit por
checkpoint, conventional (`refactor(checkout):`, `feat(orders):`,
`feat(reviews):`). Push + PR por mi cuenta al cerrar (política vigente);
el **merge** es siempre tuyo.

## Progreso

- [x] **CP1 — Clasificador de 409 (Parte 1).** Cerrado.
  - `OrderConflictReason` en `shared/api/types.ts`; `getConflictReason` en
    `errors.ts` (valida contra el catálogo, nunca cast ciego), exportado
    desde `index.ts`.
  - **Fix de correctness incluido**, ya cubierto por el diseño aprobado: el
    409 con `reason` reconocido salta el regex de re-registro de auth
    (`errors.test.ts`, caso nuevo).
  - `classifyOrderConflict.ts`: `reason` primero, fallback estructural
    intacto, nuevo kind `productInactive`. Rename
    `extractStockConflictLine`→`extractConflictLine`.
    `deriveCheckoutError.ts`: rama nueva `productInactive`, matcher
    renombrado (`matchConflictLine`) y relajado (ya no exige
    `!line.variantOptionId` al matchear solo por `productId` — necesario
    para que `PRODUCT_NOT_ACTIVE` matchee líneas con variante). **Los 2
    tests que el research marcó como "van a romper" no rompieron** — el
    fallback preserva la heurística vieja byte a byte; se agregaron casos
    nuevos, no se tocaron esos dos.
  - `classifyCancelConflict.ts` (nuevo, `orders/utils/`): distingue
    `alreadyDelivered`/`alreadyCancelled`/`statusChanged`. Conectado en
    `OrderTrackingScreen.tsx` (`handleCancel`) — corrige el bug real de
    copy ("el negocio ya empezó a preparar", que describía un caso que es
    403, no 409). `useCancelOrder.ts` no se tocó (a propósito).
  - `classifyReviewConflict.ts` (nuevo, `reviews/utils/`): distingue
    `alreadyReviewed`/`orderNotDelivered`. Conectado en
    `useCreateReview.ts` (solo `alreadyReviewed` marca el store — corrige
    el bug real de que `ORDER_NOT_DELIVERED` se guardaba como "ya
    reseñado" permanentemente) y en `OrderReviewCard.tsx` (mensaje de
    error específico para `orderNotDelivered`).
  - Gate: `pnpm exec jest src/shared/api src/features/checkout
src/features/orders/utils src/features/reviews --silent` → 13
    suites/104 tests OK. `pnpm exec tsc --noEmit` → limpio.
- [ ] CP2 — Review como fuente de verdad (Parte 2)
- [ ] Cierre: gate completo + PR
