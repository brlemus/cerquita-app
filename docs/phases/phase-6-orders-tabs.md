# Fase 6a — Tab bar definitiva + "Mis pedidos"

### Progreso

- **Plan aprobado**, con un ajuste: `ProfileScreen` stub **sin** el renglón
  "Más opciones pronto" — la pantalla debe verse deliberadamente simple
  (avatar/inicial, nombre, email, Cerrar sesión), no anunciar lo que falta.
  Sección del Checkpoint A actualizada más abajo.
- **Checkpoint A — código listo, gate automático cerrado**: `(tabs)` group
  nuevo (`_layout.tsx` con `<Tabs>`, 3 iconos SVG propios en `icons.tsx`),
  `index.tsx` movido dentro del grupo (ruta `/` sin cambios), `orders.tsx`
  nuevo apuntando a un `OrdersScreen` **placeholder** (header + spinner —
  el Checkpoint B lo reemplaza entero, no queda código muerto), `profile.tsx`
  nuevo → `ProfileScreen` stub (avatar con inicial, nombre/email de Clerk
  `useUser()`, botón "Cerrar sesión" reusando `useLogout()` + `clearCart()`
  — sin el renglón "más opciones", según el ajuste aprobado). Logout
  temporal y `SignOutIcon` sacados de `HomeScreen` (+ estilo `iconButton`
  que quedaba huérfano). `Tabs.Screen.tabBarIcon` tipa `color` como
  `ColorValue` (no `string`) -- cast puntual documentado con comentario,
  no afecta runtime (siempre pasamos nuestros hex estáticos). Gate:
  `tsc --noEmit` limpio, `pnpm run lint` (`expo lint`) limpio.
- **Checkpoint A — cerrado del todo**: gate visual tuyo en dispositivo, sin
  regresiones.
- **Checkpoint B — código listo, gate automático cerrado**: `getOrders`
  (`GET /orders`) + `useOrders` (`useInfiniteQuery`, mismo patrón que
  `useBusinesses`/`getNextCursorParam` de `marketplace`, reusado tal cual).
  `orderStatus.ts` suma `statusBadgeStyle`/`statusBadgeLabel` (`CANCELADO`
  reusa `surface.subtle` como fondo -- mismo criterio que el hero card
  cancelado de `OrderTrackingScreen`, no existe un tinte de `danger` en
  TOKENS.md) y `shortOrderId` -- extraído de la duplicación que ya tenían
  `OrderConfirmationScreen`/`OrderTrackingScreen` (ahora 3er uso real,
  aplica la regla de extracción del proyecto). `formatOrderDate` nuevo en
  `shared/utils/date.ts` (tabla de meses en español propia, sin depender
  de `Intl`). `OrderStatusBadge`/`OrderRow`/`OrderRowSkeleton` nuevos
  (mismo patrón visual que `RatingBadge`/`BusinessCard`/
  `BusinessCardSkeleton`). `OrdersScreen` reescrita entera: FlashList +
  escalera de estados (patrón `SearchScreen`), pull-to-refresh vía
  `refreshing`/`onRefresh` de FlashList (no `RefreshControl` manual --
  `HomeScreen` ya usa ese mismo prop nativo, se sigue el patrón real del
  repo en vez de lo escrito literal en el plan), refetch-on-focus vía
  `useFocusEffect` con guard de primer-foco + `ref` actualizado en
  `useEffect` (no durante el render, ver bug abajo).

  **Dos bugs reales encontrados y resueltos en el gate, no anticipados en
  el plan**:
  1. `icons.tsx` de los tabs vivía en `app/(app)/(tabs)/icons.tsx` --
     Expo Router escanea **todo** archivo bajo `app/` como ruta candidata
     (no solo los que exportan una pantalla), así que apareció una ruta
     fantasma `/icons` en los tipos generados. Movido a
     `src/shared/navigation/icons.tsx` (primer uso de esa carpeta --
     chrome de navegación transversal, no pertenece a ningún feature ni a
     `shared/ui` genérico).
  2. Mover `index.tsx` adentro de `(tabs)` invalidó el href `/(app)`
     (usado por `app/sso-callback.tsx` y `app/(auth)/_layout.tsx` para
     redirigir tras login) -- el grupo `(app)` ya no tiene índice propio,
     solo el anidado `(tabs)`. Corregido a `/` (el path real, más
     correcto que el atajo de grupo que ya no resuelve).
  - Lint nuevo (`react-hooks/refs`, no estaba en el radar): asignar
    `ref.current` durante el render (para trackear el `refetch` más
    reciente) ahora es error -- movido a un `useEffect`.
  - `HomeScreen.test.tsx` (single-purpose: testeaba el logout que se sacó
    en el Checkpoint A) migrado entero a
    `src/features/profile/screens/ProfileScreen.test.tsx`, sumando un
    test de que el nombre/email se muestran.
  - `PLAN_MOBILE_CERQUITA.md` actualizado: partición 6a/6b en la tabla de
    fases, fila de tab bar marcada como construida, gap nuevo de
    `businessName` ausente en `GET /orders` anotado en paridad.

  Gate: `tsc --noEmit` limpio, `pnpm run lint` limpio, suite completa
  **46/46 -- 232/232 tests**. Pendiente: tu verificación visual final.

- **Trabajo encolado, fuera de esta fase** (chore aparte, PR propio, no se
  toca hasta confirmar el merge de la 6a): integración del ícono oficial de
  Cerquita desde `design_handoff_cerquita_icon/` (raíz del repo) — mover los
  3 SVG + README a `assets/brand/`, generar `icon.png`/`adaptive-icon.png`/
  `adaptive-icon-monochrome.png`/`notification-icon.png`, cablear
  `app.config.js` (icon, adaptive icon Android, ícono/color de
  notificaciones, revisar splash). Detalle completo de specs (paddings,
  safe zone del adaptive icon, tamaños) ya recibido del usuario, se retoma
  en su propio documento/PR cuando toque.

## Context

El plan maestro define la **Fase 6 = Historial + Reviews + Feedback**, pero se
acota esta sesión a lo que el prototipo ancla como estructura de primer nivel:
la **tab bar definitiva** y la pantalla **"Mis pedidos"** (historial), con
navegación desde cada pedido al tracking ya existente (Fase 5). Reviews
(post-`ENTREGADO`) y Feedback general **se difieren a una Fase 6b** (PR aparte)
— comparten poco con esto y meterlos acá rompe el presupuesto de tiempo
acordado (~30-50 min de implementación).

Por qué ahora: hasta hoy la app es un stack sin tab bar (la Fase 2 difirió el
shell de tabs porque "destinos vacíos no se justifican" —
`docs/phases/phase-2-marketplace.md`). **Pedidos es el primer
segundo-destino real de primer nivel** — es el momento acordado (tabla de
paridad de `PLAN_MOBILE_CERQUITA.md`) para fijar la tab bar e integrar las
pantallas existentes. Además, `GET /orders` (historial) no está cableado en
el repo todavía: se construye desde cero reusando el patrón de lista
paginada que ya existe en `marketplace`.

**Decisión de producto tomada con el usuario**: **3 tabs
(Inicio/Pedidos/Perfil)** con **Perfil como stub mínimo** esta fase
(nombre/email de Clerk + cerrar sesión), moviendo el logout temporal fuera
del header de Home. El contenido real de Perfil (borrado de cuenta, privacy
policy) sigue siendo Fase 7 — el stub no la adelanta, solo le da un destino
real a la tab.

## Gaps de contrato (documentados, no se inventan)

- **Nombre/logo del negocio en la fila de pedido**: el DTO `Order` de
  `GET /orders` trae `businessId` pero **no** `businessName`/`logoUrl`.
  Mostrarlos exigiría un fetch por pedido (N+1) — anti-patrón, descartado.
  La fila se arma con lo que el DTO sí da: estado, fecha, resumen de ítems
  (`items[].productName` + conteo) y `totalCents`. El nombre del negocio
  queda como **gap de backlog** (necesita que el backend sume el campo al
  DTO de `Order`) — se anota en `PLAN_MOBILE_CERQUITA.md` (tabla de
  paridad) al cerrar esta fase.

## Alcance (partición)

- **Esta fase (6a)**: tab bar + Mis pedidos + navegación a tracking.
- **Fase 6b (PR aparte, no arranca en esta sesión)**: review post-`ENTREGADO`
  (`POST /orders/:id/reviews`, una por pedido) + feedback general
  (`POST /feedback`).

## Checkpoints

### Checkpoint A — Tab bar definitiva (3 tabs)

Estructura Expo Router: introducir un grupo `(tabs)` **dentro** de `(app)`
(debajo de `AccountGate`, sin tocar el gating existente). El resto de rutas
(`search`, `cart`, `checkout`, `orders/[orderId]`, `business/...`,
`addresses/...`) quedan como hermanas del grupo `(tabs)` en el Stack de
`(app)` → se **pushean por encima** de la tab bar (full screen, sin tabs),
igual que hoy y como el prototipo espera (tracking y product detail no
llevan tab bar).

- `app/(app)/(tabs)/_layout.tsx` — **nuevo**. `<Tabs>` de `expo-router`
  (`screenOptions`: `headerShown:false`, `tabBarActiveTintColor:
colors.brand.default`, `tabBarInactiveTintColor: colors.text.secondary`,
  `tabBarStyle` con `borderTopColor: colors.border.default` y fondo
  `surface.default`; los insets inferiores los maneja el propio `Tabs`).
  3 screens: `index` (Inicio), `orders` (Pedidos), `profile` (Perfil).
- `app/(app)/(tabs)/index.tsx` — **mover** desde `app/(app)/index.tsx` (ruta
  sigue siendo `/`, renderiza `HomeScreen`). Todos los `router.replace('/')`
  del repo siguen resolviendo igual (checkout, orders, confirmation).
- `app/(app)/(tabs)/orders.tsx` — **nuevo**, ruta `/orders` → `OrdersScreen`
  (Checkpoint B). No colisiona con `app/(app)/orders/[orderId].tsx` (`/orders`
  vs `/orders/:orderId`, carpetas distintas).
- `app/(app)/(tabs)/profile.tsx` — **nuevo**, ruta `/profile` →
  `ProfileScreen` stub (`src/features/profile/screens/ProfileScreen.tsx`):
  nombre/email vía Clerk `useUser()` (sin llamada nueva al API), botón
  **Cerrar sesión** reusando `useLogout()` (`src/features/auth/hooks`) +
  `clearCart()` (mismo par que hace hoy el header de Home). Deliberadamente
  simple: avatar/inicial + nombre + email + Cerrar sesión, nada más — sin
  anunciar funcionalidad futura. Header propio + `SafeAreaView
edges={['top']}`.
- **Iconos de tab** (3 SVG nuevos con prop `color`, patrón de los icons
  existentes de `marketplace`/`checkout`): `HomeIcon`, `OrdersIcon`
  (recibo/lista), `ProfileIcon` (persona). Co-locados en
  `app/(app)/(tabs)/icons.tsx` (chrome de navegación, no se comparte con
  features). `tabBarIcon` los usa pasando el `color` del estado
  activo/inactivo que da `expo-router`.
- **Quitar el logout temporal del header de Home** (`HomeScreen.tsx:118` +
  `SignOutIcon` local línea 24) — ahora vive en Perfil. Verificar que no
  quede ícono/handler muerto.

Gate A: `pnpm exec tsc --noEmit` + lint. Verificación visual (usuario): tab
bar visible en las 3 tabs, ícono activo en `brand`, Home intacto sin el
botón de logout viejo, Perfil muestra nombre/email y cierra sesión;
pushear a un producto/tracking cubre la tab bar (no queda debajo por
edge-to-edge).

### Checkpoint B — "Mis pedidos" (lista + estados + navegación)

Datos (espejo del patrón de `marketplace`: `useBusinesses`/`getBusinesses`/
`pagination.ts`):

- `src/features/orders/api/getOrders.ts` — `GET /orders` con
  `buildQueryString({cursor, limit})`, devuelve `PaginatedResponse<Order>`
  (tipos ya en `src/shared/api/types.ts`).
- `src/features/orders/hooks/useOrders.ts` — `useInfiniteQuery`, queryKey
  `['orders','list']`, `getNextPageParam: getNextCursorParam`
  (`src/features/marketplace/api/pagination.ts`, ya genérico),
  `initialPageParam: undefined`. **Infinite scroll** (el contrato pagina
  por cursor — es la opción correcta, no paginación manual). Test unitario
  del hook (mismo estilo que los tests de hooks existentes de orders).

Presentación:

- `src/features/orders/utils/orderStatus.ts` — agregar `statusBadgeStyle`
  (map estado → `{bg, fg}` con tokens: en curso `PENDIENTE/PREPARANDO/
EN_CAMINO` → `brand.tint`/`brand.dark`; `ENTREGADO` → `success.bg`/
  `success.default`; `CANCELADO` → `danger`-tint/`danger.default`) y
  `statusBadgeLabel` (etiqueta corta por estado, incluye `CANCELADO` que
  `ORDER_STEPS` no cubre). Puro, **testeado** en el `orderStatus.test.ts`
  existente. Reusar el formato de `shortId` de `OrderConfirmationScreen`
  (extraerlo a este util si simplifica sin costo extra).
- `src/shared/utils/date.ts` — **nuevo** `formatOrderDate(iso)` puro y
  testeado (ej. `"24 jul · 14:30"`, meses en español vía array propio para
  no depender de locale de `Intl`). Único formateador de fecha del repo —
  vive en `shared/utils` por ser transversal.
- `src/features/orders/components/OrderStatusBadge.tsx` — pill compacto
  (`radius.full`, tokens de `statusBadgeStyle`), patrón visual de
  `RatingBadge`.
- `src/features/orders/components/OrderRow.tsx` — fila pressable →
  `router.push('/orders/${order.id}')` (mismo path que ya usa la app):
  `OrderStatusBadge` + `Pedido #{shortId}` + resumen de ítems
  (`items[0].productName` + "y N más" si aplica) + `formatOrderDate` +
  `formatMoneyCents(totalCents)` + chevron. `renderItem` memoizado
  (`useCallback`), `keyExtractor={item.id}`.
- `src/features/orders/components/OrderRowSkeleton.tsx` — compuesto de
  `Skeleton`, patrón de `BusinessCardSkeleton`.
- `src/features/orders/screens/OrdersScreen.tsx` — `FlashList` (v2, sin
  `estimatedItemSize`, **nunca** dentro de scroll/`KeyboardAwareScreen`).
  Escalera de estados **antes** del FlashList (patrón de `SearchScreen`):
  `isPending` → N `OrderRowSkeleton`; `isError` → `ErrorState` con retry;
  else `FlashList` con:
  - `ListEmptyComponent` = `EmptyState` ("Todavía no hiciste ningún
    pedido", acción "Explorar negocios" → `router.replace('/')`).
  - `ListFooterComponent` = `ActivityIndicator` mientras
    `isFetchingNextPage`.
  - `onEndReached`/`onEndReachedThreshold=0.5` → `fetchNextPage` guardado
    por `hasNextPage && !isFetchingNextPage`.
  - **Pull-to-refresh**: `RefreshControl` (primer uso en el repo) →
    `refetch()`, spinner con `isRefetching`.
  - **Refetch on focus**: `useFocusEffect` (`expo-router`) → `refetch()`
    al enfocar la tab, para reflejar cambios de estado al volver del
    tracking. Coherente con el patrón de foco existente (el polling
    por-pedido sigue siendo de la pantalla de tracking; la lista no
    polea).
    Header propio + `SafeAreaView edges={['top']}`.

Gate B (cierre de fase): `pnpm exec tsc --noEmit` + lint + **suite
completa** (`pnpm exec jest`). Verificación visual (usuario): lista en
orden cronológico con badges correctos por estado, skeleton→datos, empty
state con acción, pull-to-refresh, scroll infinito, tap → tracking, y al
volver del tracking la lista refleja el estado nuevo.

## Archivos clave

Nuevos: `app/(app)/(tabs)/_layout.tsx`, `app/(app)/(tabs)/orders.tsx`,
`app/(app)/(tabs)/profile.tsx`, `app/(app)/(tabs)/icons.tsx`,
`src/features/profile/screens/ProfileScreen.tsx`,
`src/features/orders/api/getOrders.ts`,
`src/features/orders/hooks/useOrders.ts`,
`src/features/orders/components/{OrderRow,OrderRowSkeleton,OrderStatusBadge}.tsx`,
`src/features/orders/screens/OrdersScreen.tsx`, `src/shared/utils/date.ts`.

Mover: `app/(app)/index.tsx` → `app/(app)/(tabs)/index.tsx`.

Editar: `src/features/orders/utils/orderStatus.ts` (+ su test),
`src/features/marketplace/screens/HomeScreen.tsx` (quitar logout temporal),
barrels (`src/features/orders/*`, `src/shared/utils/index.ts`),
`PLAN_MOBILE_CERQUITA.md` (gap de nombre de negocio + partición 6a/6b).

## Patrones a reusar (no reinventar)

- Lista paginada: `useBusinesses`/`getBusinesses`/`pagination.ts`
  (`src/features/marketplace/`) — copiar el patrón de `useInfiniteQuery`.
- Escalera de estados de lista: `SearchScreen.tsx`.
- Dinero: `formatMoneyCents` (`src/shared/utils/money.ts`).
- Logout: `useLogout()` (`src/features/auth/hooks`) + `clearCart()`.
- Navegación a tracking: `router.push('/orders/${id}')`.
- UI: `Skeleton`, `EmptyState`, `ErrorState`, `Text`, `Button`, tokens de
  `theme.ts`; pill de `RatingBadge`.
- Bottom inset: si algún elemento se ancla al borde inferior,
  `useBottomInset` (acá el `Tabs` ya cubre el inset de la tab bar; la
  lista no ancla nada propio).

## Verificación end-to-end

- Automático: `pnpm exec tsc --noEmit`, lint, y por checkpoint los tests
  afectados (`pnpm exec jest src/features/orders src/shared/utils`);
  suite completa como gate de cierre.
- Manual (usuario, en dev build/simulador): recorrer las 3 tabs;
  crear/abrir pedidos y verlos en Mis pedidos en orden cronológico con el
  badge correcto; pull-to-refresh; scroll infinito si hay >20 pedidos; tap
  en un pedido → tracking; cambiar el estado desde el backend (o cancelar)
  y confirmar que al volver a la tab la lista refleja el estado nuevo;
  empty state en una cuenta sin pedidos; logout desde Perfil.

## Git

Rama/PR: los define el usuario (no se ramifica ni se pushea sin
confirmación). Un PR para la Fase 6a. Conventional commits (ej.
`feat(orders): add order history list`, `feat(navigation): add bottom tab
bar`). Sin trailer de co-autoría.
