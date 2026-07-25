# Cerquita — Plan de la App Mobile v1

App móvil de Cerquita. El MVP (Fases 0-9) es **customer puro**; a partir de
ahí la misma app suma un **modo owner** para dueños de negocio (Fases
10-14, ver "Modo owner: Fases 10-14" más abajo) — el repo web queda
acotado a **solo el panel de super-admin**, no a owner/admin en general
como se asumía originalmente. Consume `cerquita-api` (NestJS, en producción) según
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
  pedir ubicación ("para calcular tu envío") — nunca pedidos en cold
  start sin contexto. **Notificaciones usan un patrón distinto** (decisión
  vigente desde Fase 5, ver `docs/phases/phase-5-tracking.md`, sección
  "Decisión: permiso de notificaciones sin paso intermedio"): el permiso
  se pide directo al autenticarse, sin tarjeta intermedia — decisión de
  producto bajo el principio rector del proyecto (mejor UX medida en
  fricción real evitada, no en menos código).
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

_Nota de trazabilidad_: el PR #9 (`chore-app-icon`) es anterior a la regla
de plan file por unidad de trabajo (nacida en el PR #10,
`fix-logout-unhandled-rejection`) — su detalle vive en el README de
`assets/brand/` y en el historial de PRs, no en `docs/phases/`.

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
| **7a — Perfil real**                  | **Construida** (`docs/phases/phase-7a-profile.md`). Pantalla de perfil completa (reemplaza el stub de la 6a): filas Mis direcciones/Notificaciones/Privacidad, privacy policy accesible, borrado de cuenta vía Clerk (ver Store readiness). "Formas de pago" queda diferida (recorte documentado)                                                                             |
| **7b — Recuperación de contraseña**   | **Construida** (`docs/phases/phase-7b-password-reset.md`). Flujo Clerk de reset por código (pantallas forgot-password y reset-password) + link "¿Olvidaste tu contraseña?" restaurado en el login. Caso borde de cuentas social-only cubierto con mensaje que nombra el proveedor                                                                                             |
| **8 — Hardening + Store readiness**   | Checklist final de MASVS, accesibilidad (safe areas, touch targets, contraste), pantallas de permisos con contexto, ATT documentado como no-aplica, auditoría de logs sensibles, persistencia del Idempotency-Key en curso (límite aceptado en Fase 4, ver `docs/phases/phase-4-checkout.md`)                                                                                 |
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

### Fase 7 — Perfil real (detalle)

Adiciones sobre el alcance ya definido en la tabla de arriba, incorporadas
tras el análisis de paridad contra el prototipo (pantalla CLIENT: PROFILE):

- Fila **"Mis direcciones"** → entrada a la gestión de direcciones ya
  construida en Fase 4 (hoy solo alcanzable desde checkout). Reuso, costo
  bajo.
- Fila **"Notificaciones"** → alcance mínimo: estado del permiso + acceso
  a ajustes del sistema. `[PENDIENTE-BYRON]` si se quiere opt-out de push
  promocional in-app (hoy no hay push promocional — probablemente
  diferir).
- Fila **"Formas de pago"**: `[DECISIÓN: diferida]` — el MVP es efectivo
  contra entrega; la fila NO se muestra hasta que exista más de una forma
  de pago. Documentar como recorte temporal, no permanente.
- **Recuperación de contraseña**: integrar acá el chore ya definido en el
  backlog (flujo Clerk reset por código reusando el patrón de 6 dígitos de
  Fase 1 + restaurar el link "¿Olvidaste tu contraseña?" del spec 8b).
  Fase 7 es su hogar natural: cierra el auth completo.

## Modo owner: Fases 10-14 (post-Fase 9)

**Cambio de alcance respecto a la v1 original de este documento**: el modo
owner **sí vive en esta app**, en fases posteriores a las de customer. El
repo web queda acotado a **solo el panel de super-admin**, no a
owner/admin en general como se asumía originalmente.

Partición en fases numeradas (10 a 14). Regla heredada del resto del plan:
cada fase produce su plan file al abordarse — el orden 10→14 es la
secuencia recomendada (10 y 11 son prerequisito del resto). **Cada fase
lista sus prerequisitos de backend**: esos se planifican como fases/chores
en `cerquita-api` con su propio plan, ANTES de la fase mobile que los
consume.

### Fase 10 — Fundaciones del modo owner (identidad, chooser, negocio)

Pantallas del prototipo: CHOOSER (owner), ADMIN: CREATE BUSINESS, parte de
ADMIN: PROFILE.

- Punto de entrada "¿Tenés un negocio?" desde Perfil del cliente (backlog
  de Fase 1, por fin ejecutado) → flujo de conversión a owner.
- `[PENDIENTE-BYRON]` mecánica de alta: ¿auto-servicio (el usuario crea su
  negocio y queda `PENDING` hasta aprobación del super-admin en el panel
  web) o solo por invitación del super-admin? El prototipo sugiere
  auto-servicio (selector "Tengo un negocio" en registro — que se
  descartó por JIT; la conversión post-registro desde Perfil lo
  reemplaza).
- Pantalla **Crear negocio**: nombre, categoría de plataforma, costo de
  envío, mínimo de compra, tiempo estimado, **logo → Cloudinary** (primer
  flujo de upload del mobile).
- **Chooser post-login** ("¿Dónde querés entrar?") para usuarios con
  negocio + switch bidireccional cliente↔admin sin re-login (filas
  "Cambiar a..." de ambos perfiles del prototipo).
- Prerequisitos backend (verificar contra `API_CONTRACT` antes de
  planear): flujo de conversión de rol/alta de negocio por el propio
  usuario; firma/endpoint de upload a Cloudinary (`StoragePort` existe;
  falta la ruta pública de firma).

### Fase 11 — Pedidos entrantes (operación diaria)

Pantallas: ADMIN: DASHBOARD, ADMIN: ORDER DETAIL.

- Lista de pedidos entrantes (badge de nuevos, orden cronológico) con
  actualización en vivo (polling con el patrón ETag existente; push al
  owner como mejora si el backend lo soporta).
- Detalle de pedido con datos del cliente, productos y **cambiar estado**
  (la transición manual que hoy se hace por Swagger, por fin en la app).
- Toggle **`isOpen`** del negocio (abrir/cerrar tienda).
- Prerequisitos backend: los endpoints owner de pedidos existen
  (`business/me/orders`); verificar push/aviso al owner de pedido nuevo y
  de cancelación (este último ya está en backlog del backend como fase
  8-BE).

### Fase 12 — Catálogo del owner

Pantallas: ADMIN: PRODUCTS (tabs Productos/Categorías), ADMIN: EDIT
PRODUCT. Es la fase más grande del continente owner — particionar en su
plan file (mínimo 12a/12b):

- **12a**: lista de productos, CRUD de **categorías del catálogo**,
  alta/edición básica de producto (nombre, descripción, precio, stock,
  categoría, toggle activo/visible, **foto → Cloudinary**).
- **12b**: **variantes** — grupos de opciones, recargo de precio por
  opción, stock por opción (el modelo de inventario real del negocio:
  cada sabor de paleta es su unidad). El formulario del prototipo (la
  pantalla más compleja de todo el diseño) manda como spec.
- Prerequisitos backend: CRUD owner de productos/categorías/variantes
  existe de las fases BE tempranas; verificar upload de foto de producto.

### Fase 13 — Resumen (analytics del negocio)

Pantalla: ADMIN: RESUMEN.

- Métricas del mes: ventas, pedidos, ticket promedio, gráfico de ventas
  por día (7 días), productos bajos en stock, más vendidos, pedidos por
  estado.
- `[PENDIENTE-BYRON]` la métrica **"Ganancia"** del prototipo requiere
  costo por producto, que el modelo no tiene. Opciones: (a) recortarla y
  mostrar solo ventas, (b) agregar campo de costo opcional al producto
  (cambio de modelo BE + formulario de Fase 12). Documentar abierta.
- **Prerequisito backend duro**: NO existen endpoints de
  agregación/analytics en ninguna fase del backend. Esta fase mobile
  exige primero una fase BE nueva ("analytics del owner": agregaciones
  por rango de fechas, cacheables). La Fase 13 mobile no se planifica
  hasta que esa fase BE esté especificada.

### Fase 14 — Perfil del owner + cierre del círculo de reseñas

Pantalla: ADMIN: PROFILE + lectura de reseñas/feedback.

- **Editar negocio** (los mismos campos de Crear negocio + logo).
- Fila **"Métodos de cobro"**: `[DECISIÓN: diferida]` igual que Formas de
  pago del cliente — efectivo-only; la fila no se muestra hasta que
  exista otra.
- **Lectura de reseñas por el owner**: el lado faltante de la Fase
  6b/12-BE — el owner ve rating promedio y comentarios de sus pedidos (el
  contrato BE de Fase 12 ya restringe comentarios a owner + super-admin;
  verificar/crear el endpoint de listado owner). Cierra el círculo: hoy
  las reseñas se escriben y nadie las lee.
- Datos de la cuenta (reuso del Perfil de cliente).

### Sin cambios respecto al registro

El registro sigue sin selector de rol — todo usuario nuevo nace
`CUSTOMER` vía el flujo JIT del backend (decisión ya confirmada en Fase
1, ver `docs/phases/phase-1-auth.md`). La promoción a `BUSINESS_OWNER`
pasa exclusivamente por el flujo de auto-servicio desde Perfil (Fase 10),
nunca por un selector en el registro.

## Paridad con el prototipo

El prototipo (`docs/design/Cerca.dc.html`) dibuja elementos de UI que la
app real todavía no construyó, o que nunca va a construir tal cual están
ahí porque el contrato del backend no los sostiene. Esta tabla es el mapa
de "qué pasó con cada uno" — para no tener que redescubrir en cada fase
si algo quedó pendiente, se recortó a propósito, o directamente no es
construible con el backend actual.

| Elemento del prototipo                              | Destino                                          | Nota                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CTA "Ir a pagar" del carrito                        | Fase 4                                           | Ya estaba en el alcance de Checkout — la Fase 3 lo dejó fuera a propósito, sin destino todavía (ver `docs/phases/phase-3-cart.md`).                                                                                                                                                 |
| Selector de dirección de entrega                    | Fase 4                                           | Ya estaba en el alcance (CRUD de direcciones + selección de dirección guardada).                                                                                                                                                                                                    |
| "Sugerencias del negocio" en el carrito             | Fase 4 (alcance sumado)                          | El prototipo las muestra en la pantalla de carrito (productos del mismo negocio no agregados todavía). Se suman a Checkout porque comparten lógica de "agregar sin pasar por Product Detail" con el punto siguiente.                                                                |
| Quick-add "+" para productos sin variantes          | Fase 4 (alcance sumado)                          | Mismo patrón que las sugerencias (tarjeta chica con "+" directo, sin abrir Product Detail). La Fase 3 solo resolvió el flujo completo vía Product Detail; el atajo se suma a Fase 4 en vez de abrir un checkpoint aparte ahora.                                                     |
| Tab bar (Inicio/Pedidos/Perfil)                     | Fase 6a — construida                             | Fase 2 ya documentó que un shell de tabs con destinos vacíos no se justifica (`docs/phases/phase-2-marketplace.md`). Pedidos fue el primer segundo-destino real de primer nivel de la app — ahí se decidió y se construyó. Perfil queda como stub hasta la Fase 7.                  |
| Nombre/logo del negocio en la fila de "Mis pedidos" | **Parcial**                                      | `businessName` resuelto (Fase 6b, consumido en `OrderRow`); `logoUrl` del negocio pendiente de consumir (el DTO ya lo expone desde Fase 6b, no se agregó a la fila).                                                                                                                |
| Chips de categoría de catálogo (detalle de negocio) | **Resuelto** (Fase 6b)                           | Pill por producto en `ProductCard`, no fila de chips filtrable. Decisión de diseño: un filtro real requiere soporte de backend — ver Backlog post-MVP, "Filtro real por categoría en detalle de negocio".                                                                           |
| Búsqueda de productos                               | Bloqueado — gap de contrato                      | Ya anotado en Fase 2: `GET /marketplace/businesses` solo expone `search` sobre el nombre del negocio; no existe búsqueda de productos en el contrato.                                                                                                                               |
| Orden por cercanía                                  | Bloqueado — gap de contrato (nuevo, anotado acá) | `Business` tiene `lat`/`lng` (nullable), pero `GET /marketplace/businesses` no expone ningún parámetro de orden/distancia — solo paginación por cursor. Sin ese parámetro en el backend no hay forma de pedir "más cercanos primero".                                               |
| Banner promocional (Home)                           | Backlog post-MVP                                 | Requiere un modelo de promociones (tabla + endpoint) que hoy no existe en el contrato — ver ítem agregado en Backlog post-MVP, abajo.                                                                                                                                               |
| Campana de notificaciones (Home)                    | Recorte permanente                               | El push de Fase 5 deep-linkea directo al pedido correspondiente (`docs/API_CONTRACT.md`, sección Devices). Un centro de notificaciones aparte sería UI sin función real, no una fase pendiente.                                                                                     |
| Fotos de producto reales                            | Dato pendiente (Cloudinary + fases owner)        | El campo `photoUrl` ya se consume donde existe, con fallback diseñado cuando es `null` (Fase 2/3). Las fotos reales dependen de que el flujo de upload a Cloudinary y el catálogo de modo owner (ver "Modo owner: Fases 10-14" arriba) estén construidos y en uso por los negocios. |
| Pill "Próximamente" (negocio/producto no activo)    | Recorte permanente                               | El contrato solo expone `status: ACTIVE`/`isActive: true` al customer (`docs/API_CONTRACT.md`, sección Marketplace) — un negocio o producto `PENDING`/inactivo nunca llega al cliente, así que no hay estado que mostrar.                                                           |
| Cuarta tab "Buscar" (tab bar del prototipo, 4 tabs) | Recorte deliberado                               | `[DECISIÓN: desviación deliberada]` — la app usa 3 tabs (Inicio/Pedidos/Perfil) + búsqueda pusheada desde Home (Fase 6a, verificada en uso). Ver Backlog post-MVP para el detalle; revisable si el uso real lo pide.                                                                |

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
- **MFA (segundo factor)**: soporte parcial — `email_code` implementado en
  Fase 5 (`SecondFactorScreen`, ver `docs/phases/phase-1-auth.md` y
  `docs/phases/phase-5-tracking.md`); TOTP y otras estrategias sin
  soportar. Nota: la verificación de dispositivo nuevo de Clerk (código en
  el primer sign-in por dispositivo) usa esta misma pantalla y es
  comportamiento deseado, no un caso pendiente.
- Lo que quede fuera de alcance de las fases 0-9 según se vaya
  descubriendo durante el desarrollo.

### Backlog — paridad del prototipo (análisis v2)

| Ítem                                                   | Origen (prototipo)             | Nota                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header de Home "Entregar en [dirección]"               | CLIENT: HOME                   | Contexto de dirección activa en el marketplace. Requiere noción de "dirección seleccionada" fuera del checkout.                                                                                                                                                                            |
| Reorder ("Volvé a pedir") en carrito vacío             | CLIENT: CART                   | Re-crear carrito desde un pedido pasado. Sin backend nuevo (usa historial).                                                                                                                                                                                                                |
| Sugerencias en carrito ("para vos" / "del negocio")    | CLIENT: CART                   | Requiere lógica de recomendación — sin señal real todavía (mismo criterio YAGNI que ranking).                                                                                                                                                                                              |
| Filtro real por categoría en detalle de negocio        | Decisión Fase 6b               | Requiere query param de categoría en backend (+ opcional endpoint de categorías del negocio).                                                                                                                                                                                              |
| Cuarta tab "Buscar"                                    | Tab bar del prototipo (4 tabs) | `[DECISIÓN: desviación deliberada]` — la app usa 3 tabs + búsqueda pusheada desde Home (Fase 6a, verificada en uso). Documentado en la tabla de paridad como recorte consciente, revisable si el uso real lo pide.                                                                         |
| Info de repartidor en tracking ("Repartidor asignado") | CLIENT: TRACKING               | `[PENDIENTE-BYRON]` — no existe modelo de courier en el backend. Decisión de producto entera: ¿los negocios entregan con su propia gente (recorte permanente) o habrá repartidores como entidad (fase mayor futura)? Hasta decidirse: fila de paridad "Pendiente de decisión de producto". |

## Decisiones de producto pendientes

Registro centralizado de decisiones abiertas — ninguna fase las resuelve
por su cuenta; se marcan `[PENDIENTE-BYRON]` en el lugar donde aparecen y
se listan acá para no perderlas de vista:

1. **Repartidor/courier**: ¿recorte permanente (los negocios entregan con
   su propia gente) o entidad futura del modelo? Ver Backlog post-MVP,
   "Info de repartidor en tracking".
2. **Mecánica de alta de negocio**: auto-servicio con aprobación del
   super-admin vs. solo por invitación. Ver Fase 10.
3. **Métrica "Ganancia"** del resumen del owner: recortarla (solo ventas)
   vs. agregar costo por producto al modelo. Ver Fase 13.
4. **Notificaciones promocionales in-app**: alcance del opt-out en la fila
   "Notificaciones" de Perfil (hoy no hay push promocional). Ver Fase 7.

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
9. **Publicar la privacy policy en una URL pública**, con el mismo texto de
   `src/features/profile/data/privacyPolicy.ts` (Fase 7a) — requisito de App
   Store Connect y Google Play Console. **Tuyo** (hosting/dominio); Claude
   Code puede preparar el HTML/markdown a partir del mismo texto si hace
   falta.
10. **Migrar "Sign in with Apple" a flujo nativo** (`useSignInWithApple`) —
    reemplaza el flujo OAuth web actual (`useSSO`, ver
    `docs/phases/phase-1.5-social-login.md`); requiere el Team ID real de
    Apple Developer en Clerk, disponible recién con la cuenta paga.
11. **Cargar credenciales de producción de Apple y Google en Clerk** —
    Google: config en Google Cloud Console (ver
    `docs/phases/phase-1.5-social-login.md`); Apple: bloqueado hasta la
    cuenta de Apple Developer (mismo paso 1 de este checklist).

Nota: el splash de marca v2 (dirección 8b) ya está en `main` esperando el
próximo rebuild nativo — los builds de producción de esta fase lo estrenan
sin trabajo extra.
