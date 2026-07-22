# Cerquita — Plan de la App Mobile (customer) v1

App móvil de Cerquita, **solo customer** (owner/admin vive en un repo web
aparte, fuera de este backlog). Consume `cerquita-api` (NestJS, en
producción) según `docs/API_CONTRACT.md` — el contrato está fijado, esta
app se adapta a él. Diseño importado de Claude Design (`docs/design/`,
tokens en `docs/design/TOKENS.md`).

## Stack (cerrado)

| Área | Elección | Justificación (1 línea) |
|---|---|---|
| Framework | Expo (managed workflow + dev client) + TypeScript strict | decidido — mejor DX de RN hoy, `expo-*` cubre la mayoría de necesidades nativas sin eyectar |
| Navegación | **Expo Router** | file-based, deep-linking y tipado de rutas nativos de Expo, cero configuración extra sobre lo que ya trae el framework |
| Data-fetching / server-state (cache) | **TanStack Query** | es la capa de cache con invalidación que pide la arquitectura; maneja `ETag`/304 del polling y cancela requests al desmontar sin código propio |
| Estado de cliente (sesión + carrito) | **Zustand** | selectors granulares — el carrito cambia en cada tap sin re-renderizar pantallas que no lo leen; sin el boilerplate de Redux |
| Formularios | **react-hook-form + zod** | inputs no controlados = menos re-render; los schemas zod espejan 1:1 las validaciones del DTO del backend (`docs/API_CONTRACT.md`) |
| Auth | **@clerk/clerk-expo** | SDK oficial de Clerk para Expo; `tokenCache` respaldado por `expo-secure-store` (patrón documentado) |
| Push | **@react-native-firebase/messaging** | ver nota de riesgo técnico en Fase 5 — necesario para obtener un FCM token real en iOS, no solo Android |
| Storage | **expo-secure-store** (tokens, vía Clerk) / **AsyncStorage** (flags no sensibles, ej. "vio onboarding") | tokens NUNCA en storage plano — regla dura |
| Imágenes | **expo-image** | cache en disco/memoria automático — requisito de performance |
| Listas | **FlashList** | virtualización real; ninguna lista (negocios, productos, pedidos) se renderiza con `.map` o `FlatList` sin ella |
| Ubicación (dirección) | **expo-location** | GPS + reverse geocoding; sin mapa interactivo por decisión de producto (ver Fase 4) — cero dependencias nativas extra |
| Testing | **Jest + jest-expo + React Native Testing Library** | decidido en `CLAUDE.md` |
| Iconos | **react-native-svg** (ya incluido por Expo), SVGs a medida traducidos del diseño | el prototipo no usa una librería de íconos — sumar una sería una dependencia sin necesidad real |
| Estilos | **Theme propio** (`src/shared/ui/theme.ts`) derivado de `docs/design/TOKENS.md` | el diseño es simple (cards, botones, inputs custom) — no justifica el costo/tamaño de una librería de componentes pesada |

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

| Fase | Entregable |
|---|---|
| **0 — Scaffold** | Expo + TS strict; ESLint/Prettier/Husky/lint-staged; **CI de GitHub Actions corriendo lint + typecheck + test en cada PR**; theme (`shared/ui/theme.ts`) derivado de `docs/design/TOKENS.md`; estructura de carpetas por feature; API client base (`shared/api/client.ts`) con manejo de `Authorization` y mapeo de errores del contrato (aún sin login real que lo alimente) |
| **1 — Auth** | Integración `@clerk/clerk-expo`, pantallas Login/Register del diseño, `GET /auth/me` al arrancar sesión, manejo de `401` (refresh/redirect), `403 SUSPENDED` (pantalla de cuenta suspendida) y `409` de re-registro (misma pantalla) |
| **2 — Marketplace** | Home, búsqueda, categorías, detalle de negocio, listado de productos — `FlashList` + `expo-image`, skeletons, estado vacío/error diseñados |
| **3 — Detalle de producto + Carrito** | Selector de variantes, carrito con estado optimista (Zustand), badge de carrito |
| **4 — Checkout** | CRUD de direcciones (captura por GPS + `expo-location`, fallback a entrada manual si se niega el permiso, campo de referencia/instrucciones como protagonista del formulario — no un extra), selección de dirección guardada, confirmación de pedido con `Idempotency-Key`, manejo de `409` por negocio cerrado/mínimo no alcanzado |
| **5 — Tracking + Push** | Polling de `GET /orders/:id/status` respetando `ETag`/`If-None-Match`/304 y el límite de 30/min; registro/baja de device token en login/logout (`POST`/`DELETE /devices`). **Requiere development build desde esta fase** (ver riesgo técnico abajo) |
| **6 — Historial + Reviews + Feedback** | Lista de pedidos, detalle, review post-`ENTREGADO` (una por pedido), formulario de feedback general |
| **7 — Perfil + Borrado de cuenta** | Pantalla de perfil, borrado de cuenta vía Clerk (ver Store readiness), privacy policy accesible |
| **8 — Hardening + Store readiness** | Checklist final de MASVS, accesibilidad (safe areas, touch targets, contraste), pantallas de permisos con contexto, ATT documentado como no-aplica, auditoría de logs sensibles |
| **9 — Publicación** | Ver checklist al final de este documento |

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

## Backlog post-MVP

- Mapa interactivo con pin arrastrable para direcciones (`react-native-maps`
  + Google Maps API key en Android) — si hay demanda real de ajustar el
  pin más allá de "estoy parado acá + referencia en texto".
- Favoritos / negocios recientes.
- Notificaciones de promociones (opt-in separado del push transaccional
  de pedidos).
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
