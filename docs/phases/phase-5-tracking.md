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
  y el gate visual de push. Build de Android en cola de EAS.
- **Checkpoint C2 agregado a mitad de fase**: Apple Developer enrollment
  aprobado y APNs key subida a Firebase antes de lo previsto (ver "Push
  FCM iOS — activación" y la entrada de Checkpoint C2 en
  `## Checkpoints`). Solo plan por ahora -- implementación arranca
  cuando el gate visual del Checkpoint C (Android) esté en verde.
- **Build de Android falló en prebuild** (en cola de EAS): `eas build`
  solo sube al builder los archivos trackeados por git —
  `google-services.json` gitignorado nunca llegó, `googleServicesFile`
  apuntaba a un path que no existía del lado del builder. Fix:
  `app.config.js` resuelve `googleServicesFile` desde una env var
  (`GOOGLE_SERVICES_JSON`/`GOOGLE_SERVICE_INFO_PLIST`) con fallback al
  archivo local -- cableado para ambas plataformas de una vez, ya que
  el Checkpoint C2 iba a pisar la misma piedra con
  `GoogleService-Info.plist`. Comando real verificado contra el CLI
  instalado: `eas env:create` existe pero está deprecado a favor de
  `eas env:set` (ver sección `google-services.json`/
  `GoogleService-Info.plist` arriba para los comandos exactos).
  `--visibility sensitive`, no `secret` -- ninguno de los dos archivos
  es un secreto real. Gate: suite 40/40 -- 206/206 tests, lint,
  typecheck, `expo-doctor` 21/21, `expo config` confirmado resolviendo
  el fallback local. Pendiente: correr los `eas env:set`, relanzar el
  build de Android.
- **Bloqueo del build de iOS: `com.cerquita.app` no disponible en
  Apple** (namespace global, ya tomado por otra cuenta). Decisión: nuevo
  identificador único para ambas plataformas, `sv.cerquita.app`
  (fallbacks si también está tomado: `com.cerquitasv.app`,
  `com.brlemus.cerquita`) — el nombre de la app (Cerquita) no cambia.
  Esto **bloquea el Checkpoint C2** (necesita un bundle ID real para
  buildear iOS) hasta resolverse. Plan de ejecución ordenado (mapeado
  antes de tocar código):
  1. **[Vos]** Verificar disponibilidad en Apple Developer →
     Identifiers → "+" (sin gastar una build) antes de que yo cambie
     nada.
  2. **[Yo]** `app.config.js`: solo `ios.bundleIdentifier`/
     `android.package` cambian — `slug`/`scheme`/`name` y el wiring de
     `googleServicesFile` (env var + fallback) quedan igual, solo
     cambia el _contenido_ de los archivos en esos mismos paths.
  3. **[Vos]** Firebase: agregar 2 apps nuevas (Android + iOS) con el
     ID nuevo **en el mismo proyecto** (Firebase no permite renombrar
     el package/bundle ID de una app existente) → nuevos
     `google-services.json`/`GoogleService-Info.plist` sobreescriben
     los de la raíz → la MISMA APNs key (.p8) se re-sube en la config
     de Cloud Messaging de la app iOS nueva (Key ID/Team ID son del
     Team, no del App ID — no hace falta generarla de nuevo).
  4. **[Vos]** Re-correr los mismos 2 `eas env:set` (mismos nombres,
     mismos paths locales, apuntando ahora a los archivos nuevos).
  5. **[Vos]** `eas build --profile development --platform ios` —
     primera build real de iOS. `eas device:create` NO hace falta
     repetirlo (el registro del dispositivo es a nivel Team, no por
     bundle ID).
  6. Android: nada que hacer — el build ya en cola sigue siendo válido
     para el gate de push de hoy (ver convivencia abajo).

  **App ID viejo, verificado**: en iOS, Apple rechazó `com.cerquita.app`
  antes de que EAS llegara a registrar nada ahí — no hay credencial
  confirmada que limpiar. En Android no hay constraint de namespace
  global hasta publicar en Play Store (Fase 9) y el keystore de EAS no
  está atado al nombre del package — sigue funcionando igual tras el
  rename.

  **Convivencia confirmada (no asumida)**: los builds de EAS son un
  snapshot — `app.config.js` y los archivos de Firebase quedan
  horneados en el binario nativo en el momento del prebuild, una sola
  vez; el binario nunca vuelve a leer `app.config.js`, y los reloads de
  Metro solo reemplazan el bundle JS, nunca el shell nativo compilado.
  El build de Android ya en cola quedó horneado con el `app.config.js`
  viejo (`com.cerquita.app` + su `google-services.json`) — el cambio de
  código no lo toca. `Constants.expoConfig` servido por Metro a ese
  cliente viejo va a reportar el package nuevo (mismatch real pero
  inofensivo: grep confirmado, nada en el código lee
  `Constants.expoConfig.android.package`/`.ios.bundleIdentifier` en
  runtime, solo `extra.apiUrl`/`extra.clerkPublishableKey`; el handshake
  de Metro con el dev client tampoco valida consistencia de nombre de
  package). El gate de push de Android de hoy corre contra la entrada
  vieja de Firebase (`com.cerquita.app`), que sigue existiendo intacta
  — no se toca ni se borra. Caveat: no borrar esa entrada de Firebase
  hasta cerrar ese gate.

- **Paso 1 hecho**: `sv.cerquita.app` disponible, registrado en Apple
  Developer con Push Notifications habilitado (sin broadcast).
  `app.config.js` → `ios.bundleIdentifier`/`android.package` =
  `sv.cerquita.app`. Gate: `expo config --type public` resuelve el ID
  nuevo en ambas plataformas, suite completa (40/40 -- 206/206 tests),
  lint, typecheck, `expo-doctor` 21/21 -- todo en verde sin necesitar
  los archivos nuevos de Firebase todavía (mismo motivo de siempre).
  Pendiente (pasos 2-5 del plan de arriba): Firebase Console (2 apps
  nuevas + re-upload de la APNs key), `eas env:set` con los archivos
  nuevos, `eas build --platform ios`.
- **Pasos 2-4 hechos, y confirman en la práctica el mecanismo de
  validación que motivó todo este plan**: Firebase Console + los dos
  `eas env:set` con los archivos nuevos, ya hechos. El build de Android
  que había quedado en cola (previo al commit del rename) terminó
  fallando -- quedó pidiendo el package viejo (`com.cerquita.app`)
  mientras el `google-services.json` que EAS ya resolvía vía env var
  era el nuevo (`sv.cerquita.app`); el plugin de Google Services valida
  en build time que el `applicationId` tenga un client matching en el
  JSON, así que no hay build parcialmente válido posible con esa
  combinación -- build zombie, descartado (la "convivencia" que
  habíamos confirmado dejó de aplicar apenas ese build específico
  quedó viejo respecto al JSON, no por el cambio de código en sí).
  Ambos builds (Android + iOS) relanzados de cero, ya alineados
  (package/bundleId nuevo + JSON nuevo en los dos).
- **Contingencia del C2 confirmada**: el build de iOS falló en `pod
install` -- exactamente la clase de riesgo anotada al planear C2,
  pero con el diagnóstico invertido respecto a la nota original (ver
  "Push FCM iOS — activación" y Notas/backlog para el detalle
  corregido). Error real: pod Swift `FirebaseCoreInternal` sin module
  map para su dependencia `GoogleUtilities` -- causado por NO tener
  `useFrameworks: "static"` seteado, no por tenerlo. Fix verificado
  contra la documentación oficial de RNFirebase (no la nota
  especulativa previa): `expo-build-properties` nuevo, config
  `ios`-only (`useFrameworks: "static"` + `forceStaticLinking:
['RNFBApp', 'RNFBMessaging']`). Radio de impacto confirmado: sin
  bloque `android` en el plugin, cero efecto en Android -- el APK ya
  instalado sigue válido, el próximo build de Android tampoco necesita
  esto. Gate: suite completa (40/40, 206/206 tests), lint, typecheck,
  `expo-doctor` 21/21, `expo config` confirmado resolviendo el plugin
  sin bloque Android. Pendiente: relanzar el build de iOS.
- **Bug del gate de push en Android** (dev token temporal usado para
  probar como super-admin desde Swagger -- confirmó que la cancelación
  de soporte + polling siguen funcionando, coherente con "no hay token,
  el backend no tiene a quién enviarle"): la tarjeta de permiso nunca
  apareció en la confirmación y `device_tokens` quedó vacía. Diagnóstico
  leyendo el flujo completo (`PushProvider`/`NotificationPermissionCard`/
  registro): el registro **no** está atado únicamente al tap de la
  tarjeta -- `PushProvider` ya tenía una rama silenciosa independiente
  (`if (status !== 'granted') return`, en cada transición de
  `isSignedIn`), correcta y ajena al flag `prompted`. Causa más probable
  (Expo SDK 56 compila contra un target SDK de Android bien arriba de
  33, así que un `undetermined` genuino era lo esperable en el primer
  lanzamiento real): el flag `push_permission_prompted` en AsyncStorage
  quedó seteado de una sesión de testing anterior sobre el mismo
  install -- con `prompted` verdadero, la tarjeta correctamente no se
  muestra, y con `status` todavía `undetermined` (nunca concedido de
  verdad), la rama silenciosa de `PushProvider` también correctamente
  no hace nada. Ambos síntomas explicados por un solo estado stale, sin
  necesitar un bug adicional.

  **Gap real encontrado al trazar el flujo** (no explica necesariamente
  este caso puntual, pero es una falla de diseño real): cero
  visibilidad de errores en todo el pipeline de registro --
  `getFcmToken()` tragaba cualquier excepción en silencio,
  `PushProvider` tenía el IIFE async de su registro silencioso SIN
  try/catch (una excepción ahí quedaba como unhandled rejection,
  invisible), y ninguna de las dos llamadas a `registerDevice.mutate`
  tenía `onError`. Fix: logging `__DEV__`-only en cada punto de
  decisión (status del permiso, resultado de `getFcmToken`, éxito/error
  de la mutación) en los tres lugares, más un `try/catch` real en el
  bloque que no lo tenía. Se extrajo además `shouldShowPermissionCard(status,
prompted)` (`src/features/push/utils/`, pura, testeada) -- codifica
  la regla exacta de visibilidad de la tarjeta en vez de dejarla inline,
  para que un futuro cambio ahí no pueda romperla en silencio.

  Acción para vos antes del reintento: limpiar el storage de la app
  (Settings → Apps → Cerquita → Almacenamiento → Borrar almacenamiento)
  o reinstalar, para resetear el flag stale y volver a `undetermined`
  real. Es JS -- sin rebuild, el mismo APK ya instalado sirve. Gate:
  suite completa (41/41 -- 210/210 tests), lint, typecheck,
  `expo-doctor` 21/21.

## Context

El carrito y el checkout (Fase 4) terminan en `OrderConfirmationScreen`
mostrando el pedido recién creado (`status: PENDIENTE`), sin tracking ni
polling — quedó anotado a propósito como pendiente de esta fase. Esta fase
le da al pedido su ciclo de vida visible: pantalla de seguimiento con
polling respetando el ETag/rate-limit que el contrato ya expone, cancelación
por el cliente, y push FCM (Android primero, iOS originalmente
bloqueado-documentado por la APNs key — **actualizado**: el enrollment
de Apple se aprobó a mitad de fase, la activación de iOS pasó a
Checkpoint C2 dentro de esta misma fase, ver esa sección). También es el
punto de inflexión operativo que el plan maestro marcó desde la Fase 0:
de acá en adelante la app deja de poder correr en Expo Go (publicado en
las tiendas) y pasa a development build.

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
local.

**Corrección real (el plan original acá estaba incompleto)**: para
builds en la nube, `eas build` **solo sube al builder los archivos
trackeados por git** — un `googleServicesFile` apuntando a un path
estático gitignorado nunca llega, y el prebuild remoto falla. `app.config.js`
resuelve `googleServicesFile` desde una env var (`GOOGLE_SERVICES_JSON`/
`GOOGLE_SERVICE_INFO_PLIST`) con fallback al archivo local:

```js
const googleServicesJson = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
const googleServiceInfoPlist =
  process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist';
```

Los archivos se suben como **EAS environment variable de tipo `file`**,
en el environment `development` (el que resuelve nuestro único perfil de
build hoy) — comando tuyo, toca credenciales. Verificado contra el CLI
real: `eas env:create` existe pero está **deprecado a favor de `eas
env:set`** (ambos comandos aceptan los mismos flags; `set` es el
vigente):

```
eas env:set development --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility sensitive
eas env:set development --scope project --name GOOGLE_SERVICE_INFO_PLIST --type file --value ./GoogleService-Info.plist --visibility sensitive
```

`--visibility sensitive` (no `secret`): ninguno de los dos archivos es
un secreto real (Google documenta que `google-services.json` es seguro
de embeber en un cliente, extraíble de cualquier APK/IPA ya publicado)
— pero tampoco tiene sentido dejarlos en `plaintext` en logs de build
sin necesidad. Mismo criterio "credencial-adyacente" que ya motivó no
versionarlos.

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

## Push FCM iOS — activación (Checkpoint C2)

Se agrega a mitad de fase: el enrollment de Apple Developer se aprobó
antes de lo previsto y la APNs key (`.p8`, Sandbox & Production, Key
ID/Team ID) ya está subida en Firebase — el bloqueador que sostenía el
`if` de plataforma comentado ya no existe. Gatillado explícitamente por
el usuario, implementación recién después de que el gate visual del
Checkpoint C (Android) esté en verde — mismo criterio de aislamiento que
A/B/C: no mezclar una regresión de iOS con algo que en realidad ya
estaba roto en Android.

**Verificación técnica hecha, no supuesta**: RNFirebase en iOS
auto-registra para remote messages por defecto
(`messaging_ios_auto_register_for_remote_messages`; este proyecto no
tiene `firebase.json` propio, así que el default aplica) — `getToken()`
no necesita `registerDeviceForRemoteMessages()` explícito.
`getFcmToken()` ya quedó escrito así en Checkpoint C (camino uniforme,
intencional) — **cero cambios de código ahí**.

### Qué se destapa (5 puntos exactos)

1. `src/features/auth/hooks/useLogout.ts:30` — quitar
   `if (Platform.OS === 'android')`; el unregister-antes-de-signOut
   corre en ambas plataformas. El import de `Platform` queda sin uso,
   se borra.
2. `src/features/push/components/PushProvider.tsx:26` — el guard pasa
   de `if (!isSignedIn || Platform.OS !== 'android')` a
   `if (!isSignedIn)`.
3. `src/features/push/components/NotificationPermissionCard.tsx:26` —
   se quita el `if (Platform.OS !== 'android') return;`; la tarjeta se
   muestra en ambas plataformas.
4. `PushProvider.tsx:36` y `NotificationPermissionCard.tsx:57` — el
   literal hardcodeado `platform: 'android'` en el `registerDevice.mutate(...)`
   pasa a dinámico. Se extrae `getDevicePlatform()` (nuevo,
   `src/features/push/getDevicePlatform.ts`) en vez de duplicar el
   ternario — se usa en 2 lugares, cumple el criterio de extracción ya
   establecido en el proyecto.
5. Nada más cambia: los listeners de `PushProvider`
   (`onMessage`/`onNotificationOpenedApp`/`getInitialNotification`) y
   `getFcmToken()` ya eran uniformes desde Checkpoint C — se escribieron
   así a propósito para este momento exacto.

### ¿Rebuild de Android también?

**No.** Los 5 cambios de arriba son 100% JS — ningún plugin nuevo,
ninguna dependencia nueva, `app.config.js` no cambia (`googleServicesFile`
de ambas plataformas ya está desde Checkpoint C). El dev client de
Android que ya está en la cola de EAS los recibe con un reload de Metro
normal, sin build nueva. Solo hace falta la build nueva de **iOS** — que
además es la primera build nativa de iOS de todo el proyecto (Checkpoint
A la difirió explícitamente: "sin build posible hasta que Apple apruebe
tu enrollment").

### `eas build --profile development --platform ios` — qué va a pedir la primera vez

Sin credenciales de iOS configuradas todavía en este proyecto EAS, el
flujo interactivo:

1. **Login con tu Apple ID** (usuario/contraseña + 2FA) — lo pide una
   vez, después lo cachea.
2. **Selección de Apple Team** (si tenés más de uno; con el enrollment
   recién aprobado debería ser uno solo).
3. **Certificado de firma**: para el perfil `development`
   (`developmentClient: true`, `distribution: "internal"` en nuestro
   `eas.json`), EAS ofrece generar uno nuevo automáticamente vía la
   Apple Developer API — aceptás y sigue.
4. **Registro del dispositivo (lo que preguntaste)**: un build
   `internal`/development necesita el UDID de tu iPhone en un
   provisioning profile ad-hoc. Corré esto ANTES del build, para no
   tener la sorpresa a mitad de la cola:
   ```
   eas device:create
   ```
   Te da un link/QR — **lo abrís en Safari desde el iPhone** (no
   funciona desde otro dispositivo/navegador). Instala un perfil de
   configuración que reporta el UDID a Expo/Apple directamente, sin
   Xcode y sin buscar el UDID a mano. Confirmás en la CLI cuando
   termina.
5. Con el dispositivo ya registrado, EAS genera/actualiza el
   provisioning profile ad-hoc incluyéndolo, y registra el App ID
   `com.cerquita.app` en tu cuenta si todavía no existe ahí.
6. **Capability de Push Notifications**: EAS suele habilitarla sola en
   el App ID al detectar los plugins de `@react-native-firebase/messaging`/
   `expo-notifications`. Si el build falla por un error de
   provisioning/capability, ese es el primer lugar a mirar (Apple
   Developer → Certificates, IDs & Profiles → Identifiers →
   `com.cerquita.app` → Capabilities → Push Notifications).
7. Gotcha no relacionado con EAS: si la cuenta recién aprobada todavía
   no aceptó el Program License Agreement vigente, el build puede
   fallar ahí — se resuelve entrando una vez a developer.apple.com.

**Riesgo de compatibilidad ya anotado en el plan maestro — contingencia
confirmada, corrección sobre lo anotado acá originalmente**: el primer
build real de iOS falló en `pod install`, pero no con el síntoma que
esta sección anticipaba ("non-modular include in framework module").
Error real (verificado, no el supuesto):

```
[!] The following Swift pods cannot yet be integrated as static libraries:
The Swift pod `FirebaseCoreInternal` depends upon `GoogleUtilities`, which
does not define modules.
```

La lectura original de acá tenía el diagnóstico invertido: no era que
`useFrameworks: "static"` fuera a CAUSAR un problema si se seteaba — era
que **no tenerlo seteado** (el default de este proyecto) es lo que
rompe, porque `firebase-ios-sdk` exige integración por frameworks para
que CocoaPods genere module maps para los pods Swift (como
`FirebaseCoreInternal`) que dependen de pods Objective-C (como
`GoogleUtilities`). Verificado contra la documentación oficial actual de
RNFirebase (rnfirebase.io), no contra la nota especulativa de esta
sección. Fix aplicado — `expo-build-properties`, **solo bloque `ios`**:

```js
[
  'expo-build-properties',
  {
    ios: {
      useFrameworks: 'static',
      forceStaticLinking: ['RNFBApp', 'RNFBMessaging'],
    },
  },
],
```

`forceStaticLinking` (requisito adicional para RN 0.84+/Expo 54+, este
proyecto en RN 0.85.3/SDK 56 cae ahí) lista cada módulo RNFB en uso —
acá solo `RNFBApp`/`RNFBMessaging`, los dos únicos paquetes instalados.

**Radio de impacto, respondido explícito**: el plugin no tiene bloque
`android` — `expo-build-properties` aplica sus cambios por plataforma de
forma aislada, así que esto no toca nada de Android, ni ahora ni en el
próximo rebuild (el concepto `useFrameworks`/CocoaPods no existe del
lado de Gradle). El APK ya instalado del gate de push sigue
completamente válido — no se invalida por este cambio, y el próximo
build de Android tampoco necesita nada de esto.

### Gate visual C2

1. **Android, sin rebuild**: smoke rápido de login/logout sobre el
   mismo dev client — confirmar que `POST /devices` sigue mandando
   `platform: "android"` (no `"ios"`) tras el refactor a
   `getDevicePlatform()`.
2. Instalar el nuevo dev client de iOS en el iPhone registrado.
3. Confirmar un pedido → la tarjeta de permiso aparece también en iOS
   ahora → "Activar notificaciones" → diálogo nativo de iOS (Allow/Don't
   Allow) → conceder.
4. `PATCH` el estado del pedido desde Swagger (owner) → push real llega
   al iPhone.
5. Foreground: notificación local mostrada (mismo camino ya uniforme de
   `onMessage` + `scheduleNotificationAsync`) → tap → aterriza en
   `/orders/:id`.
6. Background/quit: mandar la app a background (o matarla) antes del
   `PATCH`, tocar la notificación al llegar → mismo destino, vía
   `onNotificationOpenedApp`/`getInitialNotification`.
7. Logout en iOS → confirmar en logs/Railway que ahora sí se dispara
   `DELETE /devices` (antes quedaba excluido por el guard de Android).

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

### Checkpoint C2 — Push FCM (iOS) + primer dev build de iPhone

Agregado a mitad de fase (Apple Developer aprobado + APNs key subida
antes de lo previsto) — ver "Push FCM iOS — activación" arriba para el
detalle completo. **No arranca hasta que el gate visual del Checkpoint
C (Android) esté en verde.**

- Quitar los 3 guards de plataforma (`useLogout.ts`,
  `PushProvider.tsx`, `NotificationPermissionCard.tsx`) + extraer
  `getDevicePlatform()` (nuevo, usado en 2 lugares) para los 2 literales
  `platform: 'android'` hardcodeados. Sin cambios en `getFcmToken()`
  (ya uniforme) ni en `app.config.js` (`googleServicesFile` de iOS ya
  estaba).
- Gate (yo): typecheck + tests afectados + suite completa + lint +
  `expo-doctor` — sin cambios de dependencias ni de config nativa, gate
  más liviano que A/B/C.
- Gate (vos): `eas device:create` (registrar el iPhone) → `eas build
--profile development --platform ios` (primera build nativa de iOS
  del proyecto — credenciales/certificado/App ID los resuelve EAS
  interactivo) → instalar → gate visual de 7 pasos de la sección de
  arriba (incluye un smoke de Android sin rebuild, para confirmar que
  el refactor de `getDevicePlatform()` no le rompió nada).

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
- **Actualizado — ya no bloqueado**: el enrollment de Apple Developer se
  aprobó y la APNs key ya está subida antes de lo previsto. La
  activación de push en iOS pasó de "Fase 9" a **Checkpoint C2, dentro
  de esta misma fase** — ver "Push FCM iOS — activación" arriba.
  Tracking en iOS siguió siendo 100% funcional vía polling mientras
  tanto (y sigue siéndolo como fallback si el permiso se niega).
- **`expo-build-properties`**: contingencia confirmada y agregada. El
  primer build de iOS falló en `pod install` -- no por headers no
  modulares como se especulaba, sino por lo contrario: **no tener**
  `useFrameworks: "static"` seteado es lo que rompe (`firebase-ios-sdk`
  exige integración por frameworks para que los pods Swift generen
  module maps de sus deps Objective-C). Ver "Push FCM iOS —
  activación" arriba para el error real, el fix aplicado
  (`useFrameworks: "static"` + `forceStaticLinking`, verificado contra
  la doc oficial de RNFirebase) y el radio de impacto (solo iOS, el
  APK de Android instalado sigue válido).
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
  `eas env:set`/`eas device:create` (credenciales — son tuyos). No
  `git push`.
