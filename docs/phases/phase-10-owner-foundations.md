# Fase 10 — Fundaciones del modo owner (identidad, chooser, switch, shell)

**Estado**: Implementada, gate de cierre en verde. Pendiente: PR + gate visual del usuario + merge.

## Contexto

El modo owner vive en esta app (re-alcance del plan maestro,
`PLAN_MOBILE_CERQUITA.md:237-249`). La Fase 10 es su fundación: que un
usuario con negocio pueda **entrar como administrador** y **volver a ser
cliente sin re-login**. Hoy no hay una sola línea de owner en `src/` ni
`app/`.

La **decisión D2 quedó resuelta el 2026-07-24: opción B — alta de negocio
solo por invitación**. El super-admin crea el negocio y asigna a su dueña
manualmente. Eso saca de esta fase la pantalla "Crear negocio", el botón
"¿Tenés un negocio?" del prototipo y el primer flujo de upload a
Cloudinary — todo pasó a la Fase 15 (post-MVP,
`PLAN_MOBILE_CERQUITA.md:362-381`).

Lo que queda es exactamente lo pedido: detección de rol, chooser
post-login, switch bidireccional, y un shell de admin listo para recibir
la Fase 11.

**Estado de git verificado al planificar**: `main` limpio y alineado con
`origin/main` en `9f65f24`. Rama nueva desde `main`.

---

## Verificación previa contra el backend (hecha antes de diseñar)

### (a) `/auth/me` expone el rol — sin gap

`GET /api/v1/auth/me` devuelve
`role: 'SUPER_ADMIN'|'BUSINESS_OWNER'|'EMPLOYEE'|'CUSTOMER'` y
`businessId: string | null`
(`cerquita-api/src/modules/users/presentation/auth.controller.ts:23-42`,
`me-response.dto.ts:5-13`). Ya está tipado en `src/shared/api/types.ts`
como `AuthMeResponse` y cacheado por `useAuthMe` bajo `['auth','me']` —
**hoy nadie lo consume**. El chooser y el switch no necesitan backend
nuevo.

Notas del modelo (`prisma/schema.prisma:15-22,73-91,154-177`): `role` es
un campo **único** por usuario (enum, no many-to-many) → al ser
`BUSINESS_OWNER` el usuario deja de ser `CUSTOMER` a nivel de rol.
`Business.ownerId` es `@unique` → **un usuario = máximo un negocio**,
consistente con `businessId` singular. `EMPLOYEE` existe en el enum pero
es rol muerto (sin tabla de vínculo, sin guard que lo acepte) — la app lo
trata como sin acceso a modo owner.

### (b) Alta de negocio + asignación de owner — GAP REAL → chore de BE

- **No existe `POST /platform/businesses`.** El controller de super-admin
  (`businesses.controller.ts:36-38`, `@Roles(SUPER_ADMIN)`) solo tiene
  `GET` (lista y detalle) y `PATCH :id/approve|suspend|reactivate`.
- El único alta es `POST /business/me`
  (`business-owner.controller.ts:57-84`), que toma el `ownerId` **del JWT
  del propio usuario** (`actor.id`, nunca del body) y lo auto-promueve a
  `BUSINESS_OWNER` como efecto del comando
  (`create-business.handler.ts:79-95`). Es el modelo de **auto-servicio**
  — el opuesto de la opción B.
- **No hay endpoint para asignar ni transferir owner**: `ownerId` se fija
  en la creación y está ausente de `UpdateBusinessRequestDto`.
- `PATCH /platform/users/:id/role` sí existe (SUPER_ADMIN,
  `platform-users.controller.ts:106-118`) pero **no crea negocio y no
  valida coherencia**: deja un `BUSINESS_OWNER` sin negocio, que luego
  recibe 403 en `GET /business/me` por `TenantGuard`.

**Chore de BE requerido** (se planifica en `cerquita-api` con su propio
plan file, prerequisito del **go-live**, no del código de esta fase):

> `POST /api/v1/platform/businesses` — `@Roles(SUPER_ADMIN)`, body
> `{ ownerUserId, platformCategoryId, name, deliveryFeeCents?, minOrderCents?, prepTimeMinutes?, lat?, lng? }`.
> Crea el `Business` y promueve al usuario a `BUSINESS_OWNER` **en la
> misma transacción**, emitiendo el audit `USER_ROLE_CHANGED` que hoy
> emite `CreateBusinessHandler`. Implementación natural: parametrizar el
> `ownerId` de ese handler (hoy hardcodeado al actor) en vez de duplicar
> lógica. Debe rechazar un `ownerUserId` que ya tenga negocio
> (`ownerId @unique`).

**Runbook manual interino** (sirve para el alta real de la dueña **y**
para habilitar tu cuenta para el gate visual). Swagger está en
`/api/docs` (`main.ts:37-55`, `persistAuthorization: true`); las rutas
llevan prefijo `/api/v1`:

0. Ser super-admin: abrir la app una vez con tu cuenta (crea el `User`
   por JIT), luego en `cerquita-api` → `pnpm run db:promote-admin <tu-email>`.
1. La dueña se registra en la app (su `User` nace `CUSTOMER` por JIT).
2. Swagger, Bearer del super-admin → `GET /api/v1/platform/users` →
   copiar su `id`.
3. `GET /api/v1/platform/categories` → copiar el `platformCategoryId`
   que corresponda.
4. **`pnpm exec prisma studio`** → tabla `businesses` → fila nueva:
   `owner_id`, `platform_category_id`, `name`, `status = ACTIVE`,
   `delivery_fee_cents`, `min_order_cents`, `prep_time_minutes`.
   _(Este es el único paso fuera de la API — es exactamente lo que el
   chore de BE elimina.)_
5. `PATCH /api/v1/platform/users/{id}/role` con
   `{"role":"BUSINESS_OWNER"}`.
6. Si creaste el negocio como `PENDING`:
   `PATCH /api/v1/platform/businesses/{id}/approve`.
7. Verificar: con el token de la dueña, `GET /api/v1/auth/me` devuelve
   `role: "BUSINESS_OWNER"` y `businessId != null`.

### (c) Endpoints de customer con un BUSINESS_OWNER — sin gap

`@Roles(UserRole.CUSTOMER)` **no aparece ni una vez** en todo el backend.
`orders`, `addresses`, `reviews`, `marketplace`, `devices` y `feedback`
llevan **solo** `ClerkAuthGuard` y scopean por ownership de fila
(`actor.id`), no por rol. Está documentado como decisión deliberada en el
propio código (`orders.controller.ts:40-42`: _"cualquier rol puede
comprar"_; `addresses.controller.ts:35-36`;
`order-reviews.controller.ts:24-25`). No hay validación que impida a un
owner comprarle a su propio negocio. **El switch bidireccional es viable
tal como se diseñó.**

### (e) `GET /business/me` — existe, y esta fase lo consume

`business-owner.controller.ts:86-98`, guards `ClerkAuthGuard +
RolesGuard + TenantGuard` con `@Roles(BUSINESS_OWNER)`. 403 si el rol
está desincronizado o no hay negocio — de ahí que la app exija **ambas**
señales (ver Decisión 1).

---

## Alcance

**Entra**: detección de rol/negocio, chooser post-login, switch
bidireccional cliente↔admin, shell del modo admin (3 tabs, Perfil real),
`GET /business/me`.

**No entra** (recortes explícitos por D2-B, van a la Fase 15):

- Pantalla **Crear negocio** (ADMIN: CREATE BUSINESS del prototipo).
- Botón/fila **"¿Tenés un negocio?"** en el Perfil del cliente.
- Auto-servicio con aprobación del super-admin.
- **Upload de logo a Cloudinary** — se va junto con Crear negocio; su
  prerequisito de BE (ruta pública de firma) deja de ser prerequisito de
  esta fase.
- Tab **Resumen** del prototipo — es Fase 13, posterior a la publicación
  (9); no se shippea una tab "próximamente" a producción.
- Filas "Editar negocio", "Datos de la cuenta", "Métodos de cobro" del
  perfil admin → Fase 14.

---

## Decisiones de diseño

### Decisión 1 — El acceso al modo owner exige las DOS señales

`hasBusiness = role === 'BUSINESS_OWNER' && businessId !== null`.

`PATCH /platform/users/:id/role` puede dejar cualquiera de las dos sola
(gap (b)): un rol sin negocio da **403 en `GET /business/me`**, y un
negocio con rol degradado también. Exigir ambas hace que un estado
incoherente degrade a "cliente normal" — sin modo owner y sin pantallas
rotas — en vez de a un 403 sin salida.

Corolario duro: un `CUSTOMER` puro **no ve absolutamente nada** del modo
owner — ni chooser, ni fila en el perfil, ni una query extra. `ModeGate`
devuelve `children` antes de mirar nada más.

### Decisión 2 — El chooser vive en el árbol de render, no en una ruta

Se monta como `<ModeGate>` dentro de `app/(app)/_layout.tsx`, **debajo de
`AccountGate`** — el único punto donde `/auth/me` ya está resuelto
garantizado antes de renderizar rutas protegidas. Es el patrón que el
repo ya usa para `SuspendedScreen` y `CompleteNameScreen`.

La alternativa (chooser como ruta + redirect) obligaría a tocar los
**tres** redirects espejados que hoy deciden el destino post-login
(`app/(app)/_layout.tsx`, `app/(auth)/_layout.tsx:isSignedIn → "/"`,
`app/sso-callback.tsx`) y mantenerlos sincronizados para siempre. Se
sacrifica poder linkear al chooser por deep link — nadie lo necesita.

Lógica de `ModeGate`:

```tsx
if (!hasBusiness) return children; // customer puro: cero rastro
if (!hasHydrated) return null; // ver Decisión 3
if (mode === null) return <ChooserScreen />;
const inOwner = segments.includes('(owner)');
if (mode === 'owner' && !inOwner) return <Redirect href="/(app)/(owner)/orders" />;
if (mode === 'customer' && inOwner) return <Redirect href="/" />;
return children;
```

Las dos ramas de `<Redirect>` son las que hacen que el modo sobreviva al
**arranque en frío** (la sesión de Clerk persiste y la app entra por
`"/"`), no solo al tap del switch.

### Decisión 3 — El modo es client state persistido, y hay que esperar su hidratación

`appModeStore`: zustand + `persist` + `createJSONStorage(AsyncStorage)`,
key `@cerquita/app-mode` — mismo patrón que `reviewedOrdersStore`
(`src/features/reviews/store/reviewedOrdersStore.ts`). Estado
`mode: 'customer' | 'owner' | null`.

A diferencia de `reviewedOrdersStore`, acá **sí** hace falta
`hasHydrated` (vía `onRehydrateStorage`): sin eso, un owner con modo
guardado vería un flash del chooser en cada arranque, porque el primer
render ocurre con `mode: null` antes de que AsyncStorage responda.

Ciclo: `null` → chooser → el usuario elige → persiste. **El logout lo
limpia**, así que el próximo login vuelve a mostrar el chooser —
exactamente el comportamiento del prototipo
(`login: () => hasBusiness ? 'chooser' : 'home'`), sin re-preguntar cada
vez que se abre la app.

### Decisión 4 — Centralizar la limpieza de stores en `useLogout`

Hoy `clearCart()` se llama desde `ProfileScreen.handleLogout` (línea 25),
no desde `useLogout`. Con esta fase pasan a existir **tres** puntos de
logout (perfil cliente, perfil owner, chooser) más el auto-logout por 401
de `AccountGate`. Dejarlo como está garantiza el bug "cerré sesión desde
el chooser y me quedó el carrito del usuario anterior".

`useLogout` pasa a hacer `clearCart()` + `clearMode()` junto a
`queryClient.clear()` (que no toca AsyncStorage), y `ProfileScreen` deja
de hacerlo.

### Decisión 5 — El switch aterriza en Pedidos, y resetea navegación

`enterAdmin` del prototipo va a Resumen, pero Resumen es Fase 13 y no
existe. El destino es **Pedidos**, que es la operación diaria real y
llega en la Fase 11.

Ambos switches hacen `setMode(...)` + `router.replace(...)` — `replace`,
no `push`, para reproducir el `history: []` del prototipo: cambiar de
modo no deja el otro modo en la pila. A verificar en el gate visual con
el botón atrás de Android.

### Decisión 6 — Tab bar de 3 tabs, no 4

**Pedidos · Productos · Perfil**, arrancando en Pedidos. Pedidos y
Productos son placeholders diseñados porque las Fases 11 y 12 los
reemplazan **antes** de la publicación. Resumen no aparece: es Fase 13,
posterior a la 9 — se suma ahí como un ítem más, que es sumar, no
re-layout. No se shippea una tab "próximamente" a producción.

Los placeholders usan el `EmptyState` existente con copy de producto
(nunca "en construcción" ni mención de fases): _"Sin pedidos por ahora /
Los pedidos que entren a tu tienda van a aparecer acá."_ y _"Tu catálogo
va acá / Pronto vas a poder cargar y editar tus productos desde la
app."_

### Limitación conocida — deep links de push contra el modo contrario (backlog Fase 11)

`ModeGate` (Decisión 2) redirige cualquier ruta de `(owner)` al modo
activo si el modo persistido no coincide — sin excepción por origen de la
navegación. Un push de "pedido nuevo" recibido en modo cliente (o con la
app cerrada, modo persistido = `customer`) deep-linkearía a
`/(app)/(owner)/orders/[id]` y `ModeGate` lo redirige a `/` antes de que
la pantalla se monte: el owner pierde el destino del push.

No se resuelve en esta fase porque el deep-linking de push a pedidos
recién existe desde la Fase 11 (`business/me/orders`, ver
`PLAN_MOBILE_CERQUITA.md`, Fase 11) — hoy no hay ninguna ruta `(owner)`
a la que un push pueda apuntar. Queda registrado como backlog explícito
de la Fase 11, que es quien define el comportamiento correcto
(probablemente: deep links mode-aware que cambian el modo persistido al
del destino antes de navegar, en vez de dejar que `ModeGate` lo pise).

### Decisión 7 — El chooser no se bloquea por `GET /business/me`

El copy del prototipo dice _"Panel de {nombre del negocio}"_, que sale de
`GET /business/me`. Esa query **no bloquea** el render del chooser:
mientras carga o si falla, el subtítulo cae a _"Panel de tu tienda"_.
Trabar la puerta de entrada por una query secundaria sería peor producto
que un subtítulo genérico por 200ms.

---

## Checkpoints

### C0 — Plan maestro y plan file (sin código de app) — cerrado

- `PLAN_MOBILE_CERQUITA.md`: sección de decisiones reescrita con IDs
  estables (D1-D4, Abiertas/Resueltas), D2 resuelta con fecha y
  consecuencias; Fase 10 reescrita al alcance real (fuera Crear negocio,
  "¿Tenés un negocio?" y Cloudinary; adentro chooser, switch y shell);
  nueva Fase 15 (post-MVP) con lo diferido; encabezado del bloque owner
  `Fases 10-14` → `Fases 10-15`; nota en Fase 14 sobre reuso del
  formulario de negocio (edición ahí, creación en 15).
- Este plan file.

Gate C0: sin código → revisión del usuario del plan file.

### C1 — Identidad de modo (sin UI)

- `src/features/owner/hooks/useOwnerAccess.ts` — envuelve `useAuthMe()`
  (mismo `queryKey`, se sirve del cache sin refetch) y devuelve
  `{ hasBusiness, businessId }` según la Decisión 1.
- `src/features/owner/store/appModeStore.ts` — Decisión 3, con
  `hasHydrated`.
- `src/features/owner/api/getMyBusiness.ts` + `api/types.ts` +
  `hooks/useMyBusiness.ts` (`['business','me']`,
  `enabled: hasBusiness`). El tipo se **copia del `BusinessResponseDto`
  real del backend** — leerlo antes de tipar, sin inventar campos y sin
  reusar el tipo del marketplace (es otro DTO).
- `useLogout.ts` — Decisión 4; `ProfileScreen.tsx` deja de llamar
  `clearCart`.
- `docs/API_CONTRACT.md` — sección owner mínima con **solo**
  `GET /business/me` (método, response, errores 401/403), y ajuste de
  las líneas 5-6 que hoy declaran "Owner/admin queda fuera".

Tests: `appModeStore.test.ts` (set/clear/hidratación),
`useOwnerAccess.test.ts` (las 4 combinaciones de rol×businessId), casos
nuevos en `useLogout.test.ts` (limpia carrito y modo).

Gate C1: `pnpm exec tsc --noEmit` + `pnpm exec jest src/features/owner
src/features/auth --silent`.

### C2 — Chooser, ModeGate y switch de ida

- `src/shared/ui/icons.tsx` — `StoreIcon` y `CartIcon` (paths del
  prototipo); `ChevronRightIcon` gana prop opcional `color?` (hoy es
  fijo) para la fila violeta.
- `src/features/owner/components/ModeSwitchRow.tsx` — la card violeta
  del prototipo (`colors.brand.tint` fondo y borde, `radius.xl`, label
  `bodyLg` en `colors.brand.dark`, chevron del mismo color,
  `minHeight: 44`). Props `{ icon, label, onPress }`. Se usa **dos**
  veces (ida y vuelta) → se extrae ahora, no antes.
- `src/features/owner/screens/ChooserScreen.tsx` — copy literal del
  prototipo: título _"¿Dónde querés entrar?"_, subtítulo _"Hola
  {nombre}, tenés una tienda y una cuenta de cliente. Podés cambiar
  cuando quieras desde tu perfil."_, card violeta _"Administrar mi
  tienda" / "Panel de {negocio}"_, card blanca _"Ir al marketplace" /
  "Explorá y pedí como cliente"_, y "Cerrar sesión" al pie. Tipografía
  con las variantes existentes (`display`, `subtitle`, `bodyMd`,
  `bodySm`) — el prototipo pide 26px y 17px, que caen a 28 y 16; **no se
  agregan variantes** por 1-2px. El pie usa
  `useBottomInset(spacing.xxl)` (regla dura de CLAUDE.md para todo lo
  anclado al borde inferior).
- `src/features/owner/hooks/useSwitchMode.ts` — `switchToOwner` /
  `switchToCustomer` (Decisión 5).
- `src/features/owner/components/ModeGate.tsx` + montaje en
  `app/(app)/_layout.tsx`
  (`<AccountGate><ModeGate><Stack/></ModeGate></AccountGate>`).
- `ProfileScreen.tsx` — `<ModeSwitchRow>` condicional a `hasBusiness`,
  **fuera** de la card de filas, `marginTop: spacing.lg`, arriba de
  "Cerrar sesión" (posición exacta del prototipo, línea 246).

Tests: `ModeGate.test.tsx` sobre la plantilla de `AccountGate.test.tsx`
(customer puro → children sin chooser; rol incoherente → children; owner
sin modo → chooser; owner con modo owner fuera de `(owner)` → redirect;
owner con modo customer dentro de `(owner)` → redirect).
`ProfileScreen.test.tsx` necesita **sí o sí** el mock de `useAuthMe` (hoy
no lo tiene y se rompe) + 2 casos (con y sin negocio). Chooser y
`ModeSwitchRow` son presentacionales → sin test.

Gate C2: typecheck + `jest src/features/owner src/features/profile
src/features/auth`.

### C3 — Shell del modo admin y cierre

- `app/(app)/(owner)/_layout.tsx` — `Tabs` con Pedidos · Productos ·
  Perfil, `colors.brand.default` activo, mismos tokens que el tab bar
  del cliente. Íconos: Pedidos y Perfil se **reusan** de
  `src/shared/navigation/icons.tsx`; solo se agrega `ProductsIcon` (caja
  del prototipo).
- `app/(app)/(owner)/{orders,products,profile}.tsx` — wrappers de 3
  líneas, como el resto del repo.
- `src/features/owner/screens/OwnerPlaceholderScreen.tsx` — `EmptyState`
  existente, copys de la Decisión 6.
- `src/features/owner/screens/OwnerProfileScreen.tsx` — identidad
  (Clerk), sección `MI NEGOCIO` con card (iniciales, nombre,
  `{categoría} · Envío {fee}` usando el formateador de centavos que ya
  existe en el repo — reusar, no crear), aviso si `status !== 'ACTIVE'`
  (_"Tu negocio está pendiente de aprobación"_ / _"está oculto"_),
  `<ModeSwitchRow>` de vuelta a cliente, y "Cerrar sesión" con borde y
  color `danger` (variante propia del prototipo, distinta del cliente).
- Docs restantes: `docs/phases/STATUS-AUDIT.md:32,60,136` (siguen
  diciendo "número TBD" y "modo owner sin plan file") y
  `docs/design/TOKENS.md:132` (afirma que el chooser y las pantallas de
  owner están _"fuera de alcance de esta app"_ — contradice el
  re-alcance).
- Gate completo: `pnpm exec tsc --noEmit`, `pnpm exec jest --silent`
  (suite entera, una sola vez), `pnpm lint`.

---

## Archivos

**Nuevos** — `src/features/owner/`:
`api/{getMyBusiness.ts,types.ts}`,
`hooks/{useOwnerAccess.ts,useMyBusiness.ts,useSwitchMode.ts}`,
`store/appModeStore.ts`, `components/{ModeGate.tsx,ModeSwitchRow.tsx}`,
`screens/{ChooserScreen.tsx,OwnerProfileScreen.tsx,OwnerPlaceholderScreen.tsx}`
(+ tests de store, `useOwnerAccess` y `ModeGate`).
`app/(app)/(owner)/_layout.tsx` y `{orders,products,profile}.tsx`.
`docs/phases/phase-10-owner-foundations.md` (este archivo).

**Modificados**: `app/(app)/_layout.tsx`,
`src/features/auth/hooks/useLogout.ts` (+test),
`src/features/profile/screens/ProfileScreen.tsx` (+test),
`src/shared/ui/icons.tsx`, `src/shared/navigation/icons.tsx`,
`PLAN_MOBILE_CERQUITA.md`, `docs/API_CONTRACT.md`,
`docs/phases/STATUS-AUDIT.md`, `docs/design/TOKENS.md`.

---

## Verificación

**Automática**: `pnpm exec tsc --noEmit` · `pnpm exec jest --silent` ·
`pnpm lint`. Los tests cubren la lógica no trivial: la condición de
acceso owner (4 combinaciones), la persistencia e hidratación del modo,
las 5 ramas de `ModeGate`, la limpieza de stores en logout, y el perfil
del cliente con y sin negocio.

**Visual (del usuario, ANTES del merge)** — antes de empezar, habilitar
la cuenta de prueba con los pasos 4-5 del runbook interino de arriba:

1. **Cliente puro** (una cuenta sin negocio): entra directo a Home como
   siempre — **ningún** chooser, y en Perfil **no** aparece la fila
   violeta. Cero rastro del modo owner.
2. **Chooser**: con la cuenta con negocio, cerrar sesión y volver a
   entrar → aparece "¿Dónde querés entrar?" con el nombre real, la card
   violeta diciendo el nombre real del negocio, y la card blanca. Se ve
   como el prototipo.
3. **Ida**: tocar "Administrar mi tienda" → cae en la tab **Pedidos**
   del modo admin, con las 3 tabs abajo. En Android, el botón atrás
   **no** devuelve al chooser ni al modo cliente.
4. **Vuelta**: Perfil del admin → se ve el negocio con nombre, categoría
   y envío → "Cambiar a modo cliente" → cae en Home. En Perfil del
   cliente ahora sí está la fila violeta "Cambiar a administrar mi
   tienda", arriba de "Cerrar sesión".
5. **Persistencia**: matar la app por completo y volver a abrirla
   estando en modo admin → arranca en el modo admin **sin flash del
   chooser** ni de las tabs de cliente. Repetir desde el modo cliente.
6. **El owner compra**: en modo cliente, con la cuenta owner, hacer un
   pedido de punta a punta (carrito → checkout → confirmación) y
   verificar que aparezca en Pedidos. Es la validación real del punto (c).
7. **Logout**: cerrar sesión desde el chooser y volver a entrar → el
   carrito quedó vacío y el chooser vuelve a preguntar.
8. **Placeholders**: Pedidos y Productos del modo admin muestran su
   estado vacío diseñado, nunca una pantalla en blanco.

---

## Git

Rama `feat/owner-foundations` desde `main` (verificado limpio y alineado
con `origin/main` en `9f65f24`). Commits convencionales, sin trailer de
co-autoría. PR abierto por Claude Code al cierre; el **merge es
exclusivamente del usuario**, después del gate visual.

## Progreso

### C0 — Plan maestro y plan file (cerrado)

- `PLAN_MOBILE_CERQUITA.md` actualizado: registro de decisiones con IDs
  estables (D1-D4), D2 resuelta (opción B, invitación-only, fecha
  2026-07-24); sección "Fase 10" reescrita al alcance real; nueva
  "Fase 15 (post-MVP)" con lo diferido; encabezado del bloque owner y
  referencias cruzadas actualizadas de `10-14` a `10-15`.
- Este plan file creado.
- Verificación previa contra `docs/API_CONTRACT.md` y el código real de
  `cerquita-api` hecha antes de diseñar (ver sección dedicada arriba):
  gap real solo en (b) — alta de negocio por invitación —, registrado
  como chore de BE + runbook manual interino, sin bloquear el código de
  esta fase.

### C1 — Identidad de modo (cerrado)

- `src/features/owner/hooks/useOwnerAccess.ts` (+test, 5 casos: owner con
  negocio, owner sin negocio, customer, customer con `businessId`
  incoherente, loading) — implementa la Decisión 1.
- `src/features/owner/store/appModeStore.ts` (+test) — implementa la
  Decisión 3; hidratación testeada vía `persist.rehydrate()`, no timing.
- `src/features/owner/api/{getMyBusiness.ts(+test),types.ts}` — `MyBusiness`
  espeja `BusinessResponseDto` real del backend (leído en
  `~/cerquita-api/src/modules/businesses/presentation/dto/business-response.dto.ts`),
  sin campos inventados.
- `src/features/owner/hooks/useMyBusiness.ts` — `['business','me']`,
  `enabled: hasBusiness`, implementa la Decisión 7 (no bloqueante).
- `useLogout.ts` — Decisión 4: `clearCart()` + `clearMode()` centralizados
  junto a `queryClient.clear()`. `ProfileScreen.tsx` deja de limpiar el
  carrito a mano; su test se ajustó (la aserción de limpieza de carrito se
  movió a `useLogout.test.tsx`, que ahora también cubre `appModeStore`).
- `docs/API_CONTRACT.md`: nueva sección "8. Business (owner)" con
  `GET /business/me` (única ruta que esta fase consume) y ajuste del
  encabezado que declaraba "Owner/admin queda fuera".

**Gate C1**: `pnpm exec tsc --noEmit` → limpio. `pnpm exec jest
src/features/owner src/features/auth src/features/profile --silent` →
**18 suites, 104 tests, 0 fallos**. Sin UI en este checkpoint → nada que
verificar visualmente.

### C2 + C3 — Chooser, ModeGate, switch y shell del modo admin (cerrado)

**Nota de implementación real**: C2 y C3 se ejecutaron como una sola
unidad de trabajo, no en el orden separado del plan original.
`typedRoutes: true` (Expo Router) tipa `router.replace()`/`<Redirect>`
contra las rutas reales del proyecto — `useSwitchMode`/`ModeGate` no
podían typecheckear contra `/(app)/(owner)/orders` sin que esa ruta ya
existiera. Se regeneraron los tipos con `expo start` en background
(mismo procedimiento que Fase 7b) antes de escribir `ModeGate`.

- `src/shared/ui/icons.tsx`: `StoreIcon`, `CartIcon` (paths exactos del
  prototipo, `docs/design/Cerca.dc.html:53,58`); `ChevronRightIcon` ahora
  acepta `color?` (default sin cambios).
- `src/shared/navigation/icons.tsx`: `ProductsIcon` (caja isométrica,
  prototipo línea 799).
- `src/features/owner/components/ModeSwitchRow.tsx` — fila violeta
  reusada en ambos perfiles (presentacional, sin test).
- `src/features/owner/screens/ChooserScreen.tsx` — copy y layout
  literales del prototipo; `useMyBusiness(true)` no bloqueante (Decisión
  7); pie con `useBottomInset(spacing.xxl)` (presentacional, sin test).
- `src/features/owner/hooks/useSwitchMode.ts` — `switchToOwner`/
  `switchToCustomer`, implementa la Decisión 5 (`router.replace`, destino
  Pedidos).
- `src/features/owner/components/ModeGate.tsx` (+test, 6 casos: customer
  puro, owner sin modo → chooser, modo owner fuera de `(owner)` →
  redirect, modo customer dentro de `(owner)` → redirect, modo coincide →
  children, sin hidratar → null) + montado en `app/(app)/_layout.tsx`
  dentro de `AccountGate`.
- `app/(app)/(owner)/_layout.tsx` (Tabs: Pedidos·Productos·Perfil,
  arrancando en Pedidos) + `{orders,products,profile}.tsx` (wrappers).
- `src/features/owner/screens/OwnerPlaceholderScreen.tsx` — reusado por
  las rutas `orders`/`products` con el copy de la Decisión 6.
- `src/features/owner/screens/OwnerProfileScreen.tsx` — identidad Clerk,
  card "MI NEGOCIO" (nombre, categoría vía `usePlatformCategories`
  existente + envío formateado con `formatMoneyCents` existente, aviso si
  `status !== ACTIVE`), `<ModeSwitchRow>` de vuelta a cliente, "Cerrar
  sesión" con borde y color `danger` (variante propia, distinta del
  cliente).
- `ProfileScreen.tsx`: `<ModeSwitchRow>` condicional a `hasBusiness`,
  fuera de la card de filas, arriba de "Cerrar sesión"; test con mock de
  `useAuthMe` (nuevo) + 2 casos (con/sin negocio).
- `docs/phases/STATUS-AUDIT.md` y `docs/design/TOKENS.md` actualizados
  (ya no dicen "modo owner sin plan file" ni "fuera de alcance de esta
  app").

**Gate C2+C3 (cierre de fase)**: `pnpm exec tsc --noEmit` → limpio.
`pnpm exec jest --silent` (suite completa) → **65 suites, 353 tests, 0
fallos**. `pnpm lint` → 0 errores, 2 warnings preexistentes (mismos de la
Fase 7a/7b, `react-hooks/exhaustive-deps` sobre mocks de `useFocusEffect`
en tests, no en código de producción).

**Pendiente**: ninguno de código. Falta PR + tu gate visual + merge.
