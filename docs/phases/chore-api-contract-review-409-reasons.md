# Chore — Parte 3: actualizar API_CONTRACT.md (doc-only)

**Estado**: Planificado, no iniciado.

## Contexto

El backend ya deployó en `master` de `cerquita-api` (PR #16,
`chore/order-review-state-409-reasons`, merge `6e6a656`, 2026-07-24) dos
cosas que `docs/API_CONTRACT.md` de este repo no refleja: un
`details.reason` tipado en los 409 de pedidos/reseñas, y un campo `review`
embebido en `GET /orders`/`GET /orders/:id`. El propio chore de backend dejó
redactada su "Parte 3" (edición de este archivo) en
`~/cerquita-api/docs/phases/chore-mobile-contract-review-state-409-reasons.md`,
pero nunca se ejecutó en este repo — verificado con `git fetch` (`origin/main`
sigue en `00b535c`, sin el commit).

Este chore ejecuta esa Parte 3 acá, como PR propio y doc-only (sin tocar
`src/shared/api/types.ts` ni ningún `.ts` — eso es el chore de consumo que
sigue después, ya con este contrato mergeado). Todo dato de abajo fue releído
directo del código de `~/cerquita-api` en `master` (2026-07-24), no copiado
ciego del doc del chore de backend — por si el doc y el código final
divergieron en algún detalle. También cubre la deuda ya identificada de
`businessName`/`logoUrl`/`catalogCategoryName` (chore anterior, PR #15,
nunca documentada en este repo).

## Verificado contra código real (no contra el plan del backend)

- `src/modules/orders/domain/order-conflict-reason.ts` — enum
  `OrderConflictReason`, 9 valores.
- `create-order.handler.ts:79-84` (`BUSINESS_NOT_ACCEPTING_ORDERS`, msg
  `"Business is not accepting orders right now"`, details
  `{reason, businessId, status, isOpen}`) y `:120-127`
  (`BELOW_MINIMUM_ORDER`, msg `"Order subtotal (X) is below the business
minimum (Y)"`, details `{reason, subtotalCents, minOrderCents}` — **antes
  no tenía `details`, ahora sí: rompe cualquier heurística por ausencia**).
- `order.prisma-repository.ts:251-259` (`PRODUCT_NOT_ACTIVE`, msg `"Product
<id> is not active"`, details `{reason, productId}`) y `:273-281`
  (`VARIANT_OPTION_NOT_ACTIVE`, msg `"Variant option <id> is not active"`,
  details `{reason, variantOptionId}`).
- `stock-adjuster.ts:30-34` y `:55-59` — ambos `INSUFFICIENT_STOCK`, msg
  `"Insufficient stock"`, details `{reason, variantOptionId, quantity}` o
  `{reason, productId, quantity}` según la línea.
- `order-status-transitions.ts:58-62` (`INVALID_STATUS_TRANSITION`, msg
  `"Cannot transition order from X to Y"`, details `{reason, from, to}`) —
  **y `:65-68`: si la arista existe pero el actor no está habilitado, es
  `ForbiddenError` → `403`, no `409`** (aplica cuando el customer intenta
  cancelar `PREPARANDO`/`EN_CAMINO`).
- `order-status-updater.ts:23-28` (`STATUS_CHANGED_CONCURRENTLY`, msg
  `"Order status changed concurrently"`, details `{reason, orderId, from,
to}`).
- `create-order-review.handler.ts:41-45` (`ORDER_NOT_DELIVERED`, msg
  `"Order must be ENTREGADO to be reviewed"`, details `{reason, orderId,
status}`).
- `order-review.prisma-repository.ts:57-60` (`REVIEW_ALREADY_EXISTS`, msg
  **en español** `"Ya existe una reseña para este pedido"` — inconsistente
  con el resto en inglés, se documenta tal cual es, no se "corrige" en el
  doc — details `{reason, orderId}`).
- `order-response.dto.ts:70-94,119-127` — `businessName?: string`,
  `logoUrl?: string | null`, `review?: {id, rating, comment?, createdAt} |
null`, poblados solo en `fromCustomerView` (o sea `GET /orders`,
  `GET /orders/:id`, y la respuesta de `POST /orders` — ahí `review` nace
  siempre `null`). **`GET /orders/:id/status` usa otro DTO
  (`OrderStatusResponseDto`) y no cambia** — confirmado que no toca este
  archivo.
- `product-response.dto.ts:8,29,35,44` — `catalogCategoryName: string |
null`, junto al `catalogCategoryId` que ya estaba documentado.
- `cancel-order.handler.ts` — confirma que el customer solo puede cancelar
  `PENDIENTE`; cualquier otro estado con arista `CANCELADO` (`PREPARANDO`,
  `EN_CAMINO`) da `403` (actor no habilitado), y un estado terminal
  (`ENTREGADO`/`CANCELADO`, sin arista) da `409` `INVALID_STATUS_TRANSITION`.

## Edición de `docs/API_CONTRACT.md` (único archivo tocado)

1. **Contrato de errores** (tabla ~línea 59-67): agregar debajo de la tabla
   el catálogo maestro de `OrderConflictReason` (9 valores, como type
   union) y una línea: _"Desde el 24-jul-2026, `details.reason` es el
   discriminador estable de estos 409 (pedidos y reseñas) — preferirlo
   sobre `message` (interpolado, a veces en inglés) o la forma de
   `details`."_
2. **§3 Marketplace — `GET /marketplace/businesses/:id/products`**
   (~línea 219-249): agregar `catalogCategoryName: string | null;` junto a
   `catalogCategoryId`.
3. **§4 Orders — `POST /orders` response 201** (~línea 316-328): agregar
   `businessName: string; logoUrl: string | null; review: null;` con nota
   de que en la creación `review` siempre nace `null`.
4. **§4 Orders — 409 de `POST /orders`** (~línea 330-352): reemplazar el
   párrafo "se distinguen por `message`/`details`" por una tabla con los 5
   `reason` (6 sitios, 2 comparten `INSUFFICIENT_STOCK`), mensaje y
   `details` exactos de arriba. Callout explícito: _"`BELOW_MINIMUM_ORDER`
   ya viene con `details` — el contrato anterior decía lo contrario;
   cualquier clasificación por ausencia de `details` deja de funcionar."_
5. **§4 Orders — `POST /orders/:id/cancel`** (~línea 354-359): reemplazar
   el 409 genérico por `INVALID_STATUS_TRANSITION` (estado terminal) vs
   `STATUS_CHANGED_CONCURRENTLY` (carrera), y agregar la nota de `403` para
   `PREPARANDO`/`EN_CAMINO` (actor no habilitado, no es un 409).
6. **§4 Orders — `GET /orders` y `GET /orders/:id`** (~línea 361-369):
   documentar que el `OrderResponseDto` de ambos gana `businessName`,
   `logoUrl`, `review` (shape completo); nota de que `review !== null` es
   la fuente de verdad de "ya calificado" para el cliente.
7. **§4 Orders — `GET /orders/:id/status`** (~línea 370-385): nota
   explícita de que este shape **no** cambia (sin `review`, sin
   `businessName`/`logoUrl`) — comparte query/handler con el detalle pero
   serializa con otro DTO.
8. **§6 Reviews — 409 de `POST /orders/:orderId/reviews`** (~línea
   444-445): reemplazar por tabla `ORDER_NOT_DELIVERED` /
   `REVIEW_ALREADY_EXISTS` con mensaje y `details` exactos (marcando que el
   segundo viene en español).
9. **Encabezado del archivo** (línea 3): actualizar la fecha de "destilado"
   a 2026-07-24 y agregar una línea citando el PR de origen (`cerquita-api`
   PR #16), mismo estilo que la cita existente de stock (línea 337-338).

No se toca `src/shared/api/types.ts` ni ningún otro archivo — es explícitamente
el follow-up del próximo chore (ya con este contrato mergeado).

## Verificación

- Lectura manual del diff completo contra los 9 puntos verificados arriba
  (no hay tests para un `.md`).
- `git diff --stat` debe mostrar un solo archivo: `docs/API_CONTRACT.md`.
- El commit dispara `lint-staged` (prettier sobre `.md`) — dejar que corra,
  no pelear el formato resultante.

## Git

Cambio de rama primero: parado en `feat/phase-7a-profile` (2 commits sin PR
aún) — este chore es independiente, así que `git checkout main` (limpio,
confirmado sincronizado con `origin/main` en `00b535c`) antes de crear la
rama nueva `docs/api-contract-review-409-reasons`. `feat/phase-7a-profile`
queda intacta, sin tocar.

Un commit (`docs(api-contract): reason catalog + review embebida + deuda de
DTO parity`), push, `gh pr create` con el link para el usuario. El **merge**
es siempre y exclusivamente del usuario.

Después de que se mergee, sigue el chore de consumo (PR 2, "Fase — consumir
review + reason en el mobile") — ese necesita su propio plan file nuevo, con
exploración sobre el clasificador de 409 actual y
`OrderReviewCard`/`reviewedOrdersStore` en `cerquita-app`.

## Progreso

- [ ] Cambiar a `main`, crear rama `docs/api-contract-review-409-reasons`.
- [ ] Editar `docs/API_CONTRACT.md` (9 puntos de arriba).
- [ ] Commit, push, abrir PR, pasar el link.
