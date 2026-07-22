# Fase 3 — Detalle de producto interactivo + Carrito

### Progreso

- Sin empezar. Este archivo es el plan aprobado, punto de partida para
  implementar.

## Context

Fases 0-2 dejaron el marketplace de solo lectura: `ProductDetailScreen`
muestra nombre/precio/grupos de variantes como chips informativos, sin
selector ni botón "Agregar" (decisión explícita de Fase 2, ver
`docs/phases/phase-2-marketplace.md` — se pateó para no construir un
estado de selección/cantidad que probablemente hubiera que rehacer antes
de que esta fase definiera el shape real de una línea de carrito). El
header de Home también dejó recortado el ícono/badge de carrito por la
misma razón: sin destino.

Esta fase cierra ese loop: el producto se vuelve seleccionable, aparece el
primer estado de cliente global del proyecto (Zustand — sesión sigue
siendo de Clerk, el carrito es el primer caso real de "estado que no es
servidor"), y se agregan los dos puntos de entrada al carrito que el
prototipo ya diseña (ícono+badge en Home, barra inferior contextual en
Business Detail). **Sin checkout** — el carrito no tiene botón de pagar
todavía; ese CTA y su destino son de la Fase 4.

Regla de negocio dura confirmada con el usuario: **el carrito es
mono-negocio** (`Order.businessId` es 1:1 en el backend). Agregar un
producto de otro negocio con el carrito no vacío dispara un diálogo de
confirmación antes de vaciar y empezar de cero.

## Decisiones de producto/alcance (confirmadas con el usuario)

- **Persistencia**: `zustand/middleware persist` sobre
  `@react-native-async-storage/async-storage` (nueva dependencia — no
  reusar `expo-secure-store`, que es para tokens/datos sensibles y no el
  storage general que pide el plan para "flags no sensibles"). El carrito
  sobrevive cierres de la app. Trade-off aceptado: una línea persistida
  puede quedar con precio/nombre desactualizados si el negocio cambió el
  catálogo entre sesiones — inofensivo, porque `POST /orders` (Fase 4)
  recalcula todo server-side y el backend valida stock/`isOpen`/mínimo en
  ese momento; la UI de Fase 4 ya tiene que manejar el 409 de "no
  disponible" de todos modos.
- **Modelo de variantes**: el selector se diseña **solo para el primer
  grupo de variantes** de un producto, en el modelo "cantidad por opción"
  (igual que el prototipo y la Paletería real: 7 sabores, cada uno con su
  propio stepper). Cada opción con cantidad>0 al agregar se convierte en
  su propia línea de carrito → su propio item de `POST /orders`
  (`{productId, variantOptionId, quantity}`). Productos sin variantes usan
  un stepper simple (una sola línea, sin `variantOptionId`).
  - **Gap de contrato a reportar (no bloquea esta fase)**: el DTO permite
    que un producto tenga 2+ `variantGroups`, pero `POST /orders` solo
    acepta un `variantOptionId` por item — un producto multi-grupo no
    sería representable como pedido. Si en desarrollo aparece un producto
    real con `variantGroups.length > 1`, la UI usa solo el primer grupo e
    ignora el resto (con un `console.warn` en `__DEV__`, no un crash) —
    queda anotado como gap a validar con el backend (¿debería
    forzar máximo 1 grupo por producto?), no se resuelve acá.
- **Opciones con `stock: 0`**: se muestran deshabilitadas con label
  "Agotado" (sin stepper interactivo en esa fila). La validación real de
  stock la hace el backend en Fase 4 — esto solo evita el intento obvio.
  Mismo criterio para el stepper simple: si `product.stock !== null`, el
  incremento se cappea en ese valor.
- **Diálogo de cambio de negocio**: `Alert.alert` nativo (sin dependencia
  nueva ni modal a medida) — "¿Vaciar el carrito y empezar en
  {businessName}?" con botones "Cancelar" / "Vaciar y agregar". Se activa
  solo cuando el carrito tiene líneas de OTRO negocio; mismo negocio o
  carrito vacío agrega directo.
- **Carrito sin CTA de pagar esta fase**: `CartScreen` muestra líneas
  editables, banner de mínimo y subtotal, pero **sin botón "Ir a pagar"**
  (ni siquiera deshabilitado) — no tiene destino hasta Fase 4 (mismo
  criterio que ya usó Fase 2 para cortar el banner de Home sin carrito).
  Se agrega el botón cuando Checkout exista.
- **Quitar una línea = decrementar hasta 0`** (sin ícono de basura
  separado): al llegar a cantidad 1, el stepper decrementa y la línea
  desaparece. Decisión de UX simple, sin control extra en la fila —
  reversible con un tap si fue sin querer (falta 0 pasos, se vuelve a
  agregar desde Product Detail).
- **Vuelta a Business Detail tras agregar**: `router.back()` después de un
  "Agregar" exitoso — el feedback es la barra inferior/badge
  actualizándose al instante (estado optimista, sin red), no un toast
  nuevo.
- **`minOrderCents` en el carrito**: se resuelve vía `useBusiness(cart.businessId)`
  (hook ya existente de Fase 2, con su propio loading/cache) — fuente de
  verdad fresca en vez de confiar en un valor persistido. Si el negocio ya
  no existe o dejó de estar `ACTIVE` (404 por contrato), se trata como "no
  existe": `ErrorState` diseñado ("Este negocio ya no está disponible")
  con acción para vaciar el carrito — no pantalla en blanco ni crash.
  Mientras la query resuelve, el nombre de negocio persistido en el store
  se usa como fallback instantáneo para evitar un parpadeo en el header de
  la pantalla.
- **Logout limpia el carrito** (condición de la decisión de persistencia,
  agregada en la aprobación): un carrito persistido que sobrevive a un
  cierre de sesión es un dato de OTRO usuario en el próximo login del
  dispositivo — `clearCart()` se cablea al único punto de logout que
  existe hoy (`signOut` en el header de `HomeScreen`, ver Fase 2). Testeado
  en dos partes: `cartStore.test.ts` confirma que `clearCart()` deja el
  estado (y lo persistido) vacío; `HomeScreen.test.tsx` (nuevo, no existía)
  confirma que el handler de sign-out invoca `clearCart()` además de
  `signOut()`.
- **Clave de AsyncStorage con namespace propio**: `@cerquita/cart` (prefijo
  del `scheme`/slug del proyecto, `app.config.ts`). Verificado por grep que
  hoy no existe ningún uso de `AsyncStorage` en el repo (Clerk usa
  `expo-secure-store`, no hay colisión posible).

## Shape de una línea de carrito (mirando a Fase 4)

```ts
// src/features/cart/store/cartStore.ts
export type CartLine = {
  key: string; // `${productId}|${variantOptionId ?? ''}` — identidad de línea
  productId: string;
  variantOptionId?: string;
  quantity: number;
  // denormalizado: la UI y la persistencia entre reinicios no dependen
  // de que la cache de productos de TanStack Query esté caliente
  productName: string;
  variantOptionName?: string;
  photoUrl: string | null;
  unitPriceCents: number; // priceCents + priceDeltaCents, calculado al agregar
};

export type CartState = {
  businessId: string | null;
  businessName: string | null;
  lines: CartLine[];
};
```

`unitPriceCents` × `quantity` con `formatMoneyCents` da el subtotal por
línea; `lines.reduce(...)` da el subtotal del carrito. Todo en centavos
enteros, nunca floats — ya lo obliga `formatMoneyCents` existente
(`src/shared/utils/money.ts`), que se reusa tal cual.

Comentario que va en el store (justifica por qué no hay revalidación de
precios en el cliente): _"persistencia segura porque `POST /orders`
recalcula todo server-side — no agregar revalidación de precios en el
cliente"_.

## Decisiones de arquitectura

- **Zustand + persist es el primer estado de cliente global del
  proyecto** — vive en `src/features/cart/store/cartStore.ts` (no
  `shared/`: el carrito es un dominio de un solo feature, no transversal
  como sesión). Acciones: `addLine`, `updateQuantity` (cantidad ≤0 =
  remueve, una sola fuente de verdad para "quitar"), `removeLine`,
  `clearCart`. Selectores puros exportados aparte (no como parte del
  store): `subtotalCents(lines)`, `itemCount(lines)`,
  `wouldReplaceCart(state, businessId)` — el store queda tonto/testeable,
  la decisión de mostrar el diálogo la orquesta la pantalla.
- **`Stepper` nuevo en `shared/ui`** (no en `features/cart` ni
  `features/marketplace`): se usa desde el arranque en 3 lugares (filas de
  opción en Product Detail, cantidad simple en Product Detail, líneas de
  `CartScreen`) — cumple la regla de "se extrae cuando se repite" desde el
  día uno, no es especulativo. Props mínimas: `value`, `onIncrement`,
  `onDecrement`, `disabled?`, `max?`. Botones visual 36px con `hitSlop`
  para llegar al mínimo táctil de 44pt sin agrandar el diseño.
- **`buildCartLines` (pure function) en
  `src/features/marketplace/utils/`**: convierte `Product` + estado de
  selección (mapa de cantidades por `optionId`, o una cantidad simple) en
  `CartLine[]`. Vive en `marketplace` (quien posee `Product`) e importa el
  tipo `CartLine` de `cart`. Extraído para poder testearlo sin montar
  `ProductDetailScreen` — mismo patrón que `getNextCursorParam` en Fase 2.
- **`ProductDetailScreen` dejó de ser presentacional puro** → gana estado
  de selección y lógica de armado de líneas; esa lógica no trivial vive en
  `buildCartLines` (testeado), el componente queda como orquestador fino
  (no testeado directo, mismo criterio que las pantallas de Fase 2 que
  solo hacen wiring).
- **Sin `FlashList` en `CartScreen`**: la lista de líneas del carrito está
  acotada (backend acepta 1-50 items por pedido, en la práctica muchas
  menos) y no es paginada — es una excepción consciente a la regla de
  "toda lista con FlashList", que apunta a listas potencialmente largas de
  negocios/productos/pedidos. Un `.map` dentro de `ScrollView` es más
  simple y no paga el costo de virtualización por cero beneficio real.
- **Barra "Ver mi carrito" de `BusinessDetailScreen`** se muestra solo
  cuando `cart.businessId === business.id` actual y hay líneas — si el
  carrito tiene otro negocio, no aparece una barra confusa (refuerza
  visualmente el invariante mono-negocio en vez de solo prevenirlo).

## Trampas de RN/Expo a evitar (proactivo)

- El middleware `persist` de Zustand con AsyncStorage es async — el store
  arranca "hidratando"; cualquier lectura del carrito antes de hidratar
  vería el estado inicial vacío por un instante. Irrelevante para esta
  fase (nada bloquea el arranque en un carrito vacío momentáneo), pero se
  documenta con un comentario en el store para que Fase 4 no lo redescubra
  como bug.
- `partialize` explícito en `persist` — solo `{businessId, businessName,
lines}` va a disco; nada de estado derivado (subtotales, etc. son
  selectores puros, no estado).
- Selectors de Zustand granulares en el badge del header (`itemCount`) —
  ese componente rerenderiza en cada tap de stepper en cualquier pantalla,
  así que no debe suscribirse al store completo (evita re-render de todo
  `HomeScreen` por un cambio de cantidad en Product Detail).
- `Alert.alert` no tiene estilos custom — confirmar que el copy quepa sin
  truncarse con nombres de negocio largos (probar con "Paletería Lili" y
  algo más largo).

## Checkpoints

### Checkpoint A — Store del carrito

- Instalar `zustand`, `@react-native-async-storage/async-storage` (`npx
expo install`).
- `src/features/cart/store/cartStore.ts` (+ test) — `CartLine`/`CartState`,
  acciones (`addLine`, `updateQuantity`, `removeLine`, `clearCart`),
  selectores puros (`subtotalCents`, `itemCount`, `wouldReplaceCart`),
  persist con AsyncStorage (clave `@cerquita/cart`) y `partialize`.
  `clearCart()` es la acción que Checkpoint C cablea al logout — test acá
  confirma que deja el estado (y lo persistido) vacío.
- Gate: typecheck + tests del store. Sin verificación visual (no hay UI
  todavía).

### Checkpoint B — Product Detail interactivo

- `src/shared/ui/Stepper.tsx` (+ test), exportado desde `shared/ui/index.ts`.
- `src/features/marketplace/utils/buildCartLines.ts` (+ test).
- Reescribir `ProductDetailScreen.tsx`: selector "cantidad por opción" (o
  stepper simple sin variantes), filas con `stock:0` deshabilitadas
  ("Agotado"), label dinámico del botón "Agregar" (igual criterio que el
  prototipo: cuenta + subtotal, o "Elegí al menos una opción"
  deshabilitado), `useBusiness(businessId)` para nombre de negocio,
  diálogo `Alert.alert` de cambio de negocio, `router.back()` tras agregar.
- Gate: typecheck + tests afectados. Reporte de qué verificar visualmente
  antes de seguir.

### Checkpoint C — Pantalla de carrito + puntos de entrada

- `src/features/cart/components/CartLineRow.tsx` — thumbnail (photoUrl vía
  expo-image o fallback, mismo patrón que el hero de Product Detail),
  nombre, variante, `Stepper`, subtotal de línea.
- `src/features/cart/screens/CartScreen.tsx` — `EmptyState` ("Tu carrito
  está vacío"), líneas editables, banner de mínimo
  (`needsMore`/`amountNeeded`), subtotal, `ErrorState` si el negocio del
  carrito ya no está disponible. Sin CTA de pagar (ver Decisiones).
- `app/(app)/cart.tsx` — ruta nueva, renderiza `CartScreen`.
- `HomeScreen.tsx`: ícono de carrito + badge (`itemCount`) junto al botón
  de logout existente en el header (no lo reemplaza); el handler de
  sign-out pasa a llamar `clearCart()` además de `signOut()`.
- `HomeScreen.test.tsx` (nuevo) — test puntual: presionar el botón de
  logout invoca `clearCart()` del store del carrito además de `signOut()`
  de Clerk.
- `BusinessDetailScreen.tsx`: barra inferior "Ver mi carrito" (condición
  en Decisiones de arquitectura).
- Gate: typecheck + tests afectados + **suite completa** (`pnpm test`) +
  `pnpm lint` + `pnpm exec tsc --noEmit` + `expo-doctor` como cierre de
  fase.

## Archivos clave

- Crear: `src/features/cart/store/cartStore.ts` (+ test),
  `src/features/cart/components/CartLineRow.tsx`,
  `src/features/cart/screens/CartScreen.tsx`,
  `src/features/marketplace/utils/buildCartLines.ts` (+ test),
  `src/shared/ui/Stepper.tsx` (+ test), `app/(app)/cart.tsx`,
  `src/features/marketplace/screens/HomeScreen.test.tsx` (nuevo).
- Modificar: `src/features/marketplace/screens/ProductDetailScreen.tsx`
  (reescritura sustancial), `src/features/marketplace/screens/HomeScreen.tsx`
  (header + logout limpia el carrito),
  `src/features/marketplace/screens/BusinessDetailScreen.tsx`
  (barra inferior), `src/shared/ui/index.ts`, `package.json`.
- Reusar tal cual: `Button`/`EmptyState`/`ErrorState`/`Text`
  (`shared/ui`), `formatMoneyCents` (`shared/utils`), `useBusiness`
  (`marketplace/hooks`), `useCachedProduct`, `FloatingBackButton`, tokens
  de `theme.ts`.

## Verificación

- **Automática (Claude)**: tests por path durante desarrollo; suite
  completa + lint + typecheck + `expo-doctor` una sola vez al cierre
  (Checkpoint C).
- **Visual (usuario)** — Paletería Lili real, ambos teléfonos:
  1. Abrir el producto de 7 sabores: cada opción tiene su propio stepper;
     incrementar un par de sabores y ver el botón "Agregar" actualizar
     cuenta y subtotal en vivo.
  2. Agregar un producto sin variantes (ej. Chocobanano liso): stepper
     simple, botón "Agregar · $X.XX".
  3. Volver a Business Detail: aparece la barra inferior "Ver mi carrito"
     con el conteo y subtotal correctos; el badge del ícono de carrito en
     Home también se actualizó.
  4. Entrar a otro negocio y intentar agregar un producto: aparece el
     diálogo "¿Vaciar el carrito y empezar en X?"; confirmar vacía el
     carrito anterior y agrega el nuevo.
  5. Abrir el carrito: editar cantidades (+/-), decrementar una línea
     hasta que desaparezca, ver el banner de "faltan $X para el mínimo"
     si el subtotal es bajo, subtotal correcto contra los precios reales
     del negocio.
  6. Cerrar la app por completo y reabrirla: el carrito persiste.

## Notas / backlog

- **Gap de contrato a reportar**: `variantGroups` permite 2+ grupos por
  producto pero `POST /orders` solo admite un `variantOptionId` por item
  — no hay forma de pedir un producto multi-grupo. No bloquea esta fase
  (se usa solo el primer grupo); reportar al backend si aparece un
  producto real con 2+ grupos.
- **Fuera de esta fase**: CTA "Ir a pagar" y toda la pantalla de checkout
  (Fase 4), validación real de `minOrderCents`/stock/`isOpen` (la hace el
  backend vía 409 en Fase 4).

## Notas de git / permisos

- Rama `phase-3-cart`, ya creada por el usuario desde `main` actualizado
  (post-merge de Fase 2) — confirmado en el estado de git al iniciar esta
  sesión.
- No se crean/leen archivos `.env*`. No `eas build`/`submit`. No `git push`.
- Commits: conventional, un commit por checkpoint
  (`feat(cart): ...`), sin trailer de co-autoría ni atribución a Claude.
