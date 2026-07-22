# Fase 2 — Marketplace (Home, búsqueda, categorías, detalle de negocio)

### Progreso

- **CP0** — cerrado (commit `fix(auth)`), verificado en dispositivo por el
  usuario: Google en Android completa el flujo OAuth y aterriza logueado en
  Home; iOS sin regresión.
- **Checkpoint A** — cerrado. `@shopify/flash-list` 2.0.2, `expo-image`
  ~3.0.11 instaladas (`expo-doctor` 18/18). DTOs de marketplace en
  `src/features/marketplace/api/types.ts`. `buildQueryString`
  (`shared/api/queryString.ts`), `formatMoneyCents` (`shared/utils/money.ts`),
  `useDebounce` (`shared/hooks/useDebounce.ts`), todos con tests. Typecheck +
  suite de `shared/` en verde (40 tests).
- **Checkpoint B** — cerrado. `Skeleton` (`Animated` nativo, pulso de
  opacidad), `EmptyState`, `ErrorState` (generaliza el bloque inline que
  tenía `AccountGate.tsx`) en `shared/ui/`, exportados desde el barrel. Nota
  de tooling: React Native Testing Library v13 excluye por default los
  elementos marcados `accessibilityElementsHidden` de las queries (incluido
  `getByTestId`) — los tests de `Skeleton` necesitan
  `{ includeHiddenElements: true }` explícito. Typecheck + tests en verde
  (10 tests nuevos).
- **Checkpoint C** — cerrado. `getBusinesses`/`getBusinessById`/
  `getBusinessProducts`/`getPlatformCategories` (`marketplace/api/`) +
  `getNextCursorParam` (`pagination.ts`, con test); hooks `useBusinesses`
  (infinite, `keepPreviousData`, `search`/`platformCategoryId`
  normalizados), `useBusiness`, `useBusinessProducts` (infinite),
  `usePlatformCategories` (`staleTime` 10 min) en `marketplace/hooks/`. Los
  4 hooks no tienen test directo -- mismo criterio que `useAuthMe` (wiring
  fino de TanStack Query sin ramificación propia; la lógica no trivial ya
  está testeada en los wrappers de API y en `getNextCursorParam`).
  Typecheck + tests en verde (18 tests nuevos).
- **Checkpoint D** — cerrado. `AvatarFallback` (logo real vía expo-image o
  monograma de iniciales), `RatingBadge` ("★ 4.9 (128)" / pill "Nuevo"),
  `ClosedPill`, `BusinessCard` + skeleton, `CategoryChips` (categorías
  reales + chip "Todos"), `icons.tsx` (`SearchIcon`/`BackIcon`, extraídos
  ya que se reusan en Search y en Business Detail). `HomeScreen` reemplaza
  el placeholder (`app/(app)/index.tsx`): FlashList de negocios, chips,
  barra de búsqueda no editable, pull-to-refresh, skeleton/empty/error,
  botón de logout reubicado. `SearchScreen` (`app/(app)/search.tsx`):
  input debounced (300ms), sin `KeyboardAwareScreen` (FlashList adentro
  rompería la virtualización), estado de "sin query todavía" vs "sin
  resultados". Ajuste chico a `useBusinesses`: nuevo param `enabled`
  (Search no debe pegarle al backend con query vacía). Nota de producto:
  el prototipo mostraba un rango ficticio de tiempo de entrega ("20-35
  min") sin campo real que lo respalde -- se usa `prepTimeMinutes` tal
  cual lo da el contrato (un número), no un rango inventado.
- **Checkpoint E** — cerrado (implementado junto con D: `HomeScreen`/
  `SearchScreen` ya navegaban a `/business/[businessId]`, y el
  typed-routes de Expo Router no compila con una ruta que todavía no
  existe -- se resolvió el orden real de dependencias en vez de fingir
  que D podía cerrar solo). `ProductCard` + skeleton, `FloatingBackButton`
  (extraído de entrada -- Search ya tenía `BackIcon`, Business Detail lo
  necesita también con el mismo posicionamiento por `useSafeAreaInsets`),
  `useCachedProduct` (sin red, lee de la cache de la infinite query de
  productos). `BusinessDetailScreen`: cover con tint de marca uniforme,
  logo tile overlapping, `RatingBadge`/`ClosedPill` reusados, banner de
  `minOrderCents`, catálogo flat con FlashList, estados de vacío/error/
  loading propios y del negocio. `ProductDetailScreen`: solo lectura,
  grupos de variantes como chips informativos, sin selector ni "Agregar".
  Rutas `app/(app)/business/[businessId]/index.tsx` y
  `.../product/[productId].tsx`.
  **Gate de cierre de fase**: `pnpm lint`, `pnpm exec tsc --noEmit`,
  `pnpm test` (suite completa, 27 suites / 127 tests) y `expo-doctor`
  (18/18) todos en verde.

## Context

Fases 0-1.5 dejaron el scaffold, el theme, el API client con manejo de errores
del contrato, y Clerk integrado de punta a punta (`AccountGate` ya resuelve
`401`/`suspended`/`reRegisterBlocked` una sola vez, upstream — las pantallas de
esta fase no repiten ese manejo). `app/(app)/index.tsx` es hoy un placeholder
explícito ("Home placeholder — la Fase 2 lo reemplaza") con un saludo y el
único botón de logout que existe en la app hasta la Fase 7 (Perfil).

Esta fase construye el primer flujo real de datos del backend: el Home
(listado de negocios `ACTIVE` con `avgRating`/`reviewCount`), búsqueda por
nombre, filtro por categoría de plataforma, y el detalle de negocio con su
catálogo. Es también la primera vez que el proyecto usa `FlashList`,
`expo-image` y `useInfiniteQuery` — las convenciones que se fijen acá (keys de
query, paginación, estados vacíos/error compartidos) las van a reusar Orders y
Reviews más adelante.

**Gap de contrato encontrado durante la planificación**: el prototipo
(`docs/design/`) muestra en el detalle de negocio una fila de chips por
categoría de catálogo del propio negocio. El DTO de producto solo trae
`catalogCategoryId: string | null` — sin nombre, sin objeto anidado, y no
existe ningún endpoint que resuelva ese id a un nombre legible
(`docs/API_CONTRACT.md` no tiene sección de catálogo de categorías, solo
`platformCategoryId`, que es un dominio distinto). **Se elimina esa fila de
chips de esta fase** — el catálogo se muestra como lista plana. Inventar
labels desde el id crudo sería peor que no tenerlo, y el backend está fijado.
Queda anotado como gap a reportar (agregar `catalogCategoryName` al DTO, o un
endpoint de categorías de catálogo) — se retoma si el contrato lo agrega.

## Decisiones de producto/alcance (senior FE, con motivo)

- **Product Detail es de solo lectura esta fase.** Sin selector de variantes,
  sin stepper de cantidad, sin botón "Agregar" — solo nombre, descripción,
  precio y grupos de variantes como contenido informativo. El prototipo arma
  toda esa UI para terminar en un `addLine` al carrito, que no existe hasta la
  Fase 3. Se sacrifica una pantalla algo inerte por un turno, a cambio de no
  construir estado de selección/cantidad que muy probablemente haya que
  rehacer (no solo extender) cuando la Fase 3 defina el shape real de una
  línea de carrito.
- **Product Detail no pega al backend.** No existe `GET /products/:id` en el
  contrato, y el producto ya está en cache de la infinite query de productos
  del negocio (solo se llega acá tocando una fila ya renderizada, y Business
  Detail sigue montado debajo en el stack). Se lee vía
  `useCachedProduct(businessId, productId)` desde `queryClient.getQueryData`
  — cero red, cero loading state en el caso normal. El cache-miss (no
  alcanzable hoy sin deep-linking) cae al `ErrorState` compartido.
- **Header de Home recortado del prototipo**: sin selector de dirección
  (no hay direcciones hasta Fase 4), sin campana de notificaciones (no hay
  feature de notificaciones), sin ícono de carrito ni banner promocional (Fase
  3, y el banner no tiene destino sin carrito). Agregar cualquiera de estos
  ahora sería UI sin función real — se documenta como recortado, no olvidado.
- **"Cerrar sesión" se reubica** en el top-right del header de `HomeScreen`
  (donde el prototipo tenía la campana/carrito que se recortaron) — sigue
  siendo el único punto de logout hasta que Perfil (Fase 7) lo reemplace.
  Comentario `// temporal hasta Fase 7 (Profile)` en el código.
- **Sin tab navigator todavía.** `(app)` sigue siendo un `Stack` plano — un
  solo destino real (marketplace) no justifica un shell de tabs con 3 tabs
  vacíos (Pedidos/Perfil no existen). Se retoma cuando Fase 3+ le dé a la app
  un segundo destino real de primer nivel.
- **`isOpen` se señaliza con un pill "Cerrado" diseñado fresh** (no está en el
  prototipo, igual que `SuspendedScreen` en Fase 1) — tono neutro/muted, no
  rojo de error (cerrado es un estado normal, no un problema). Sigue siendo
  tappable/navegable ("cerrado = visible pero señalizado", según el enunciado
  de la fase) — el bloqueo real de pedidos llega recién en Fase 4 vía el 409
  del contrato.
- **`avgRating`/`reviewCount` se muestran como "★ 4.9 (128)"**, o un pill
  "Nuevo" cuando `avgRating` es `null` (negocio sin reviews aún) — en la
  tarjeta de lista y en el detalle.
- **Búsqueda es solo por nombre de negocio.** El placeholder del prototipo
  dice "Buscar negocios o productos" pero el contrato solo expone `search`
  (ILIKE sobre `name`) en `GET /marketplace/businesses` — no hay búsqueda de
  productos. Se corrige el copy a "Buscar negocios" para no prometer de más.
- **DTOs de marketplace en `src/features/marketplace/api/types.ts`**, no en
  `shared/api/types.ts`. El comentario ya existente en ese archivo dice
  explícitamente que los DTOs de cada feature viven en su propia carpeta —
  `AuthMeResponse` es una excepción histórica de Fase 1, no un patrón a
  repetir. `shared/api/types.ts` se queda solo con lo transversal
  (`PaginatedResponse`, `CursorQuery`, errores).

## Decisiones de arquitectura (senior FE, 1 línea c/u)

- **Convención de query keys** (primera vez que hay keys parametrizadas —
  la copian Orders/Reviews más adelante):
  ```
  ['marketplace', 'categories']
  ['marketplace', 'businesses', 'list', { search, platformCategoryId }]
  ['marketplace', 'businesses', 'detail', businessId]
  ['marketplace', 'businesses', 'detail', businessId, 'products']
  ```
  El discriminador `'list'`/`'detail'` evita que un futuro
  `invalidateQueries(['marketplace','businesses'])` pegue donde no debe.
  Params normalizados en el hook (no en la pantalla): `search` trimeado
  (`''` en vez de `undefined` en la key, estable), `platformCategoryId`
  normalizado a `null` cuando no hay filtro.
- **Paginación**: `initialPageParam: undefined`, next param vía un helper puro
  y testeado `getNextCursorParam(page)` que devuelve `undefined` si
  `!hasNextPage` (nunca confiar en `nextCursor` solo — el contrato dice que es
  opaco, no que sea `null` cuando no hay más). `data.pages.flatMap(p =>
p.data)` para FlashList.
- **`placeholderData: keepPreviousData`** en ambas infinite queries de listado
  — sin esto, cambiar de chip de categoría o el término de búsqueda debounced
  cambia la key y blanquea toda la lista a skeleton en cada tap. El skeleton
  de pantalla completa se gatilla solo en la carga inicial real; un refetch
  de filtro usa un indicador chico vía `isFetching`.
- **Debounce como valor, en la pantalla — no dentro del hook de datos.** La
  pantalla mantiene el `TextInput` crudo, `useDebounce(raw, 300)`, y pasa el
  valor debounced al hook de query. Mantiene `useDebounce` reusable y
  testeable sin red (mismo criterio que `authMeRetryPolicy.ts`: lógica pura
  en su propio archivo) y evita de raíz el bug clásico de closure viejo en un
  callback debounced — acá se debounce un valor, no una función.
- **FlashList NO va dentro de `KeyboardAwareScreen`.** `KeyboardAwareScreen`
  scrollea con un `ScrollView`; anidar una lista virtualizada adentro anula la
  virtualización y dispara el warning de nested-VirtualizedList de RN. La
  pantalla de Search arma su propio header mínimo y pasa
  `keyboardShouldPersistTaps="handled"` / `keyboardDismissMode="on-drag"`
  directo al FlashList (son props passthrough de FlatList que FlashList
  soporta). Excepción intencional documentada con un comentario de una línea
  en el código.

## Trampas de RN/Expo a evitar (proactivo)

- `onEndReached` de FlashList dispara repetido durante scroll con momentum —
  siempre gatear `fetchNextPage()` con `hasNextPage && !isFetchingNextPage`.
- Loader de "cargando más" atado a `isFetchingNextPage`, nunca a `isFetching`
  genérico (ese también es `true` en refetches de fondo — mostraría "cargando
  más" al pie por la razón equivocada).
- `keyExtractor` siempre por `item.id`, nunca por índice (con infinite scroll
  - refetch el orden puede cambiar).
- `React.memo` en `BusinessCard`/`ProductCard` (las filas de las listas).
- `expo-image` con `cachePolicy="memory-disk"` explícito en logos y fotos de
  producto (el mismo logo reaparece en Home/Search/Detalle) — y siempre
  guardar contra `photoUrl`/`logoUrl` nulos antes de renderizar `<Image>`.
- Botón de "volver" flotante sobre la banda de cover: posicionarlo con
  `useSafeAreaInsets().top`, no con un `SafeAreaView` de borde superior (eso
  rompe el full-bleed de la banda de color).
- `usePlatformCategories` con `staleTime` explícito (10 min) — sin eso
  React Query lo refetchea en cada focus de pantalla para datos que casi no
  cambian en una sesión.

## CP0 — Fix SSO callback en Android (commit propio, separado del marketplace)

**No es parte del alcance de Marketplace** — se cuela acá porque es un bug de
regresión de Fase 1.5 encontrado antes de arrancar esta fase. Commit propio
`fix(auth): ...`, aparte de cualquier commit de `feat(marketplace)`.

**Causa raíz confirmada** (leído en
`node_modules/@clerk/clerk-expo/dist/hooks/useSSO.js`): `startSSOFlow` arma
`redirectUrl` con `AuthSession.makeRedirectUri({ path: "sso-callback" })`
cuando `SocialSignInButtons.tsx` no pasa uno explícito (no lo pasa hoy). No
existe ninguna ruta `sso-callback` en `app/`, así que cuando Android entrega
ese deep link a la capa de linking de Expo Router, muestra "Unmatched Route".
La sesión de Clerk ya se creó igual (`setActive` corrió adentro de
`handleSSO`, en JS, independiente de la navegación) — por eso "Go back" deja
logueado. **En iOS no pasa** porque `WebBrowser.openAuthSessionAsync` usa
`ASWebAuthenticationSession`, que intercepta la redirect dentro de la propia
sesión de auth sin, en la práctica, disparar el `Linking` a nivel de app;
Android sí entrega ese deep link también al router de la app (comportamiento
de plataforma, no un bug de Clerk).

**Decisión: opción (b), ruta `app/sso-callback.tsx`** — no (a) redirectUrl
explícito. Motivo en una línea: es literalmente el path que `useSSO` ya
asume por default (cero cambios en `SocialSignInButtons.tsx`, funciona igual
para Google y Apple sin tocar el call site), mientras que (a) requeriría
adivinar qué path resuelve limpio contra el group-routing de Expo Router
sin poder probarlo en dispositivo antes de escribir el código.

**Implementación**: `app/sso-callback.tsx`, a nivel raíz (fuera de
`(auth)`/`(app)`, alcanzable en cualquier estado de sesión). Redirect
declarativo con `<Redirect>` (mismo patrón que ya usan
`(auth)/_layout.tsx`/`(app)/_layout.tsx` — un solo estilo de gate en toda la
app, no un `router.replace` imperativo nuevo):

```tsx
const { isLoaded, isSignedIn } = useAuth();
if (!isLoaded) return null; // spinner/blank breve, aterrizaje es instantáneo
return <Redirect href={isSignedIn ? '/' : '/(auth)/sign-in'} />;
```

`isSignedIn` ya debería ser `true` para cuando el deep link aterriza acá
(`setActive` corrió antes, dentro del mismo `await` de `handleSSO`); el
fallback a sign-in cubre el caso borde de que el usuario haya cancelado el
flujo pero el deep link igual dispare la navegación.

**Gate**: Google en Android completa el flujo y aterriza en Home sin pasar
por "Unmatched Route"; Google y Apple en iOS siguen funcionando igual que
antes (regresión cero). Sin tests unitarios nuevos — es una ruta de
redirect puro, mismo criterio que `(auth)/_layout.tsx` (no testeado
tampoco). Typecheck + `pnpm lint` como gate.

## Dependencias a agregar

`@shopify/flash-list`, `expo-image`. Ambas del stack cerrado del plan
(`PLAN_MOBILE_CERQUITA.md`), nada extra. `@shopify/flash-list` v2 requiere
New Architecture — Expo SDK 54 la trae activada por default sin flag
explícito en `app.config.ts`; confirmar con `expo-doctor` como parte del gate
de Checkpoint A. Instalar con `npx expo install` para resolver versiones
compatibles con el SDK.

## Checkpoints

### Checkpoint A — Infra y plumbing de contrato

- Instalar `@shopify/flash-list`, `expo-image`; `expo-doctor` en verde.
- `src/features/marketplace/api/types.ts` — `Business`, `BusinessStatus`,
  `Product`, `VariantGroup`, `VariantOption`, `PlatformCategory` (espejo
  1:1 de `docs/API_CONTRACT.md`, sección Marketplace).
- `src/shared/api/queryString.ts` (+ test) — `buildQueryString(params)`,
  primer helper de GET-con-query-params de la app; pertenece a `shared/api`
  porque cursor pagination lo va a necesitar en cualquier feature futura.
- `src/shared/api/index.ts` — exportar `buildQueryString`.
- `src/shared/utils/money.ts` (+ test) — `formatMoneyCents(cents): string`
  (`"$X.XX"`), sin librería (formato simple, ya coincide con el diseño).
- `src/shared/hooks/useDebounce.ts` (+ test) — primer inquilino de
  `shared/hooks/` (ya scaffoldeado con `.gitkeep`).
- Gate: typecheck + tests afectados. Sin verificación visual.

### Checkpoint B — Componentes de estado compartidos

- `src/shared/ui/Skeleton.tsx` (+ test) — caja con pulso (`Animated` nativo de
  RN, no `reanimated` — no está instalada y no se justifica para un pulso
  simple).
- `src/shared/ui/EmptyState.tsx` (+ test) — `{ title, description?, action?
}`.
- `src/shared/ui/ErrorState.tsx` (+ test) — `{ message?, onRetry, retrying?
}`, generaliza el bloque inline que ya existe en `AccountGate.tsx`.
- `src/shared/ui/index.ts` — exportar los tres.
- Gate: typecheck + tests (render + ramificación de props). Sin pantalla de
  demo — se validan visualmente cuando C/D/E los usan de verdad.

### Checkpoint C — Data layer del marketplace

- `src/features/marketplace/api/getBusinesses.ts`,
  `getBusinessById.ts`, `getBusinessProducts.ts`,
  `getPlatformCategories.ts` — wrappers finos de `request<T>`, mismo patrón
  que `getAuthMe.ts`.
- `src/features/marketplace/api/pagination.ts` (+ test) —
  `getNextCursorParam`.
- `src/features/marketplace/hooks/useBusinesses.ts` — infinite query,
  `search`/`platformCategoryId` normalizados, `keepPreviousData`.
- `src/features/marketplace/hooks/useBusiness.ts` — query simple por id.
- `src/features/marketplace/hooks/useBusinessProducts.ts` — infinite query.
- `src/features/marketplace/hooks/usePlatformCategories.ts` — query con
  `staleTime: 10 * 60_000`.
- Gate: typecheck + tests afectados (pagination helper, normalización de
  params si tiene lógica no trivial).

### Checkpoint D — Home + Búsqueda

- `src/features/marketplace/components/AvatarFallback.tsx` — monograma de
  iniciales (bg `colors.brand.tint` uniforme — no hay campo de color por
  negocio en el contrato, no se inventa uno) para logos; ícono genérico de
  placeholder para fotos de producto.
- `src/features/marketplace/components/RatingBadge.tsx` — "★ 4.9 (128)" /
  "Nuevo".
- `src/features/marketplace/components/ClosedPill.tsx` — pill "Cerrado",
  tono neutro.
- `src/features/marketplace/components/BusinessCard.tsx` +
  `BusinessCardSkeleton.tsx`, `CategoryChips.tsx` (categorías reales de
  `GET /platform/categories` + chip sintético "Todos" que limpia el filtro).
- `src/features/marketplace/screens/HomeScreen.tsx` — FlashList, chips,
  barra de búsqueda no editable (`Pressable` → `router.push('/search')`),
  pull-to-refresh, `Skeleton`/`EmptyState` ("no hay negocios en tu zona")
  /`ErrorState` con retry, botón de logout (ver Decisiones).
- `src/features/marketplace/screens/SearchScreen.tsx` — input editable
  debounced, lista de resultados, `EmptyState` distinto para "sin resultados
  de búsqueda" vs Home vacío.
- `app/(app)/index.tsx` — reemplaza el placeholder, renderiza `HomeScreen`.
- `app/(app)/search.tsx` — ruta nueva, renderiza `SearchScreen`.
- Gate: typecheck + tests afectados (componentes con lógica: `RatingBadge`,
  `CategoryChips` si arma su propia derivación). Pantallas puramente
  presentacionales sin test.

### Checkpoint E — Detalle de negocio + Producto

- `src/features/marketplace/components/ProductCard.tsx` +
  `ProductCardSkeleton.tsx`.
- `src/features/marketplace/hooks/useCachedProduct.ts` — lee del cache de la
  infinite query de productos, sin red.
- `src/features/marketplace/screens/BusinessDetailScreen.tsx` — banda de
  cover (tint de marca uniforme), botón de volver flotante
  (`useSafeAreaInsets`), tile de logo (`AvatarFallback`), `RatingBadge`/
  `ClosedPill`, banner de `minOrderCents`, FlashList plana de productos,
  `EmptyState` ("este negocio todavía no tiene productos").
- `src/features/marketplace/screens/ProductDetailScreen.tsx` — solo lectura
  (ver Decisiones).
- `app/(app)/business/[businessId]/index.tsx`,
  `app/(app)/business/[businessId]/product/[productId].tsx`.
- Gate: typecheck + tests afectados. **Suite completa** (`pnpm test`) +
  `pnpm lint` + `pnpm exec tsc --noEmit` como cierre de fase, una sola vez.

## Archivos clave

- Crear (CP0, commit `fix(auth)` aparte): `app/sso-callback.tsx`.
- Crear: todo `src/features/marketplace/**` (api, hooks, components,
  screens), `src/shared/ui/Skeleton.tsx`/`EmptyState.tsx`/`ErrorState.tsx`,
  `src/shared/utils/money.ts`, `src/shared/hooks/useDebounce.ts`,
  `src/shared/api/queryString.ts`, `app/(app)/search.tsx`,
  `app/(app)/business/[businessId]/**`.
- Modificar: `app/(app)/index.tsx` (reemplaza placeholder),
  `src/shared/ui/index.ts`, `src/shared/api/index.ts`, `package.json`.
- Reusar tal cual: `request`/`ApiRequestError`/`mapError`
  (`src/shared/api/`), `Button`/`Text`/`theme` (`src/shared/ui/`),
  `AccountGate` (las pantallas de esta fase ya renderizan protegidas y con
  `/auth/me` resuelto).

## Verificación

- **Automática (Claude)**: tests por path durante desarrollo, suite completa
  - lint + typecheck una sola vez al cierre (Checkpoint E).
- **Visual (usuario)** — Paletería Lili real de producción: 0. **CP0**: sign-in/sign-up con Google en Android aterriza en Home sin
  "Unmatched Route"; Google y Apple en iOS sin regresión.
  1. Home: lista de negocios con rating/reviewCount, chips de categoría
     (filtran de verdad contra `platformCategoryId`), pull-to-refresh, scroll
     infinito si hay suficientes negocios.
  2. Buscar: tocar la barra de Home navega a Búsqueda; escribir filtra con
     debounce (sin martillar el back en cada letra); estado de "sin
     resultados" con un término inexistente.
  3. Estado vacío real: si no hay negocios `ACTIVE` en la zona/categoría,
     ver el empty state (no pantalla en blanco).
  4. Detalle de Paletería Lili: logo/nombre/rating, banner de mínimo de
     compra, catálogo con los 4 productos, precios formateados desde
     centavos.
  5. Tocar un producto (ej. el de 7 sabores) abre el detalle de solo lectura
     con los grupos de variantes visibles (sin poder seleccionar/agregar).
  6. Cerrar sesión sigue funcionando desde el nuevo botón en Home.
  7. Probar en iPhone y Android.

## Notas / backlog

- **Gap de contrato a reportar**: falta nombre de categoría de catálogo por
  negocio (`catalogCategoryName` en el DTO de producto, o endpoint dedicado)
  — sin esto, el filtro de categorías dentro del detalle de negocio del
  prototipo no es implementable. Retomar si el backend lo agrega.
- **Fuera de esta fase**: selector de variantes + carrito (Fase 3), banner
  promocional/carrito/notificaciones en Home (sin destino hasta Fase 3),
  selector de dirección en Home (Fase 4), tab navigator (se evalúa cuando
  haya un segundo destino real).

## Notas de git / permisos

- Rama `phase-2-marketplace` creada por el usuario desde `main` actualizado
  — confirmado, se trabaja ahí.
- No se crean/leen archivos `.env*`. No `eas build/submit`. No `git push`.
- Commits: conventional, en commits separados por naturaleza del cambio —
  `fix(auth): ...` para CP0, `docs: ...` para el re-alcance de
  `PLAN_MOBILE_CERQUITA.md`, `feat(marketplace): ...` para cada checkpoint
  A-E. Sin trailer de co-autoría.
