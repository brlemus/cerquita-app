# Cerquita — Plan de la App Mobile v1

App móvil de Cerquita. El MVP (Fases 0-9) es **customer puro**; a partir de
ahí la misma app suma un **modo owner** para dueños de negocio (ver
"Re-alcance: modo owner" más abajo) — el repo web queda acotado a **solo el
panel de super-admin**, no a owner/admin en general como se asumía
originalmente. Consume `cerquita-api` (NestJS, en producción) según
`docs/API_CONTRACT.md` — el contrato está fijado, esta app se adapta a él.
Diseño importado de Claude Design (`docs/design/`, tokens en
`docs/design/TOKENS.md`).

## Stack (cerrado)

| Área                                 | Elección                                                                                                | Justificación (1 línea)                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                            | Expo (managed workflow + dev client) + TypeScript strict                                                | decidido — mejor DX de RN hoy, `expo-*` cubre la mayoría de necesidades nativas sin eyectar                                                    |
| Navegación                           | **Expo Router**                                                                                         | file-based, deep-linking y tipado de rutas nativos de Expo, cero configuración extra sobre lo que ya trae el framework                         |
| Data-fetching / server-state (cache) | **TanStack Query**                                                                                      | es la capa de cache con invalidación que pide la arquitectura; maneja `ETag`/304 del polling y cancela requests al desmontar sin código propio |
| Estado de cliente (sesión + carrito) | **Zustand**                                                                                             | selectors granulares — el carrito cambia en cada tap sin re-renderizar pantallas que no lo leen; sin el boilerplate de Redux                   |
| Formularios                          | **react-hook-form + zod**                                                                               | inputs no controlados = menos re-render; los schemas zod espejan 1:1 las validaciones del DTO del backend (`docs/API_CONTRACT.md`)             |
| Auth                                 | **@clerk/clerk-expo**                                                                                   | SDK oficial de Clerk para Expo; `tokenCache` respaldado por `expo-secure-store` (patrón documentado)                                           |
| Push                                 | **@react-native-firebase/messaging**                                                                    | ver nota de riesgo técnico en Fase 5 — necesario para obtener un FCM token real en iOS, no solo Android                                        |
| Storage                              | **expo-secure-store** (tokens, vía Clerk) / **AsyncStorage** (flags no sensibles, ej. "vio onboarding") | tokens NUNCA en storage plano — regla dura                                                                                                     |
| Imágenes                             | **expo-image**                                                                                          | cache en disco/memoria automático — requisito de performance                                                                                   |
| Listas                               | **FlashList**                                                                                           | virtualización real; ninguna lista (negocios, productos, pedidos) se renderiza con `.map` o `FlatList` sin ella                                |
| Ubicación (dirección)                | **expo-location**                                                                                       | GPS + reverse geocoding; sin mapa interactivo por decisión de producto (ver Fase 4) — cero dependencias nativas extra                          |
| Testing                              | **Jest + jest-expo + React Native Testing Library**                                                     | decidido en `CLAUDE.md`                                                                                                                        |
| Iconos                               | **react-native-svg** (ya incluido por Expo), SVGs a medida traducidos del diseño                        | el prototipo no usa una librería de íconos — sumar una sería una dependencia sin necesidad real                                                |
| Estilos                              | **Theme propio** (`src/shared/ui/theme.ts`) derivado de `docs/design/TOKENS.md`                         | el diseño es simple (cards, botones, inputs custom) — no justifica el costo/tamaño de una librería de componentes pesada                       |

**Riesgos de compatibilidad señalados**: el push en iOS requiere una
librería nativa (`@react-native-firebase/messaging`) y por lo tanto un
**development build** (EAS o `expo prebuild` + build local) desde la
Fase 5 en adelante — Expo Go no alcanza para push nativo real en ninguna
plataforma con este backend. El resto del stack es 100% compatible con
Expo Go hasta esa fase.

## Arquitectura

Por feature, capas planas dentro de cada una (ya definido en `CLAUDE.md`):

```
src/
  features/
    auth/            screens, components, hooks, api
    marketplace/      (home, búsqueda, categorías, detalle de negocio)
    cart/
    checkout/         (direcciones, confirmación de pedido)
    orders/           (historial, detalle, tracking)
    reviews/
    feedback/
    profile/
  shared/
    api/              client HTTP único + types.ts (espejo de los DTOs del contrato)
    ui/               theme.ts + componentes base (Button, Card, Input, EmptyState, Skeleton…)
    hooks/             transversales (ej. useDebounce, useAppState)
```

Sin `components/` ni `hooks/` globales sueltos — un componente se extrae a
`shared/ui` recién cuando se repite entre 2+ features, no antes.

**API client** (`shared/api/client.ts`) es la única puerta al backend:

- Base URL desde `app.config.ts` (por entorno), nunca hardcodeada.
- Inyecta `Authorization: Bearer <token>` leyendo el token de Clerk.
- Inyecta `Idempotency-Key` en `POST /orders` (UUID generado por intento
  de compra en el feature de checkout, no en el cliente genérico).
- Mapeo centralizado de errores del contrato → un tipo `ApiError`
  discriminado que cada pantalla consume: `401`→ el cliente Clerk
  refresca o desloguea, `403 suspended`→ pantalla de cuenta suspendida,
  `409` de re-registro → misma pantalla, `409` de transición de pedido →
  invalidar esa query de TanStack Query y refetch, `404` de recurso ajeno
  → tratar como "no existe".
- Ningún `fetch` suelto en un componente — todo pasa por hooks de
  TanStack Query que usan este cliente.

**Server state vs client state**: todo lo que viene del backend
(marketplace, pedidos, direcciones) vive en queries de TanStack Query con
sus keys por feature — nunca copiado a Zustand. Zustand se limita a
sesión (delegada mayormente a Clerk) y carrito (estado 100% local hasta
el POST de checkout).

## Performance (requisito duro)

- **FlashList** en toda lista: negocios, productos/menú, pedidos.
- **expo-image** en todo `<Image>` remoto (logos, fotos de producto) con
  `cachePolicy="memory-disk"`.
- **Memoización quirúrgica**: `renderItem` de listas y selectors de
  Zustand que se leen en componentes de alta frecuencia de render (badge
  del carrito). No memo ritual en componentes que rerenderizan poco.
- **Estados optimistas**: agregar/quitar/cambiar cantidad en el carrito es
  instantáneo (estado local), sin esperar red — recién se toca el backend
  en `POST /orders`.
- **Cancelación de requests al desmontar**: gratis vía TanStack Query
  (`AbortController` interno) — no implementar a mano.
- **Skeletons diseñados** para home, catálogo, detalle de producto e
  historial de pedidos — nunca un spinner de pantalla completa.
- **Cold start**: lazy-load de las pantallas más pesadas (checkout,
  tracking con mapa/polling) vía `React.lazy`/rutas de Expo Router;
  Hermes activado por defecto en Expo, no requiere configuración.
- **Presupuesto de dependencias**: cada librería nueva del stack de
  arriba está justificada; no se suma nada fuera de esa lista sin volver
  a este documento.

## Seguridad (OWASP MASVS)

- Tokens de Clerk **solo** en `expo-secure-store` (vía el `tokenCache` del
  SDK) — nunca en `AsyncStorage` ni en memoria persistida.
- Nada sensible en logs: sin `console.log` de tokens, `fcmToken`,
  direcciones exactas ni payloads completos en builds de producción.
- Validación de todo input con zod **antes** de cualquier `POST`/`PATCH`
  — nunca confiar solo en la validación del backend para el UX (sí para
  la seguridad real, que ya la tiene el backend).
- HTTPS siempre — ya garantizado por el backend, la app no necesita
  pinning adicional en v1.
- Sin secretos hardcodeados: toda config sensible (API keys, IDs de
  Clerk/Firebase) vía `app.config.ts` + EAS secrets, cargados por el
  usuario — nunca commiteados.
- Deep links (los que use Clerk para OAuth/verificación) validados contra
  el esquema esperado antes de actuar sobre ellos.
- SQL injection y CORS son responsabilidad del backend, ya resueltos ahí
  — no se duplica esa capa en el cliente.

## Store readiness

Anticipando rechazos de Apple/Google, construido DENTRO de las fases del
MVP (no como parche final):

- **Borrado de cuenta in-app** (Fase 7): botón en Perfil → confirmación
  seria (no un tap único) → `user.delete()` del SDK de Clerk → sign-out
  local + limpieza de estado (Zustand, cache de TanStack Query,
  `expo-secure-store`). No requiere endpoint nuevo en el backend — el
  webhook `user.deleted` ya está manejado en producción (marca
  `SUSPENDED` con `suspensionReason=CLERK_DELETION`; si el usuario se
  re-registra con el mismo email, el backend relinkea y reactiva
  automáticamente — ver `docs/API_CONTRACT.md`, sección Auth).
  - **Verificar antes de implementar**: que `@clerk/clerk-expo` exponga
    `user.delete()` en la versión instalada y que el proyecto de Clerk
    tenga habilitado el self-service deletion en su dashboard. Si
    cualquiera de las dos no está disponible, esta fase queda bloqueada
    hasta resolverlo — no hay plan B silencioso, se avisa.
  - Privacy policy debe declarar que el historial de pedidos se retiene
    desanonimizado por razones de negocio (contable/legal) tras el
    borrado de la cuenta de acceso.
- **Privacy policy** accesible desde Perfil (URL a definir — pendiente de
  tu input cuando lleguemos a esa fase si no existe ya una).
- **Justificación de permisos in-context**: pantalla propia antes de
  pedir ubicación ("para calcular tu envío") y antes de pedir
  notificaciones ("para avisarte el estado de tu pedido") — nunca pedidos
  en cold start sin contexto.
- **Fallback si se niega un permiso**: el flujo de dirección de entrega
  SIEMPRE es completable sin GPS (entrada manual del campo `line`/
  referencia) — Apple rechaza apps donde negar un permiso rompe el flujo
  principal. Notificaciones denegadas no bloquean nada, solo se pierde el
  push (el polling de tracking sigue funcionando).
- **App Tracking Transparency**: no aplica — no hay tracking cross-app ni
  publicidad de terceros. Se documenta el porqué en la fase de hardening
  para el reviewer de Apple.
- **Guidelines de UI**: safe areas (`react-native-safe-area-context`, ya
  parte de Expo Router) y touch targets ≥44pt en todo componente custom
  de `shared/ui`.

## Fases (una por PR)

| Fase                                  | Entregable                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0 — Scaffold**                      | Expo + TS strict; ESLint/Prettier/Husky/lint-staged; **CI de GitHub Actions corriendo lint + typecheck + test en cada PR**; theme (`shared/ui/theme.ts`) derivado de `docs/design/TOKENS.md`; estructura de carpetas por feature; API client base (`shared/api/client.ts`) con manejo de `Authorization` y mapeo de errores del contrato (aún sin login real que lo alimente) |
| **1 — Auth**                          | Integración `@clerk/clerk-expo`, pantallas Login/Register del diseño, `GET /auth/me` al arrancar sesión, manejo de `401` (refresh/redirect), `403 SUSPENDED` (pantalla de cuenta suspendida) y `409` de re-registro (misma pantalla)                                                                                                                                          |
| **2 — Marketplace**                   | Home, búsqueda, categorías, detalle de negocio, listado de productos — `FlashList` + `expo-image`, skeletons, estado vacío/error diseñados                                                                                                                                                                                                                                    |
| **3 — Detalle de producto + Carrito** | Selector de variantes, carrito con estado optimista (Zustand), badge de carrito                                                                                                                                                                                                                                                                                               |
| **4 — Checkout**                      | CRUD de direcciones (captura por GPS + `expo-location`, fallback a entrada manual si se niega el permiso, campo de referencia/instrucciones como protagonista del formulario — no un extra), selección de dirección guardada, confirmación de pedido con `Idempotency-Key`, manejo de `409` por negocio cerrado/mínimo no alcanzado                                           |
| **5 — Tracking + Push**               | Polling de `GET /orders/:id/status` respetando `ETag`/`If-None-Match`/304 y el límite de 30/min; registro/baja de device token en login/logout (`POST`/`DELETE /devices`). **Requiere development build desde esta fase** (ver riesgo técnico abajo)                                                                                                                          |
| **6a — Tab bar + Mis pedidos**        | Partición de la Fase 6 original (ver `docs/phases/phase-6-orders-tabs.md`): tab bar definitiva (Inicio/Pedidos/Perfil, con Perfil como stub mínimo — nombre/email de Clerk + cerrar sesión, el resto es Fase 7) y pantalla "Mis pedidos" (`GET /orders`, infinite scroll, pull-to-refresh, badge de estado) navegando al tracking de la Fase 5                                |
| **6b — Reviews + Feedback**           | Review post-`ENTREGADO` (una por pedido), formulario de feedback general — PR aparte de la 6a, todavía sin planificar en detalle                                                                                                                                                                                                                                              |
| **7 — Perfil + Borrado de cuenta**    | Pantalla de perfil completa (reemplaza el stub de la 6a): borrado de cuenta vía Clerk (ver Store readiness), privacy policy accesible, más opciones de cuenta                                                                                                                                                                                                                 |
| **8 — Hardening + Store readiness**   | Checklist final de MASVS, accesibilidad (safe areas, touch targets, contraste), pantallas de permisos con contexto, ATT documentado como no-aplica, auditoría de logs sensibles                                                                                                                                                                                               |
| **9 — Publicación**                   | Ver checklist al final de este documento                                                                                                                                                                                                                                                                                                                                      |

### Riesgo técnico conocido — Fase 5 (push, iOS vs Android)

El backend espera un **FCM registration token** real en
`POST /devices` (lo manda directo a Firebase Admin SDK — ver
`docs/API_CONTRACT.md`, sección Devices). Android y iOS llegan a ese
token por caminos distintos:

- **Android**: el token nativo del dispositivo YA ES un token FCM
  (Android se registra contra FCM directamente). Camino directo.
- **iOS**: el token nativo del dispositivo es un token de **APNs**, no de
  FCM — son sistemas distintos. Para obtener un token FCM real en iOS hay
  que registrar ese token de APNs contra Firebase, lo que requiere:
  - `@react-native-firebase/messaging` configurado en el proyecto (no
    alcanza con `expo-notifications` solo, que en iOS devuelve el token
    de APNs crudo).
  - `GoogleService-Info.plist` (config de Firebase para iOS).
  - Una **APNs Authentication Key** (`.p8`) subida al proyecto de
    Firebase en la consola — esto lo hacés vos, es una credencial, no la
    genera ni la sube Claude Code.
  - Development build (EAS) — no funciona en Expo Go.

**La Fase 5 resuelve esto de frente**, no como parche: se implementa
`@react-native-firebase/messaging` desde el inicio de la fase para ambas
plataformas (uniforma el código de obtención de token en vez de tener dos
caminos distintos Android/iOS), con el entendido de que vos configurás
las credenciales de Firebase/APNs antes de que la fase pueda probarse
end-to-end en un device iOS real.

## Re-alcance: modo owner (decisión post-Fase 1.5)

**Cambio de alcance respecto a la v1 original de este documento**: el modo
owner **sí vive en esta app**, en fases posteriores a las de customer
(post-Fase 9 — números de fase TBD, se planifican recién cuando se lleguen a
abordar, no ahora). El repo web deja de ser "owner/admin" en general y queda
acotado a **solo el panel de super-admin**.

A alto nivel (sin desglose de checkpoints todavía — eso es planificación de
esas fases futuras):

- **Alta de negocio desde Perfil**: auto-servicio contra el backend, que ya
  soporta la promoción de un `User` a `BUSINESS_OWNER` (endpoints
  `business/me/*`, ya en producción). Punto de entrada tipo "¿Tenés un
  negocio?" en Perfil.
- **Chooser post-login** ("¿Dónde querés entrar?"): solo aparece para
  usuarios que ya tienen `businessId` (son owner). El diseño de esta
  pantalla ya está en `docs/design/` (prototipo completo, incluye rol
  chooser).
- **Panel de pedidos entrantes** (owner): ver pedidos del propio negocio y
  cambiar su estado (transiciones permitidas al actor `BUSINESS`, ver
  `docs/API_CONTRACT.md` sección Orders).
- **Catálogo básico** (owner): alta/edición simple de productos del propio
  negocio.
- **Toggle `isOpen`** (owner): contra `business/me/*`.

**Sin cambios**: el registro sigue sin selector de rol — todo usuario nuevo
nace `CUSTOMER` vía el flujo JIT del backend (decisión ya confirmada en
Fase 1, ver `docs/phases/phase-1-auth.md`). La promoción a `BUSINESS_OWNER`
pasa exclusivamente por el flujo de auto-servicio desde Perfil, nunca por un
selector en el registro.

## Paridad con el prototipo

El prototipo (`docs/design/Cerca.dc.html`) dibuja elementos de UI que la
app real todavía no construyó, o que nunca va a construir tal cual están
ahí porque el contrato del backend no los sostiene. Esta tabla es el mapa
de "qué pasó con cada uno" — para no tener que redescubrir en cada fase
si algo quedó pendiente, se recortó a propósito, o directamente no es
construible con el backend actual.

| Elemento del prototipo                              | Destino                                          | Nota                                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CTA "Ir a pagar" del carrito                        | Fase 4                                           | Ya estaba en el alcance de Checkout — la Fase 3 lo dejó fuera a propósito, sin destino todavía (ver `docs/phases/phase-3-cart.md`).                                                                                                                                                |
| Selector de dirección de entrega                    | Fase 4                                           | Ya estaba en el alcance (CRUD de direcciones + selección de dirección guardada).                                                                                                                                                                                                   |
| "Sugerencias del negocio" en el carrito             | Fase 4 (alcance sumado)                          | El prototipo las muestra en la pantalla de carrito (productos del mismo negocio no agregados todavía). Se suman a Checkout porque comparten lógica de "agregar sin pasar por Product Detail" con el punto siguiente.                                                               |
| Quick-add "+" para productos sin variantes          | Fase 4 (alcance sumado)                          | Mismo patrón que las sugerencias (tarjeta chica con "+" directo, sin abrir Product Detail). La Fase 3 solo resolvió el flujo completo vía Product Detail; el atajo se suma a Fase 4 en vez de abrir un checkpoint aparte ahora.                                                    |
| Tab bar (Inicio/Pedidos/Perfil)                     | Fase 6a — construida                             | Fase 2 ya documentó que un shell de tabs con destinos vacíos no se justifica (`docs/phases/phase-2-marketplace.md`). Pedidos fue el primer segundo-destino real de primer nivel de la app — ahí se decidió y se construyó. Perfil queda como stub hasta la Fase 7.                 |
| Nombre/logo del negocio en la fila de "Mis pedidos" | Bloqueado — gap de contrato (nuevo, Fase 6a)     | `GET /orders` (`OrderResponseDto`) trae `businessId` pero no `businessName`/`logoUrl` — mostrarlo exigiría un fetch por pedido (N+1), descartado. La fila muestra estado, fecha, resumen de ítems y total; necesita que el backend sume el campo al DTO de `Order`.                |
| Chips de categoría de catálogo (detalle de negocio) | Bloqueado — gap de contrato                      | Ya anotado en Fase 2: falta `catalogCategoryName` en el DTO de producto (o un endpoint de categorías de catálogo). Sin nombre legible no hay chip que mostrar sin inventar.                                                                                                        |
| Búsqueda de productos                               | Bloqueado — gap de contrato                      | Ya anotado en Fase 2: `GET /marketplace/businesses` solo expone `search` sobre el nombre del negocio; no existe búsqueda de productos en el contrato.                                                                                                                              |
| Orden por cercanía                                  | Bloqueado — gap de contrato (nuevo, anotado acá) | `Business` tiene `lat`/`lng` (nullable), pero `GET /marketplace/businesses` no expone ningún parámetro de orden/distancia — solo paginación por cursor. Sin ese parámetro en el backend no hay forma de pedir "más cercanos primero".                                              |
| Banner promocional (Home)                           | Backlog post-MVP                                 | Requiere un modelo de promociones (tabla + endpoint) que hoy no existe en el contrato — ver ítem agregado en Backlog post-MVP, abajo.                                                                                                                                              |
| Campana de notificaciones (Home)                    | Recorte permanente                               | El push de Fase 5 deep-linkea directo al pedido correspondiente (`docs/API_CONTRACT.md`, sección Devices). Un centro de notificaciones aparte sería UI sin función real, no una fase pendiente.                                                                                    |
| Fotos de producto reales                            | Dato pendiente (Cloudinary + fases owner)        | El campo `photoUrl` ya se consume donde existe, con fallback diseñado cuando es `null` (Fase 2/3). Las fotos reales dependen de que el flujo de upload a Cloudinary y el catálogo de modo owner (ver "Re-alcance: modo owner" arriba) estén construidos y en uso por los negocios. |
| Pill "Próximamente" (negocio/producto no activo)    | Recorte permanente                               | El contrato solo expone `status: ACTIVE`/`isActive: true` al customer (`docs/API_CONTRACT.md`, sección Marketplace) — un negocio o producto `PENDING`/inactivo nunca llega al cliente, así que no hay estado que mostrar.                                                          |

## Backlog post-MVP

- Mapa interactivo con pin arrastrable para direcciones (`react-native-maps`
  - Google Maps API key en Android) — si hay demanda real de ajustar el
    pin más allá de "estoy parado acá + referencia en texto".
- Favoritos / negocios recientes.
- Notificaciones de promociones (opt-in separado del push transaccional
  de pedidos).
- Banner promocional en Home (prototipo) — requiere un modelo de
  promociones (tabla + endpoint) que hoy no existe en el contrato.
- Multi-negocio por pedido.
- Lo que quede fuera de alcance de las fases 0-9 según se vaya
  descubriendo durante el desarrollo.

## Publicación (Fase 9 — checklist)

Paso a paso, marcando qué es tuyo vs de Claude Code:

1. **Cuenta de developer** (Apple Developer Program, Google Play Console) — **tuyo**, prerequisito.
2. **Certificados y credenciales** (Apple: certificados + provisioning profiles; Android: keystore) — gestionados por EAS pero las cuentas/pagos son **tuyos**.
3. **Assets de store**: ícono, splash screen, screenshots por tamaño de dispositivo, descripción corta/larga, palabras clave — Claude Code prepara los assets técnicos (ícono/splash desde el diseño) y arma copys en borrador; **vos** los revisás/aprobás y los cargás en las consolas.
4. **`eas build`** (development → preview → production) — **NO lo ejecuta Claude Code** (restricción dura de `CLAUDE.md`), lo corrés vos.
5. **TestFlight / Internal testing** — subida y distribución a testers, **tuyo**.
6. **`eas submit`** — **NO lo ejecuta Claude Code**, lo corrés vos.
7. **Revisión de Apple/Google** — esperar resultado; si hay rechazo, Claude Code ayuda a diagnosticar y corregir contra el checklist de Store readiness (Fase 8).
8. **Producción** — publicación final, **tuya**.
