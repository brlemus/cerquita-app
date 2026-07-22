# API Contract — Cerquita (customer app)

Destilado de `../cerquita-api` (NestJS, en producción) el 2026-07-21,
limitado a lo que consume la **app customer**. El backend ya está fijado:
esta app se adapta a él, nunca al revés. Owner/admin queda fuera —
ver `CLAUDE.md`.

Fuente: código de `cerquita-api/src/**`, `schema-cerquita.dbml`,
`PLAN_BACKEND_CERQUITA.md`. Los tipos de este documento deben espejarse
1:1 en `src/shared/api/types.ts` de la app mobile.

## Convenciones globales

- **Base URL**: `<host>/api/v1` (`main.ts` — `setGlobalPrefix('api/v1')`).
  Todas las rutas de abajo se listan sin ese prefijo por brevedad; agregarlo
  siempre.
- **Auth**: header `Authorization: Bearer <clerk-jwt>` en toda request
  (no hay endpoints públicos para el customer — ni el marketplace es
  anónimo).
- **Validación**: `ValidationPipe({ whitelist: true, forbidNonWhitelisted:
true, transform: true })` global. Cualquier campo desconocido en
  body/query → `400`. No enviar campos extra "por si acaso".
- **Dinero**: SIEMPRE centavos, entero (`*Cents: number`). El formateo a
  `$X.XX` es solo de presentación en el cliente.
- **Paginación**: cursor (keyset), NUNCA page/limit, en toda lista:
  ```ts
  // Query
  { cursor?: string; limit?: number } // limit: 1-100, default 20
  // Response
  { data: T[]; nextCursor: string | null; hasNextPage: boolean }
  ```
  `cursor` es opaco (base64url de `{createdAt, id}`) — nunca construirlo ni
  parsearlo en el cliente, solo reenviar el que llega en `nextCursor`. Un
  cursor malformado → `400`.
- **Rate limit**: global 100 req/min por defecto. Override propio en
  polling de pedidos: **30/min** (ver Orders). Exceder cualquiera → `429`.

## Contrato de errores

Dos formas de error, ambas con status HTTP real y correcto (verificado en
`src/main.ts`, `all-exceptions.filter.ts`, `domain-error.filter.ts` —
el filtro catch-all reenvía el status/body real de toda `HttpException`,
solo colapsa a 500 lo verdaderamente no manejado):

**A) Errores de dominio** (`code`, sin `statusCode` en el body):

```ts
{ code: "NOT_FOUND" | "CONFLICT" | "VALIDATION" | "FORBIDDEN";
  message: string;
  details?: Record<string, unknown>; }
```

**B) Excepciones HTTP de Nest** (guards, ValidationPipe, throttler):

```ts
{ statusCode: number; message: string | string[]; error?: string }
```

| Status | Origen                                      | Cuándo                                                                                                                              |
| ------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 400    | B (pipe) o A (`VALIDATION`)                 | body/query inválido, campo desconocido, cursor malformado                                                                           |
| 401    | B                                           | falta el bearer token o es inválido                                                                                                 |
| 403    | B (`"User is suspended"`) o A (`FORBIDDEN`) | cuenta `SUSPENDED` (bloquea TODO endpoint, incluso `/auth/me`) o regla de negocio (ej. actor no autorizado en transición de pedido) |
| 404    | A (`NOT_FOUND`)                             | recurso inexistente **o ajeno** — mismo trato, nunca se filtra "es de otro usuario"                                                 |
| 409    | A (`CONFLICT`)                              | re-registro rechazado, transición de pedido inválida/concurrente, review duplicada, `minOrder` no alcanzado                         |
| 429    | B                                           | rate limit excedido                                                                                                                 |
| 500    | genérico                                    | bug no manejado                                                                                                                     |

Reglas de UI obligatorias (`CLAUDE.md`):

- `401` → refrescar sesión de Clerk o redirigir a login.
- `403` con `"User is suspended"` → pantalla "cuenta suspendida, contactá soporte".
- `409` en el handshake de auth (re-registro rechazado) → mismo tratamiento que suspendida.
- `409` en transición de pedido → recargar el pedido, mostrar el estado real.
- `404` en recurso ajeno → tratar como "no existe", nunca asumir bug.

---

## 1. Auth

No hay endpoint de registro explícito. El usuario se provisiona **just-in-time**
en el primer request autenticado (`GetOrCreateUserByClerkIdCommand`, corre
dentro del guard antes de resolver cualquier ruta).

### `GET /auth/me`

Cualquier usuario autenticado (no suspendido).

**Response 200**

```ts
{
  id: string; // UUID interno
  clerkId: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'EMPLOYEE' | 'CUSTOMER';
  status: 'ACTIVE' | 'SUSPENDED'; // solo dos estados, no hay "blocked" separado
  businessId: string | null; // siempre null para un customer puro
}
```

**Errores**: `401`, `403` (suspendida), `409` (re-registro rechazado —
ver abajo), `400` (JWT de Clerk sin `email`/`name` en los claims — el
template de Clerk debe incluirlos).

### Flujo de alta / re-registro (aplica a CUALQUIER request autenticado, no solo `/auth/me`)

1. `clerkId` nuevo, `email` nuevo → se crea `User` con `role=CUSTOMER`,
   `status=ACTIVE`.
2. `clerkId` ya conocido → se retorna el usuario existente.
3. `email` ya existe bajo OTRO `clerkId` (colisión):
   - Si el usuario existente está `SUSPENDED` con `suspensionReason ===
CLERK_DELETION` (auto-borrado previo vía Clerk) → **se relinkea y
     reactiva** a `ACTIVE`, sin error. Este es el mecanismo que soporta el
     borrado de cuenta de la Fase 7 (ver plan mobile).
   - Si está `SUSPENDED` por otra razón (admin) → **`409`** `{code:
"CONFLICT", message: "Cannot re-register: the existing account for
this email was suspended by an administrator", details: {email}}`.
   - Si está `ACTIVE` (email ya en uso por una cuenta viva) → **`409`**
     `{code: "CONFLICT", message: "A user with email <email> already
exists", details: {email}}`.

**No existe endpoint de borrado de cuenta en este backend.** El borrado se
resuelve enteramente vía Clerk (`user.delete()` del SDK) → webhook
`user.deleted` → el backend ya maneja esto (marca `SUSPENDED` con
`suspensionReason=CLERK_DELETION`, audita). Ver Fase 7 del plan mobile.

---

## 2. Addresses

Base: `/addresses`. Scope por `userId` del token — no requiere rol
específico. Direcciones ajenas o inexistentes → siempre `404` (no `403`,
para no filtrar existencia).

| Método + ruta                      | Body                                         | Response                                     | Notas                                |
| ---------------------------------- | -------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| `GET /addresses`                   | query `{cursor?, limit?}`                    | lista paginada de `AddressResponseDto`       |                                      |
| `POST /addresses`                  | `CreateAddressRequestDto`                    | `AddressResponseDto` (201)                   | `isDefault` siempre `false` al crear |
| `PATCH /addresses/:id`             | `UpdateAddressRequestDto` (todos opcionales) | `AddressResponseDto` (200)                   | solo pisa los campos enviados        |
| `PATCH /addresses/:id/set-default` | —                                            | `AddressResponseDto` (200, `isDefault:true`) | desmarca atómicamente las demás      |
| `DELETE /addresses/:id`            | —                                            | vacío (200)                                  |                                      |

```ts
// CreateAddressRequestDto
{
  label?: string;        // maxLength 50 (ej. "Casa", "Trabajo")
  line: string;          // required, 1-300 — referencia/dirección en texto
  instructions?: string; // maxLength 300
  lat: number;            // required, IsLatitude
  lng: number;            // required, IsLongitude
}
// UpdateAddressRequestDto — igual pero todos opcionales

// AddressResponseDto
{
  id: string;
  label?: string;
  line: string;
  instructions?: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;   // ISO
}
```

**Errores**: `400` (validación: `line` vacío, lat/lng fuera de rango,
campos extra), `401`, `403`, `404` (`PATCH`/`set-default`/`DELETE` sobre
id inexistente o ajeno).

---

## 3. Marketplace (solo lectura)

Base: `/marketplace`. Cualquier usuario autenticado. Sin excepción:
**solo se ve lo que el backend ya filtra como `ACTIVE`** — no filtrar ni
inferir nada extra en el cliente.

### `GET /marketplace/businesses`

**Query**: `{cursor?, limit?, platformCategoryId?: string /*UUID*/,
search?: string /*contains, case-insensitive sobre el nombre*/}`

**Response**: lista paginada de:

```ts
{
  id: string;
  ownerId: string;
  platformCategoryId: string;
  name: string;
  logoUrl: string | null;
  status: 'PENDING' | 'ACTIVE' | 'HIDDEN'; // siempre ACTIVE en este endpoint
  isOpen: boolean;
  deliveryFeeCents: number;
  minOrderCents: number;
  prepTimeMinutes: number;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  updatedAt: string;
  avgRating: number | null; // redondeado a 1 decimal, null si no hay reviews
  reviewCount: number;
}
```

### `GET /marketplace/businesses/:id`

Mismo shape que arriba. **`404`** si no existe **o** su `status !== ACTIVE`
(PENDING/HIDDEN son indistinguibles de "no existe" — así debe tratarlo
el cliente).

### `GET /marketplace/businesses/:id/products`

**Query**: `{cursor?, limit?}`. Solo productos `isActive:true`.

**Response**: lista paginada de:

```ts
{
  id: string;
  businessId: string;
  catalogCategoryId: string | null;
  name: string;
  description: string | null;
  photoUrl: string | null;
  priceCents: number;
  stock: number | null; // null cuando el stock vive en las variantes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variantGroups: {
    id: string;
    name: string;
    sortOrder: number;
    options: {
      id: string;
      name: string;
      priceDeltaCents: number;
      stock: number;
      isActive: boolean;
    }
    [];
  }
  [];
}
```

**Errores**: `404` si el negocio no existe o no está `ACTIVE`.

### `GET /platform/categories`

No paginado. Response: `{id, name, icon: string|null, sortOrder, createdAt}[]`.
Usar `id` como `platformCategoryId` en el filtro de arriba. No hay
endpoint de búsqueda separado — la búsqueda es el query `search` de
`GET /marketplace/businesses`.

---

## 4. Orders

Base: `/orders`. Scope por `customerId` del token.

### Estados y transiciones

```ts
enum OrderStatus {
  PENDIENTE,
  PREPARANDO,
  EN_CAMINO,
  ENTREGADO,
  CANCELADO,
}
```

| De → A                   | Actor permitido             |
| ------------------------ | --------------------------- |
| `PENDIENTE → PREPARANDO` | BUSINESS                    |
| `PENDIENTE → CANCELADO`  | CUSTOMER, BUSINESS, SUPPORT |
| `PREPARANDO → EN_CAMINO` | BUSINESS                    |
| `PREPARANDO → CANCELADO` | BUSINESS, SUPPORT           |
| `EN_CAMINO → ENTREGADO`  | BUSINESS                    |
| `EN_CAMINO → CANCELADO`  | SUPPORT                     |

`ENTREGADO` y `CANCELADO` son terminales. **El customer solo puede
cancelar en `PENDIENTE`** — cualquier otro intento de cancelar da `409`
(transición inexistente) o `403` (actor no autorizado en una transición
que sí existe, no aplica al customer en la práctica salvo el caso arriba).

### `POST /orders` — crear pedido

**Header requerido**: `Idempotency-Key` (UUID generado por intento de
compra, reusado en reintentos del mismo intento). Sin este header →
`400`. Reintentar con la misma key devuelve el mismo pedido ya creado, sin
tocar stock de nuevo.

```ts
// Body
{
  businessId: string;   // UUID
  addressId: string;    // UUID, debe ser del customer
  items: {
    productId: string;
    variantOptionId?: string;  // requerido si el producto tiene variantes
    quantity: number;          // entero positivo, max 999
  }[];                          // 1 a 50 items
  paymentMethod: 'CASH';        // único valor soportado hoy
}
// totales, snapshot de dirección, ETA y comisión los calcula el backend — no se envían
```

**Response 201**:

```ts
{
  id: string; businessId: string; customerId: string;
  status: OrderStatus;           // siempre PENDIENTE al crear
  items: { productId: string; variantOptionId?: string; quantity: number;
            unitPriceCents: number; productName: string; variantOptionName?: string }[];
  addressLine: string; addressLat: number; addressLng: number; instructions?: string;
  subtotalCents: number; deliveryFeeCents: number; commissionCents: number; totalCents: number;
  etaMinutes?: number;
  paymentMethod: 'CASH';
  createdAt: string;
}
```

**Errores**:

- `400` — falta `Idempotency-Key`; body inválido; producto no activo.
- `404` — negocio, dirección, producto o variante no encontrados (o no
  pertenecen a ese negocio/customer).
- `409` — las tres causas comparten `code: "CONFLICT"` (no hay un código
  propio por causa) y se distinguen por `message`/`details` — confirmado
  leyendo `create-order.handler.ts` y `stock-adjuster.ts` en
  `cerquita-api` (2026-07-22):
  - Negocio no `ACTIVE` o `isOpen:false`: `message: "Business is not
accepting orders right now"`, `details: {businessId, status, isOpen}`.
  - Subtotal por debajo de `minOrderCents`: `message: "Order subtotal (X)
is below the business minimum (Y)"` (X/Y en centavos), **sin**
    `details`.
  - Stock insuficiente en una línea — verificado con un `UPDATE`
    atómico condicional (`WHERE stock >= quantity`) dentro de la misma
    transacción, no un read-then-write: `message: "Insufficient stock"`,
    `details: {variantOptionId, quantity}` si la línea tiene variante, o
    `{productId, quantity}` si no la tiene. `quantity` es la cantidad
    **solicitada** en esa línea, no el stock disponible real (el error no
    lo informa) — el cliente puede identificar la línea exacta por
    `variantOptionId`/`productId`, pero no puede mostrar "quedan N" sin un
    fetch aparte.

### `POST /orders/:id/cancel`

Sin body. Solo `PENDIENTE → CANCELADO`, actor `CUSTOMER`. Repone stock.
**Response**: `OrderResponseDto` actualizado.
**Errores**: `404` (no existe o ajeno), `409` (ya no está `PENDIENTE` —
incluye el caso de conflicto por concurrencia: alguien más ya lo cambió).

### `GET /orders` — historial

Query `{cursor?, limit?}`. Response paginada de `OrderResponseDto`.

### `GET /orders/:id` — detalle

Response: `OrderResponseDto` (sin `statusHistory` — ese campo es exclusivo
del endpoint de negocio/owner). `404` si no existe o es ajeno.

### `GET /orders/:id/status` — polling

**Rate limit propio: 30/min** (más estricto que el global 100/min —
respetarlo desde el cliente, no solo confiar en el 429).

- Header saliente del cliente: `If-None-Match: <etag previo>`.
- Header entrante siempre presente: `ETag: W/"<status>-<updatedAt_ms>"`.
- Si coincide → **`304`, sin body**. Si no → **`200`** con:
  ```ts
  { status: OrderStatus; updatedAt: string; etaMinutes?: number }
  ```

`updatedAt` cambia en cada transición, así que el ETag cambia exactamente
cuando cambia el estado — un 304 es garantía real de "nada cambió".

**Errores**: `404` (ajeno/inexistente), `429`.

---

## 5. Devices (push FCM)

Base: `/devices`. Cualquier usuario autenticado.

### `POST /devices` — registrar (login, y en cada cold start)

```ts
{ fcmToken: string; platform?: 'ios' | 'android' }  // fcmToken: 1-512 chars
```

Upsert por token — `fcmToken` es único globalmente; re-registrar un token
ya existente lo reasigna al usuario actual ("último login gana").
Idempotente. **Response 201, vacío.**

Importante: el backend espera un **FCM registration token real** (lo
manda directo a Firebase Admin SDK), no el "Expo push token"
(`ExponentPushToken[...]`) que da el servicio de push de Expo por
default. Ver detalle de implementación (Android vs iOS) en
`PLAN_MOBILE_CERQUITA.md`, Fase 5.

### `DELETE /devices` — desregistrar (logout)

```ts
{
  fcmToken: string;
} // va en el body, no en la URL (no queda en logs de acceso)
```

**Response 204.** `404` si ese token no existe para el usuario actual.

---

## 6. Reviews

El customer reseña un **pedido**, no un negocio directamente. No hay
endpoint de listado para el customer — el rating agregado del negocio ya
viene en `avgRating`/`reviewCount` del marketplace (sección 3).

### `POST /orders/:orderId/reviews`

```ts
{ rating: number;    // entero 1-5, required
  comment?: string;  // maxLength 1000 }
```

**Response 201**:

```ts
{ id: string; orderId: string; businessId: string; customerId: string;
  rating: number; comment?: string; createdAt: string }
```

**Reglas**: el pedido debe estar en `ENTREGADO` y pertenecer al customer;
una review por pedido (constraint de unicidad).

**Errores**: `404` (pedido inexistente/ajeno), `409` (pedido no
`ENTREGADO`, o ya tiene review), `400` (rating fuera de 1-5).

---

## 7. Feedback

### `POST /feedback`

```ts
{ text: string;   // required, 1-2000
  category?: 'BUG' | 'SUGERENCIA' | 'QUEJA' | 'OTRO' }
```

**Response 201**: `{id, userId, category?, text, createdAt}`.
**Errores**: `400` (texto vacío/largo, categoría inválida).

---

## Fuera de alcance (confirmado, no existe para el customer)

- **Uploads de imágenes**: ninguno. El flujo `POST .../uploads` + `PATCH`
  con la URL es exclusivo de `business-owner` (logo/fotos de producto).
  El customer no sube avatar ni fotos en reviews — la identidad viene de
  Clerk.
- **Listado de reviews propias/de un negocio**: no existe para customer,
  solo el agregado en el marketplace.
- **Registro explícito**: no existe, es JIT (ver sección Auth).
- **Borrado de cuenta como endpoint HTTP**: no existe, se resuelve vía
  Clerk (ver sección Auth).
