# Fase 5 — Tracking del pedido + push

### Progreso

- **Checkpoint A** — gate automático cerrado (suite 35/35, lint,
  typecheck, `expo-doctor` 21/21), commit `chore(sdk): upgrade to Expo
SDK 56`. Pendiente tu build + smoke visual en ambos teléfonos antes de
  abrir el Checkpoint B.
- **Bloqueo real encontrado y resuelto durante el gate tuyo**: `eas build`
  fallaba al leer `app.config.ts` (`Cannot read properties of undefined
(reading 'CommonJS')`) — no es el bug conocido de TypeScript 7
  (expo/expo#47627, cerrado, no aplica a 6.x). Causa verificada contra el
  código real: `eas-cli@21.0.3` (última versión publicada, confirmado que
  no existe una más nueva) trae su propio `@expo/config@55.0.10` →
  `@expo/require-utils@^55.0.3`, una versión entera atrás de la que usa
  el propio proyecto (`56.1.5`, la que sí lee bien `app.config.ts` vía
  `npx expo config`). La 55.x accede a `ts.ModuleKind.CommonJS` sin
  guardas; la 56.x lo envuelve en `loadTypescript()` + `if (ts)` —
  bajo TypeScript 6.0.3 la 55.x rompe. Sin fix de eas-cli publicado
  todavía. **Se convirtió `app.config.ts` → `app.config.js`** (con JSDoc
  `@type` para mantener el hint de tipos en el editor, sin enforcement de
  `tsc` — mismo patrón ya usado en `jest.config.js` de este repo) — evita
  por completo la rama de transpilación TS de `@expo/require-utils` donde
  vive el bug, reversible cuando eas-cli actualice su dependencia. Todas
  las menciones de `app.config.ts` en este documento se actualizaron a
  `app.config.js`.
- **Checkpoint A — cerrado del todo**: tu build + smoke en Android sin
  regresiones (requests OK bajo `expo/fetch`). Smoke de iOS diferido --
  sin build posible hasta que Apple apruebe tu enrollment de Developer
  (en trámite); no bloquea lo que sigue, que es JS puro sobre el mismo
  dev client Android.
- **Bug real de edge-to-edge encontrado en el gate visual del
  Checkpoint B** (se escapó del smoke de A porque esa pantalla no se
  visitó post-upgrade): en `OrderConfirmationScreen`, "Volver al inicio"
  quedaba superpuesto con la barra de gestos de Android -- el tap
  accionaba la barra del SO, no el botón. Causa raíz: esa pantalla
  (escrita en Fase 4, antes de SDK 55) nunca tuvo manejo de safe area en
  absoluto, ni arriba ni abajo. Auditadas TODAS las pantallas con
  elementos anclados al borde inferior: `CheckoutScreen`, `CartScreen`,
  `ProductDetailScreen`, el "Ver mi carrito" de `BusinessDetailScreen` y
  `OrderTrackingScreen` ya lo hacían bien (`insets.bottom + spacing.X`
  a mano); solo `OrderConfirmationScreen` estaba rota. Fix como patrón
  compartido, no parche puntual: `useBottomInset(extra)`
  (`src/shared/hooks`, documentado como obligatorio en `CLAUDE.md`) --
  no un componente `BottomBar` único, porque las pantallas reales usan 3
  layouts de footer distintos (en flujo, `position:absolute` con
  sombra, pill flotante con `margin`) que un solo componente rígido
  hubiera forzado a converger sin necesidad real. Las 5 pantallas
  correctas se migraron al hook (mismos valores, sin cambio visual);
  `OrderConfirmationScreen` suma además el borde superior
  (`SafeAreaView edges={['top']}`, que no tenía). Gate: suite 39/39 --
  200/200 tests, lint, typecheck, `expo-doctor` 21/21.
- **Checkpoint B** — gate automático cerrado (suite 38/38 -- 198/198
  tests, lint, typecheck, `expo-doctor` 21/21). Reorganización de
  `orders` hecha (`Order`/`OrderStatus`/`getOrderById`/`useOrder`
  movidos de `checkout`), polling con ETag vía `requestRaw` +
  `focusManager` de TanStack Query (sin `useAppState` propio, ver
  sección dedicada), cancelación con manejo del 409 de carrera,
  `OrderTrackingScreen` + stepper de 4 pasos + link "Ver seguimiento"
  desde la confirmación. Nota de tooling: los tests de hooks con
  `useMutation` necesitan `mutations: { gcTime: 0 }` en el `QueryClient`
  de test además de `queries: { gcTime: 0 }` -- si no, el
  `mutationCache` agenda un timer real de 5 minutos que cuelga
  ejecuciones scoped de Jest (`pnpm exec jest <path>`) aunque la suite
  completa no lo note.
- **Checkpoint B — cerrado del todo**: tu gate visual confirmado (stepper
  avanzando solo por polling con detención en terminal, cancelación
  feliz, carrera mostrando el conflicto + el estado real).
- **Checkpoint C — código listo, frenado en el punto de necesitar tus
  archivos de Firebase** (tal como pediste). Gate automático cerrado
  (suite 40/40 -- 206/206 tests, lint, typecheck, `expo-doctor` 21/21)
  **sin** `googleServicesFile` todavía en `app.config.js` -- confirmado
  que `expo-doctor` no valida que esos paths existan en disco, así que
  no hay nada que se rompa por adelantar el resto del código sin ellos.
  `src/features/push/**` completo, `useLogout()` reemplazando las 4
  llamadas sueltas a `signOut()`, `index.js` con el background handler,
  `PushProvider` montado en `app/_layout.tsx`, `.gitignore` ya
  actualizado.
- **Bug real encontrado post-commit**: el propio hook de pre-commit
  (`eslint --fix`, regla `import/first`) reordenó `index.js` e invirtió
  el orden real entre `expo-router/entry` y el registro del background
  handler -- exactamente el orden que ese archivo existe para
  garantizar. Fix: `eslint-disable-next-line import/first` puntual,
  verificado idempotente contra `--fix` (no se puede volver a reordenar
  en un commit futuro), commit aparte.
- **Checkpoint C — Firebase Console + Railway confirmados por vos**
  (`google-services.json`/`GoogleService-Info.plist` en la raíz,
  `FCM_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY` en Railway, redeploy sin
  errores de FCM). `googleServicesFile` agregado a `app.config.js` para
  ambas plataformas. Gate final: `expo config --type public` resuelve
  ambos paths reales, `expo-doctor` 21/21, suite completa (40/40 --
  206/206 tests), lint, typecheck -- todos en verde con los archivos
  reales ya presentes (no solo sin ellos como el checkpoint anterior).
  Pendiente: tu segundo rebuild nativo (ahora con Firebase en el árbol)
  y el gate visual de push.

## Context

El carrito y el checkout (Fase 4) terminan en `OrderConfirmationScreen`
mostrando el pedido recién creado (`status: PENDIENTE`), sin tracking ni
polling — quedó anotado a propósito como pendiente de esta fase. Esta fase
le da al pedido su ciclo de vida visible: pantalla de seguimiento con
polling respetando el ETag/rate-limit que el contrato ya expone, cancelación
por el cliente, y push FCM (Android primero, iOS bloqueado-documentado por
la APNs key). También es el punto de inflexión operativo que el plan
maestro marcó desde la Fase 0: de acá en adelante la app deja de poder
correr en Expo Go (publicado en las tiendas) y pasa a development build.

Investigación previa ya resuelta contra fuentes reales (no asumida):

- **Payload real del push**, leído de `cerquita-api/src/modules/orders/application/commands/change-order-status/change-order-status.handler.ts`
  (best-effort, post-commit, nunca bloquea la transición):
  ```ts
  { notification: { title: 'Tu pedido cambió de estado', body: `Pedido · ${to}` },
    data: { orderId: string, status: OrderStatus, type: 'ORDER_STATUS' } }
  ```
  Solo se dispara en transiciones hechas por `BUSINESS` (no hay push al
  cancelar uno mismo — no hace falta notificarse a sí mismo).
- **Env vars del backend**, leídas de `cerquita-api/src/shared/config/env.schema.ts`:
  `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` (opcionales hoy,
  el adapter falla explícito recién al invocarse sin ellas) — vienen del
  JSON de cuenta de servicio de Firebase Admin (no del `google-services.json`
  del cliente, son credenciales distintas).
- **Estado real de Expo Go en las tiendas** (2026-07-22, confirmado vía
  Expo changelogs): la versión pública de Expo Go (App Store/Play Store)
  **sigue clavada en SDK 54** — no hay fecha para publicar 55/56. Esto
  cambia cómo se verifica el bump de SDK (ver Checkpoint A).
- **New Architecture**: ya activa por defecto desde SDK 54 en este
  proyecto (confirmado en `phase-2-marketplace.md`, `@shopify/flash-list`
  v2 la requiere) — el riesgo más grande de saltar de Legacy a New
  Architecture (obligatorio desde SDK 55) ya está probado en producción
  de este repo.
- **Breaking changes SDK 55→56 verificados contra el árbol real** (cambios
  de los changelogs oficiales, cruzados con `package.json` y greps del
  código, no supuestos):

  | Cambio                                                                         | Afecta a este repo                                                                                                                                                                                                                                                                                                                                     |
  | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `expo/fetch` pasa a ser el `fetch` global por defecto                          | **SÍ, directo** — `shared/api/client.ts` usa `fetch()` global, y esta misma fase le agrega lectura de header `ETag` para el polling. Se verifica explícitamente en el gate (ver Checkpoint A). Mitigación ya documentada por Expo: `EXPO_PUBLIC_USE_RN_FETCH=1` revierte al fetch de RN sin tocar código si `expo/fetch` da problemas con headers/304. |
  | Legacy Architecture eliminada (SDK 55+)                                        | No aplica — ya en New Architecture desde SDK 54.                                                                                                                                                                                                                                                                                                       |
  | `expo-router` se desacopla de `react-navigation`                               | No aplica — grep confirmado: cero imports directos de `@react-navigation/*` en `src/`/`app/`, todo pasa por las APIs propias de `expo-router`.                                                                                                                                                                                                         |
  | Edge-to-edge obligatorio en Android (desde SDK 55)                             | Riesgo bajo — `react-native-safe-area-context` ya está en uso en todas las pantallas, pero es el punto concreto a mirar en el smoke visual (headers pegados al status bar, no contenido debajo de él).                                                                                                                                                 |
  | `@expo/vector-icons` deja de ser dependencia del paquete `expo`                | No aplica — el proyecto no usa vector-icons, son SVGs a medida (decisión ya cerrada del plan maestro).                                                                                                                                                                                                                                                 |
  | `expo-file-system` `copy()`/`move()` pasan a async                             | No aplica — no se usa `expo-file-system` en el proyecto.                                                                                                                                                                                                                                                                                               |
  | TypeScript sube a 6.x                                                          | Revierte el downgrade forzado de Fase 0 (`6.0.3 → ~5.9.3` fue por el `@expo/cli` de SDK 54). Vuelve a `~6.x`.                                                                                                                                                                                                                                          |
  | `@clerk/clerk-expo`, `@tanstack/react-query`, `zustand`, `@shopify/flash-list` | Sin breaking changes documentados en los changelogs de Expo 55/56; sus propios peer deps son abiertos (`react-native: '*'`). Sin `persist` de zustand en uso (grep confirmado) — cero superficie ahí. Verificación real igual: suite completa + smoke visual, no solo ausencia en el changelog.                                                        |

## Decisiones cerradas (con vos)

- **SDK: subir a 56.** Aislado como primer checkpoint, commit propio
  (`chore(sdk): ...`), gate completo (suite + lint + typecheck +
  `expo-doctor` + smoke visual tuyo) **antes** de que Firebase toque el
  árbol — si algo regresa después, se sabe si fue el SDK o Firebase, nunca
  los dos mezclados.
- **Bundle identifier**: `com.cerquita.app` — mismo valor para
  `ios.bundleIdentifier` y `android.package`, y va a ser el mismo App ID
  de Apple en la Fase 9 (anotado acá para no rehacerlo entonces).
- **Permiso de notificaciones**: se pide en el contexto del primer pedido
  (confirmación → tarjeta de contexto → permiso nativo → si concede, ahí
  se registra el token), **no** en el login. El registro del token queda
  atado al estado del permiso, no al evento de login:
  - Permiso ya concedido en sesiones siguientes → registro silencioso
    post-login (cubre rotación de token / reinstalación), sin volver a
    preguntar nada.
  - Permiso negado → tracking sigue 100% por polling, sin insistir en
    cada pedido (a lo sumo un recordatorio espaciado con deep link a
    Ajustes — se deja para la fase de Perfil, no acá).
  - Copy con el beneficio concreto ("Te avisamos cuando tu pedido esté en
    camino") + "Ahora no" sin fricción — rechazar la tarjeta propia NO
    gasta el permiso nativo de iOS (irrecuperable si se niega ahí).

## Cómo se verifica el bump de SDK sin Expo Go (Checkpoint A)

Como la Expo Go pública sigue en SDK 54, el smoke visual del bump **no
corre en Expo Go** — corre en el primer development build del proyecto,
construido **sin Firebase todavía** (Firebase entra recién en el
Checkpoint C). Esto es intencional y le da doble uso a esa primera build:
sirve de vehículo de smoke test aislado del SDK, y ya te deja el flujo de
dev build aprendido antes de sumarle la complejidad de Firebase encima.

Consecuencia operativa: **el proyecto construye un development build dos
veces en esta fase** — una vez "pelado" acá (Checkpoint A), y otra vez
después de sumar Firebase (Checkpoint C, porque un módulo nativo nuevo
exige recompilar; hot reload de JS no alcanza para eso). Entre checkpoints
A y B no hace falta reconstruir nada — B es JS puro, corre sobre la misma
build del dev client instalada en A.

## Orders: reorganización de datos (antes de tocar UI)

`Order`/`OrderStatus`/`OrderItem` y el hook `useOrder` viven hoy en
`src/features/checkout/` (creados en Fase 4 con el comentario explícito
de que son "reusables por Fase 5/6"). Esta fase es ese momento: se
mueven a un `src/features/orders/` propio (hoy vacío, solo `.gitkeep`),
que pasa a ser dueño de **leer/trackear/cancelar** pedidos — `checkout`
sigue siendo dueño de **crearlos** (`POST /orders`, `CreateOrderPayload`).
Justificación en una línea: el criterio del proyecto es extraer cuando
algo se usa desde 2+ features (regla ya aplicada en Fase 4 con
`useQuickAddToCart`) — `orders` pasa a ser esa segunda feature, y evita
mover los mismos archivos otra vez en la Fase 6 (historial).

```
src/features/orders/
  api/{types,getOrderById,getOrderStatus,cancelOrder}.ts
  hooks/{useOrder,useOrderStatus,useCancelOrder}.ts
  utils/orderStatus.ts        # isTerminalStatus, pasos del stepper, labels — puro, testeado
  components/OrderStatusStepper.tsx
  screens/OrderTrackingScreen.tsx
```

`checkout/api/types.ts` deja de definir `Order`/`OrderStatus`/`OrderItem`
y los reimporta desde `@/features/orders/api/types` (mismo patrón de
dependencia cruzada que ya existe: checkout ya importa hooks de
`marketplace`). `CheckoutScreen`/`OrderConfirmationScreen` solo cambian el
import, no su lógica.

## El sentinela de 304 — por fin se usa

`request<T>()` (Fase 0) devuelve `undefined` en 304, pero no expone
headers de la respuesta — necesarios acá para leer el `ETag` entrante.
En vez de un fetch suelto (prohibido por `CLAUDE.md`), se extiende
`shared/api/client.ts` con un export nuevo que reusa el mismo fetch
interno en vez de duplicarlo:

```ts
// shared/api/client.ts
export async function requestRaw(
  path: string,
  options: RequestOptions = {},
): Promise<{ response: Response; body: unknown }> {
  /* mismo fetch interno */
}

// request<T>() pasa a ser un wrapper fino sobre requestRaw (sin cambiar su firma/comportamiento actual)
```

`src/features/orders/api/getOrderStatus.ts`:

```ts
export async function getOrderStatus(
  orderId: string,
  etag: string | null,
): Promise<{ data: OrderStatusPoll | null; etag: string | null }> {
  const { response, body } = await requestRaw(`/orders/${orderId}/status`, {
    headers: etag ? { 'If-None-Match': etag } : {},
  });
  if (response.status === 304) return { data: null, etag };
  if (!response.ok) throw new ApiRequestError(mapError(response.status, body));
  return { data: body as OrderStatusPoll, etag: response.headers.get('ETag') };
}
```

Se verifica explícitamente que `response.headers.get('ETag')` funciona
igual bajo `expo/fetch` (default de SDK 56) — es justo la superficie que
ese cambio de runtime toca.

## Polling — diseño (sin `AppState` propio)

TanStack Query trae la pieza que el plan maestro asignó a `AppState`:
`focusManager` con un listener de `AppState` es la receta oficial de la
librería para React Native — conectarlo una vez (nuevo
`src/shared/api/queryFocusManager.ts`, inicializado en `app/_layout.tsx`)
hace que `refetchIntervalInBackground: false` (default) pause/reanude el
polling solo con la pantalla en foreground, gratis. Construir un
`useAppState` propio encima sería duplicar ese mecanismo sin ganar nada —
se **descarta** esa idea del plan maestro (estaba anotada como ejemplo
antes de este análisis concreto).

`src/features/orders/hooks/useOrderStatus.ts` — query separada y liviana
de `useOrder` (que sigue trayendo el pedido completo una sola vez):

```ts
useQuery({
  queryKey: ['orders', 'status', orderId],
  queryFn: () => {
    /* getOrderStatus con etag guardado en un useRef */
  },
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    return status === 'ENTREGADO' || status === 'CANCELADO' ? false : POLL_INTERVAL_MS;
  },
  retry: false, // un 429/error puntual se resuelve solo en el próximo tick — reintentar automático empeoraría el rate limit
});
```

- **Intervalo: 5s** (`POLL_INTERVAL_MS = 5000`) → 12 req/min, margen
  amplio bajo el límite de 30/min (60% de holgura) incluso con reconexiones
  o remounts, y suficientemente ágil para sentirse "en vivo".
- La pantalla deriva el estado efectivo sin escribir el cache a mano:
  `effectiveStatus = statusQuery.data?.status ?? orderQuery.data?.status`
  (mismo criterio para `etaMinutes`) — sin `setQueryData` imperativo, más
  fácil de testear.
- Se detiene sola: al desmontar la pantalla (limpieza nativa de
  TanStack Query), en estados terminales (`refetchInterval: false`), y en
  background (`focusManager`).

## Cancelación (customer, solo `PENDIENTE`)

- `src/features/orders/api/cancelOrder.ts` (`POST /orders/:id/cancel`) +
  `useCancelOrder` (`useMutation`).
- Botón "Cancelar pedido" (danger, outline) — se **renderiza solo si**
  `order.status === 'PENDIENTE'` (no deshabilitado-visible, evita la
  confusión de un botón inerte). Tap → `Alert.alert` 2 botones ("No" /
  "Sí, cancelar", estilo destructivo) — mismo patrón que borrado de
  dirección en Fase 4.
- Sin optimismo: el pedido no es el carrito — se espera la respuesta real
  antes de reflejar `CANCELADO` (loading vía `Button loading` mientras
  tanto).
- **Carrera 409** (el negocio ya lo movió a `PREPARANDO`): por regla del
  contrato, se invalida `['orders','detail',orderId]` y
  `['orders','status',orderId]` → refetch inmediato → la UI muestra el
  estado real (el botón "Cancelar" desaparece solo porque ya no es
  `PENDIENTE`) + `Alert.alert` informativo ("El negocio ya empezó a
  preparar tu pedido").

## Pantalla de tracking

Ruta `app/(app)/orders/[orderId].tsx` → `OrderTrackingScreen`
(`src/features/orders/screens/`), siguiendo el mismo patrón de ruta
dinámica que `business/[businessId]/index.tsx`. Diseño adaptado del
prototipo (`Cerca.dc.html`, sección `isTracking`) contra el contrato real,
con dos ajustes deliberados:

- **Stepper de 4 pasos, no 3**: el prototipo comprime a "Recibido / En
  camino / Entregado" por espacio visual, pero el contrato define 4
  estados no terminales (`PENDIENTE`, `PREPARANDO`, `EN_CAMINO`,
  `ENTREGADO`). Se muestra el real — igual criterio que Fase 4 usó para
  otras discrepancias prototipo-vs-contrato (nunca ocultar información
  real por fidelidad visual).
- **Tarjeta "Repartidor asignado" del prototipo: se cae.** No hay ninguna
  entidad de repartidor en el contrato (sin nombre, vehículo, ni teléfono
  para el botón de llamar) — es UI del prototipo sin dato real detrás,
  mismo trato que otros elementos ya recortados en la tabla de paridad
  del plan maestro.
- Hero card (`brand.tint`, o `danger`-tint si `CANCELADO`): label de
  estado + `etaMinutes` si está presente + `Pedido #{shortId} · {negocio}`
  (mismo formato de `shortId` que ya usa `OrderConfirmationScreen`).
- `CANCELADO`: sin stepper (el progreso no tiene sentido ahí), banner
  rojo simple en su lugar.
- Sin tab bar (Fase 6, mismo criterio que `OrderConfirmationScreen` hoy).
- Loading → `Skeleton`; error de fetch → `ErrorState` con retry.
  Reutiliza `Button`/`Text` de `shared/ui`, patrón de pill de
  `RatingBadge` para el badge de estado.

`OrderConfirmationScreen` gana un botón secundario "Ver seguimiento ›"
(copy exacto del prototipo, línea 217) → `router.push(`/orders/${order.id}`)`,
junto al "Volver al inicio" existente.

## Push FCM — Android primero, iOS bloqueado-documentado

Dependencias nuevas: `@react-native-firebase/app`, `@react-native-firebase/messaging`
(`^25.x`, peer `expo: >=47.0.0` — compatible con SDK 56), `expo-notifications`,
`expo-dev-client`. Instalar los paquetes Expo-managed con `npx expo install`
(resuelve versión atada al SDK); los de RNFirebase con `pnpm add` (no son
paquetes Expo).

**Código uniforme entre plataformas** (decisión ya cerrada del plan
maestro — un solo camino de `getToken()`, no dos): `src/features/push/`
completo (tipos, wrappers de `POST`/`DELETE /devices`, `getFcmToken()`)
se escribe sin `if (Platform.OS === ...)` en la capa de datos. La única
rama por plataforma vive en el punto de entrada — **no se pide
permiso ni se dispara el registro en iOS todavía**: pedir el permiso
nativo de iOS para una funcionalidad que no puede completarse (sin la
APNs key no hay token FCM real) quema ese permiso irrecuperable sin
beneficio. Cuando la Fase 9 suba la key, sacar ese único `if` activa iOS
sin tocar el resto del código — así se cumple el espíritu de "camino
uniforme" sin regalar un permiso.

```
src/features/push/
  api/{types,registerDevice,unregisterDevice}.ts
  hooks/{useRegisterDevice,useUnregisterDevice}.ts
  getFcmToken.ts
  utils/parseNotificationData.ts   # remoteMessage.data -> {orderId,type} | null — puro, testeado
  components/
    NotificationPermissionCard.tsx  # tarjeta de contexto, copy + "Ahora no"
    PushProvider.tsx                # listeners + orquestación, montado en app/_layout.tsx
```

`PushProvider` (dentro de `ClerkProvider`, reacciona a `isSignedIn`):

- Listeners: `messaging().onMessage()` (foreground → dispara notificación
  local vía `expo-notifications` `scheduleNotificationAsync` con
  `trigger:null`, porque Android no muestra sola una notificación
  mientras la app está en foreground), `onNotificationOpenedApp()` +
  `getInitialNotification()` (background/quit → tap) — ambos parsean
  `data.orderId`/`data.type==='ORDER_STATUS'` con `parseNotificationData`
  y navegan a `/orders/${orderId}`. Tap de la notificación local
  (`expo-notifications` response listener) hace lo mismo.
- Registro: solo tras conceder el permiso (ver tarjeta de contexto,
  disparada desde `OrderConfirmationScreen` post-`onSuccess` del primer
  pedido) o silencioso en sesiones siguientes si ya estaba concedido.
- `useLogout()` nuevo (`src/features/auth/hooks/`) — envuelve `DELETE
/devices` (con el token recién leído de `getFcmToken()`, best-effort, no
  bloquea el logout si falla) + `signOut()` de Clerk, **en ese orden**
  (el DELETE necesita el bearer token, que `signOut()` invalida).
  Reemplaza las 4 llamadas sueltas a `signOut()` existentes
  (`HomeScreen`, `AccountGate`, `SuspendedScreen`, `CompleteNameScreen`)
  — mismo criterio de extracción que el resto del proyecto (se repite,
  se extrae).
  - **Precisión (aprobada)**: el `DELETE /devices` corre con un timeout
    corto (2-3s) vía `Promise.race` contra el `unregister.mutateAsync`
    — best-effort real, no solo "atrapado en un catch": con red mala, un
    request que nunca resuelve dejaría el botón de salir sin salir. Vencido
    el timeout o cualquier error, se sigue a `signOut()` igual.

**`index.js` nuevo** (entry point custom, reemplaza `expo-router/entry`
directo en `package.json`'s `"main"`) — RNFirebase exige registrar el
background handler antes de que cualquier otra cosa corra:

```js
import messaging from '@react-native-firebase/messaging';
messaging().setBackgroundMessageHandler(async () => {
  // no-op: Android ya muestra la notificación del payload nativo en
  // background/quit sin código propio — este handler solo evita el
  // warning de RNFirebase y deja lugar a lógica futura.
});
import 'expo-router/entry';
```

`app.config.js` — nuevos campos:

```ts
ios: { usesAppleSignIn: true, bundleIdentifier: 'com.cerquita.app',
       googleServicesFile: './GoogleService-Info.plist' },
android: { package: 'com.cerquita.app',
           googleServicesFile: './google-services.json' },
plugins: [ /* ...existentes */, '@react-native-firebase/app',
           '@react-native-firebase/messaging', 'expo-notifications' ],
```

`expo-build-properties` (para el workaround de linking estático de iOS,
ver riesgo de compatibilidad ya documentado en el plan maestro) **se
difiere a la Fase 9** — no aporta nada mientras no se compile iOS nativo
en este proyecto (sin dependencia sin uso real, regla de
`CLAUDE.md`).

### `google-services.json` / `GoogleService-Info.plist` — NO versionados

Mismo tratamiento que `.p8`/`.jks`/`.mobileprovision` (ya gitignorados):
son config atada a un proyecto de Firebase específico, no un secreto de
runtime pero sí credencial-adyacente y específica del ambiente — se
suman a `.gitignore`:

```
google-services.json
GoogleService-Info.plist
```

Los ponés vos en la raíz del repo (local, gitignorado) antes de un build
local. Para builds en la nube (`eas build`, que corrés vos) hace falta
además subirlos como **EAS secret de tipo archivo** — comando que
también es tuyo (toca credenciales):

```
eas secret:create --scope project --type file --name GOOGLE_SERVICES_JSON --value ./google-services.json
eas secret:create --scope project --type file --name GOOGLE_SERVICES_INFO_PLIST --value ./GoogleService-Info.plist
```

`eas.json` (lo escribo yo, es solo config — sin credenciales):

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

## Workflow de dev build — qué corrés vos

Expo Go (pública, en las tiendas) queda descontinuada para este proyecto
**desde el Checkpoint A** (SDK 56 no está publicado ahí) — no es un
recorte exclusivo de push. De acá en adelante, **dev build para el 100%
del trabajo local**, incluidas fases futuras que no toquen push.
`npx expo start --dev-client` reemplaza a `npx expo start` como comando
diario; Fast Refresh de JS funciona igual que en Expo Go — solo un
cambio de dependencia nativa (como sumar Firebase en el Checkpoint C)
exige un rebuild nuevo, no cada cambio de código.

| Paso                                                                                                                                                                                                 | Quién                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `npx expo install expo-dev-client`, config de `app.config.js`/`eas.json`                                                                                                                             | Yo                         |
| Build del dev client, **primera vez** (Checkpoint A, sin Firebase): `eas build --profile development --platform android` (o `npx expo run:android`/`run:ios` en local si tenés Android Studio/Xcode) | **Vos**                    |
| Instalar esa build en ambos teléfonos, smoke visual del bump de SDK                                                                                                                                  | **Vos**                    |
| Crear proyecto Firebase + descargar `google-services.json`/`.plist` (ver checklist abajo)                                                                                                            | **Vos**                    |
| Configurar `FCM_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY` en Railway                                                                                                                                  | **Vos**                    |
| Build del dev client, **segunda vez** (Checkpoint C, con Firebase ya en el árbol)                                                                                                                    | **Vos**                    |
| Instalar esa build, gate visual de push                                                                                                                                                              | **Vos**                    |
| `eas build --profile production`/`eas submit` (Fase 9)                                                                                                                                               | **Vos** (regla ya vigente) |

## Checklist Firebase Console (tuyo)

1. **Crear proyecto** en [Firebase Console](https://console.firebase.google.com)
   (si no existe uno para Cerquita todavía) — nombre libre, no necesita
   coincidir con nada del código.
2. **Agregar app Android**: package name **exacto** `com.cerquita.app` →
   descarga `google-services.json` → lo ponés en la raíz del repo (local,
   gitignorado — ver arriba).
3. **Agregar app iOS**: bundle ID **exacto** `com.cerquita.app` →
   descarga `GoogleService-Info.plist` → mismo tratamiento. (Podés
   hacerlo ahora aunque no se use hasta Fase 9 — evita volver a esta
   pantalla después).
4. **Cloud Messaging → credenciales de Admin SDK**: Configuración del
   proyecto → Cuentas de servicio → "Generar nueva clave privada" →
   descarga un JSON con `project_id`/`client_email`/`private_key` — esos
   tres valores van a Railway (paso siguiente), **no** al cliente.
5. **(Fase 9, no ahora)** APNs Authentication Key (`.p8`) subida en
   Cloud Messaging → configuración de iOS de la app — requiere cuenta de
   Apple Developer, todavía no existe según el plan maestro.

## Checklist Railway (tuyo)

En el servicio de `cerquita-api`, agregar las 3 variables (del JSON del
paso 4 de arriba):

| Variable           | Valor                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FCM_PROJECT_ID`   | `project_id` del JSON                                                                                                                                               |
| `FCM_CLIENT_EMAIL` | `client_email` del JSON                                                                                                                                             |
| `FCM_PRIVATE_KEY`  | `private_key` del JSON (con los `\n` literales — Railway los preserva en un campo de texto multilínea; el adapter ya hace `.replace(/\\n/g,'\n')` si hiciera falta) |

Sin esto, `POST /devices` sigue funcionando (guarda el token igual), pero
el envío real del push falla silencioso del lado del backend (ya
manejado ahí como best-effort, no rompe nada) — el polling sigue siendo
la fuente de verdad de todos modos.

## Checkpoints

### Checkpoint A — SDK 56 + dev client pelado (commit propio, aislado)

- `npx expo install --fix` tras bumpear `expo` a `~56.x`; revisar cada
  downgrade/upgrade no obvio que el comando no cubra (mismo cuidado que
  Fase 0 tuvo bajando a 54).
- `app.config.js`: `ios.bundleIdentifier`/`android.package` =
  `com.cerquita.app`; `expo-dev-client` instalado.
- `eas.json` nuevo (perfiles arriba).
- Gate (yo): `pnpm test` completo + `pnpm lint` + `tsc --noEmit` +
  `expo-doctor`.
- Gate (vos): build del dev client pelado (sin Firebase) en ambos
  teléfonos, smoke de los flujos existentes (login, marketplace,
  carrito, checkout) — atención particular a edge-to-edge/safe areas en
  Android (cambio real de SDK 55+) y a que `expo/fetch` no rompa ningún
  request existente.
- **No se avanza al Checkpoint B sin este gate en verde.**

### Checkpoint B — Tracking + polling + cancelación

- Reorganización `orders`: mover `Order`/`OrderStatus`/`OrderItem`,
  `getOrderById`, `useOrder` de `checkout` a `orders`; actualizar los 2
  imports en checkout.
- `requestRaw` en el cliente + `getOrderStatus` + `useOrderStatus`
  (polling con `focusManager`, sin `AppState` propio) +
  `queryFocusManager.ts`.
- `cancelOrder` + `useCancelOrder` + manejo del 409 de carrera.
- `OrderStatusStepper` + `OrderTrackingScreen` + ruta
  `app/(app)/orders/[orderId].tsx` + link "Ver seguimiento" desde
  confirmación.
- Gate: typecheck + tests afectados (`orderStatus.ts` puro, hook de
  polling con fake timers, clasificación del 409). Reporte de qué
  verificar visualmente (sin rebuild nativo — corre sobre el dev client
  de A): tracking por polling en ambos teléfonos provocando transiciones
  vía `PATCH` del owner en Swagger, cancelación con su carrera
  provocada (cancelar justo cuando el owner ya movió el pedido a
  `PREPARANDO`).

### Checkpoint C — Push FCM (Android) + segundo rebuild nativo

- Dependencias (`@react-native-firebase/app`/`messaging`,
  `expo-notifications`), plugins en `app.config.js`, `.gitignore` de los
  archivos de Firebase, `index.js` con el background handler.
- `src/features/push/**` completo (registro/baja, `PushProvider`,
  tarjeta de permiso en contexto, deep link foreground/background/quit),
  `useLogout()` + reemplazo de las 4 llamadas sueltas a `signOut()`.
- Gate (yo): typecheck + tests afectados (`parseNotificationData`,
  lógica pura de la tarjeta de permiso) + **suite completa** + lint +
  typecheck + `expo-doctor` como cierre de fase.
- Gate (vos): checklist de Firebase Console + Railway (arriba) → segundo
  build del dev client (ahora con Firebase) → push real en Android
  (pedido cambia de estado vía `PATCH` en Swagger → notificación → tap →
  pantalla del pedido), incluida la tarjeta de permiso apareciendo tras
  confirmar el primer pedido.

## Archivos clave

- Crear: `src/features/orders/**`, `src/features/push/**`,
  `src/shared/api/queryFocusManager.ts`, `index.js`, `eas.json`.
- Modificar: `app.config.js`, `.gitignore`, `package.json` (`main`,
  dependencias), `shared/api/client.ts` (`requestRaw`),
  `checkout/api/types.ts` (reimport), `CheckoutScreen.tsx`/
  `OrderConfirmationScreen.tsx` (import + botón "Ver seguimiento"),
  `HomeScreen.tsx`/`AccountGate.tsx`/`SuspendedScreen.tsx`/
  `CompleteNameScreen.tsx` (`signOut()` → `useLogout()`),
  `app/_layout.tsx` (monta `PushProvider`, inicializa `focusManager`).
- Reusar tal cual: `Button`/`Text`/`Skeleton`/`ErrorState` (`shared/ui`),
  patrón de pill de `RatingBadge`, `formatMoneyCents`, `useBusiness`.

## Verificación

- **Automática (Claude)**: tests por path durante desarrollo; suite
  completa + lint + typecheck + `expo-doctor` una sola vez por
  checkpoint que lo amerite (A y C, ambos con cambios de dependencias
  nativas/runtime).
- **Visual (usuario)**, ambos teléfonos:
  1. (Checkpoint A) Smoke de flujos existentes sobre el dev client
     pelado — sin regresión visual, atención a edge-to-edge Android.
  2. (Checkpoint B) Tracking por polling: provocar
     `PENDIENTE→PREPARANDO→EN_CAMINO→ENTREGADO` vía Swagger, ver el
     stepper avanzar sin recargar la pantalla a mano. Cancelar un
     pedido en `PENDIENTE` (éxito). Provocar la carrera: cancelar
     justo después de que el owner ya lo movió a `PREPARANDO` (ver el
     mensaje de conflicto + estado real).
  3. (Checkpoint C) Tarjeta de permiso apareciendo tras confirmar un
     pedido, aceptar → push real en Android tras un cambio de estado
     desde Swagger → tap → aterriza en `/orders/:id`. Logout →
     confirmar que el token se da de baja (o al menos que no rompe el
     logout si falla).

## Notas / backlog

- **Gap ya anotado, no se resuelve acá**: sin `reason` estable en el
  `details` del 409 de `POST /orders/:id/cancel` tampoco (mismo patrón
  que Fase 4 con `POST /orders`) — no aplica distinguir causas acá, solo
  hay una transición posible para el customer.
- **iOS bloqueado-documentado**: sin APNs key (`.p8`) ni cuenta de Apple
  Developer todavía — permiso/registro de push en iOS queda con el `if`
  de plataforma comentado, listo para sacar en Fase 9. Tracking en iOS
  sigue siendo 100% funcional vía polling mientras tanto.
- **`expo-build-properties` diferido a Fase 9**: necesario recién cuando
  se compile iOS nativo con RNFirebase (workaround de static linking ya
  documentado en el plan maestro).
- **Fuera de esta fase**: historial de pedidos (Fase 6) — pero ya deja
  `useOrder`/`useOrderStatus` en `src/features/orders/` listos para
  reusar ahí.

## Notas de git / permisos

- Rama `phase-5-tracking`, a crear por vos desde `main` actualizado
  (post-merge de Fase 4) — no la creo yo.
- Commits: conventional, uno por checkpoint. El de SDK va aparte y
  primero, sin mezclar con nada de Firebase (`chore(sdk): upgrade to
Expo SDK 56`), tal como pediste.
- No se crean/leen archivos `.env*`. No corro `eas build`/`eas submit`/
  `eas secret:create` (credenciales — son tuyos). No `git push`.
