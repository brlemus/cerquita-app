# Fase 4 — Checkout: direcciones + crear pedido

### Progreso

- Sin empezar. Este archivo es el plan aprobado, punto de partida para
  implementar.
- **Investigación previa ya resuelta** (ver `docs/API_CONTRACT.md`,
  commit `a3777c1`): el 409 de stock insuficiente en `POST /orders` no
  estaba documentado — confirmado leyendo `create-order.handler.ts` y
  `stock-adjuster.ts` en `cerquita-api`. Las tres causas de 409
  (`isOpen`/no-`ACTIVE`, `minOrder`, stock) comparten `code: "CONFLICT"`
  y se distinguen por la forma de `details` — ver sección "Clasificación
  de errores de `POST /orders`" más abajo.

## Context

El carrito (Fase 3) quedó sin destino a propósito — sin CTA de pagar, sin
checkout. Esta fase le da destino real: direcciones (CRUD completo contra
el contrato), la pantalla de checkout, y `POST /orders` contra
producción. También cierra las dos adiciones de paridad que quedaron
asignadas acá (`PLAN_MOBILE_CERQUITA.md`, sección "Paridad con el
prototipo"): sugerencias del negocio en el carrito y el quick-add "+" del
catálogo para productos sin variantes.

Dos restricciones duras de plataforma, confirmadas durante la
planificación (no estaban en el plan maestro):

1. **Android exige permiso de ubicación para geocoding** — a diferencia
   de iOS, `Location.geocodeAsync`/`reverseGeocodeAsync` no funcionan en
   Android sin permiso foreground otorgado (documentado en los docs de
   Expo). El nivel "municipio" de la escalera de direcciones NO puede
   depender de geocoding online — se resuelve con una tabla estática
   embebida (ver más abajo), que funciona igual en ambas plataformas sin
   permiso ni red.
2. **Nominatim/OSM descartado por privacidad**: mandar direcciones de
   usuarios a un geocoder de terceros viola la política de no compartir
   datos con servicios externos fuera de contrato (`CLAUDE.md`). Toda
   resolución de coordenadas pasa por `expo-location` (GPS/geocoding
   nativo del dispositivo) o por la tabla estática local — nunca por un
   servicio HTTP externo.

## Direcciones — decisiones de diseño

### Shape (mirror 1:1 del contrato)

```ts
// src/features/checkout/api/types.ts
export type Address = {
  id: string;
  label?: string;
  line: string;
  instructions?: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
};
export type CreateAddressRequest = {
  label?: string;
  line: string;
  instructions?: string;
  lat: number;
  lng: number;
};
export type UpdateAddressRequest = Partial<CreateAddressRequest>;
```

`line` (requerido, 1-300) ES el campo protagonista — el contrato ya lo
describe como "referencia/dirección en texto", no una dirección postal
formal. Se le da el tratamiento visual más prominente del formulario
(multilínea, con copy que invita a describir cómo llegar, no una
dirección formal). `instructions` (opcional) es el campo secundario
("toca el timbre", "casa azul"). `label` (opcional, "Casa"/"Trabajo") es
el menos prominente.

### Escalera de resolución de lat/lng (nunca bloquea por permiso negado)

1. **GPS con permiso otorgado**: `getCurrentPositionAsync` →
   `reverseGeocodeAsync` → prellena `line` con el resultado (editable) +
   confirma con un ícono de pin + texto corto (SIN mapa — ni interactivo
   ni estático; ya es una decisión cerrada del plan maestro que no se
   toca acá). Fuente de lat/lng: GPS real, precisa.
2. **Permiso negado (o `line` no geocodificable)**: se revela el nivel
   manual. Si la plataforma lo permite (solo iOS sin permiso; en Android
   con permiso negado este paso simplemente no está disponible y se
   salta), se intenta un único `geocodeAsync(line)` sobre el texto tal
   cual lo escribió el usuario, como mejora oportunista — si resuelve, se
   usa esa coordenada. Si no hay resultado (o la plataforma no lo
   permite), se revela el picker de municipio.
3. **Piso garantizado — picker de municipio**: un `Picker`/selector
   (nunca texto libre) sobre una tabla estática embebida de los
   municipios de El Salvador. Elegir un municipio resuelve lat/lng al
   instante — sin red, sin permiso, igual en ambas plataformas. Copy
   siempre visible cuando se usa este nivel: "Ubicación aproximada — tu
   referencia guía la entrega al repartidor".
4. **No hay nivel 4.** Con la tabla estática, elegir un municipio SIEMPRE
   resuelve una coordenada — no hay escenario de "ni el nivel grueso
   funciona" (eso solo aplicaría a un geocoder de red, que descartamos).
   El botón de guardar queda deshabilitado solo hasta que `line` tenga
   contenido Y algún lat/lng esté resuelto por cualquiera de los 3
   niveles.

**Pantalla de permiso en contexto** (requisito del plan maestro, sección
Store readiness): antes de pedir el permiso nativo, una tarjeta propia
("Para ubicarte en el mapa y calcular tu envío") con botón "Usar mi
ubicación" y link "Ingresar manualmente". Si el permiso quedó denegado
permanentemente (`canAskAgain:false`), el link de reintentar abre
`Linking.openSettings()` en vez de re-preguntar (la OS no vuelve a
mostrar el diálogo).

**Edición**: no se re-dispara la escalera automáticamente. Se muestra un
resumen compacto ("Ubicación guardada") + link "Actualizar con GPS" que,
si se toca, corre la misma escalera para sobrescribir lat/lng. Editar
`line`/`instructions`/`label` no requiere tocar la ubicación.

### Tabla estática de municipios

`src/features/checkout/data/elSalvadorMunicipios.ts` — módulo TS con
`{ departamento, municipio, lat, lng }[]` para los municipios de El
Salvador. **La coordenada de cada municipio se obtiene de una fuente
pública verificable durante la implementación (no de memoria)** — cito
la fuente exacta en un comentario del archivo, tal como pediste. Test
trivial de integridad: sin duplicados (`departamento`+`municipio`),
todas las coordenadas dentro del bounding box de El Salvador
(aprox. lat 13.15–14.45, lng -90.15– -87.65).

### CRUD y pantallas

- `useAddresses()` — `useQuery` simple (NO infinite/paginado): un
  customer tiene realistically pocas direcciones; pedir `{limit: 50}` de
  una vez es proporcional — usar `useInfiniteQuery` acá sería construir
  para un volumen que no va a existir. Keyed `['checkout','addresses','list']`.
- `useCreateAddress`/`useUpdateAddress`/`useDeleteAddress`/
  `useSetDefaultAddress` — `useMutation`, cada uno invalida la key de
  arriba en `onSuccess`. **Primer uso de `useMutation` en el proyecto.**
- `AddressFormScreen` (create y edit, mismo componente): campos
  `label`/`line`/`instructions` (RHF + zod, mismo patrón que
  `SignUpScreen`) + el componente de captura de ubicación (estados:
  pedir permiso → capturado/confirmado → resumen compacto en edición).
  Rutas: `app/(app)/addresses/new.tsx`,
  `app/(app)/addresses/[addressId]/edit.tsx`.
- `AddressListScreen` (`app/(app)/addresses/index.tsx`): lista simple
  (`.map`, no FlashList — mismo criterio que `CartScreen`: lista chica y
  acotada) con label/line/instructions/badge de default. Acepta
  `?returnTo=<path>` opcional en la query:
  - **Sin `returnTo`** (llegada desde Home o desde "Cambiar dirección" de
    otro lado): tocar una fila abre su editor.
  - **Con `returnTo`** (llegada desde Checkout): tocar una fila navega a
    `router.replace(`${returnTo}?addressId=${id}`)` en vez de editar.
  - Acciones de "marcar predeterminada" y "eliminar" (con confirmación
    vía `Alert.alert`, 2 botones) viven DENTRO del editor de cada
    dirección, no como botones sueltos en la fila de la lista — evita un
    action-sheet nuevo con más de 2 botones (Android/iOS no lo renderizan
    bien mostrando >3 opciones).
- **Home**: selector "Entregar en" en el header (ícono de pin + label +
  chevron, en el lugar que el prototipo ya le da). Muestra la dirección
  `isDefault`, o la primera de la lista si ninguna es default, o
  "Agregar dirección" si la lista está vacía. Tocarlo navega a
  `/addresses` (sin `returnTo` — es gestión, no selección para un
  pedido). **No filtra ni ordena el marketplace** — el contrato no
  soporta orden por cercanía (gap ya anotado en "Paridad con el
  prototipo"), así que esta selección es solo conveniencia/preview, no
  tiene efecto sobre lo que se lista en Home.

## Checkout — decisiones de diseño

### Filas del prototipo, resueltas contra el contrato real

- **Dirección de entrega**: una sola fila muestra `line` + `instructions`
  juntos (subtítulo). Tocarla abre el editor de ESA dirección (prefilled)
  — cambiar instrucciones es un tap, pero como edición explícita de la
  dirección guardada (`PATCH /addresses/:id`), nunca como campo suelto
  del pedido (el contrato no lo soporta; `instructions` viaja con la
  Dirección, no con la Order). Si hay 2+ direcciones guardadas, un link
  secundario "Cambiar dirección" navega a `/addresses?returnTo=/checkout`
  para elegir otra sin editar la actual. Sin dirección seleccionada
  todavía → la fila muestra "Agregar dirección de entrega" →
  `/addresses/new?returnTo=/checkout`.
- **Forma de pago**: fila estática, no interactiva, sin chevron — "Pago
  en efectivo contra entrega" (único valor del MVP, nunca un selector de
  una sola opción).
- **Resumen**: items (`qty× nombre` + `lineStr`), subtotal, envío
  (`business.deliveryFeeCents`), total — estos son el PREVIEW del
  cliente. Si el pedido se crea, los totales que manda el backend en la
  respuesta son la verdad y son los que se muestran en la confirmación
  (no se reconcilian ni comparan en checkout, solo se reemplazan).
- **Gap anotado (backlog)**: "instrucciones per-pedido
  (`orderInstructions` en `POST /orders`)" — si en el futuro el negocio
  quiere una nota que no viva en la dirección reusable, requeriría un
  campo nuevo en el contrato. No se resuelve acá.

### Idempotency-Key — ciclo de vida exacto

- **Nace**: `useState(() => Crypto.randomUUID())` al montar
  `CheckoutScreen` — un mount = un intento de compra.
- **Se reusa**: en cada retry dentro del MISMO mount (falla de red,
  tocar "Reintentar" tras un error) — mismo estado de React, mismo UUID.
- **Se descarta**: al desmontar la pantalla (éxito → navega a
  confirmación; o el usuario vuelve atrás al carrito sin confirmar). Un
  regreso posterior a Checkout remonta la pantalla = nuevo intento = key
  nueva.
- **Límite aceptado, no resuelto acá**: si la OS mata la app mid-request
  (tras tapear "Confirmar" pero antes de la respuesta) y el usuario
  reabre, la key se pierde con el mount viejo — un reintento con una key
  nueva podría, en un caso extremo, crear un pedido duplicado si el
  primer request sí llegó a procesarse server-side. No se agrega
  persistencia de la key en curso para este edge case (added complejidad
  para un escenario raro); se documenta como límite conocido.
- **Doble defensa**: el botón "Confirmar pedido" se deshabilita vía
  `loading={mutation.isPending}` (Button ya soporta esto) MIENTRAS
  reutilizar la misma key cubre el caso de que igual se dispare dos
  veces (doble-tap, timeout+retry) — las dos defensas conviven, ninguna
  reemplaza a la otra.

### Clasificación de errores de `POST /orders` (contra el shape real, ya confirmado)

Función pura testeada `classifyOrderConflict(details)` en
`src/features/checkout/utils/classifyOrderConflict.ts`:

```ts
type OrderConflictKind = 'stockInsufficient' | 'businessClosed' | 'minOrderNotMet' | 'unknown';

function classifyOrderConflict(details: Record<string, unknown> | undefined): OrderConflictKind {
  if (!details) return 'minOrderNotMet'; // sin details, documentado así
  if ('variantOptionId' in details || 'productId' in details) return 'stockInsufficient';
  if ('businessId' in details && 'isOpen' in details) return 'businessClosed';
  return 'unknown';
}
```

Discriminador **estructural** (forma de `details`), no un match de texto
frágil sobre `message` — las tres causas comparten `code: "CONFLICT"`.
**Gap de backend anotado** (no se resuelve acá, verificado que el `!details
→ minOrderNotMet` de arriba es correcto contra el backend actual): el
`ConflictError` de `POST /orders` debería llevar un `reason` estable en
`details` — clasificar por ausencia/forma de metadata es frágil ante
conflictos nuevos que el backend agregue a futuro sin ese campo.

UI por caso (bloque inline sobre el botón de confirmar, no pantalla
completa — el usuario debe poder reintentar sin perder su lugar):

| Clasificación                                                        | Copy                                                                                                                                                                                                                                                                                                                                                         | Acción                                                                                                                                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stockInsufficient`                                                  | Si `productId`/`variantOptionId` de `details` matchea una línea del carrito actual: "No hay stock suficiente de {nombre de esa línea}". Si NO matchea ninguna (línea ya editada/quitada, o desalineación entre lo enviado y lo que el backend reporta): copy genérica "Algunos productos no tienen stock suficiente" — nunca un template con el hueco vacío. | "Ajustar carrito" → `/cart`. Además: `invalidateQueries(['marketplace','businesses','detail',businessId,'products'])` para que el catálogo/Product Detail muestren el stock real al volver. |
| `businessClosed`                                                     | "Este negocio no está aceptando pedidos ahora"                                                                                                                                                                                                                                                                                                               | "Volver al inicio"                                                                                                                                                                          |
| `minOrderNotMet`                                                     | "Tu pedido no alcanza el mínimo de compra de este negocio" (copy propia, NO el `message` crudo en inglés con centavos sin formatear)                                                                                                                                                                                                                         | "Volver al carrito"                                                                                                                                                                         |
| `unknown` (conflict no reconocido)                                   | Copy genérica + el `message` del backend como detalle                                                                                                                                                                                                                                                                                                        | "Reintentar" (misma key)                                                                                                                                                                    |
| `notFound` (404 — negocio/dirección/producto/variante ya no existen) | "Uno de los datos de tu pedido ya no está disponible"                                                                                                                                                                                                                                                                                                        | "Volver al carrito"                                                                                                                                                                         |
| `validation` (400)                                                   | Copy genérica                                                                                                                                                                                                                                                                                                                                                | "Volver al carrito"                                                                                                                                                                         |
| `network`/`server`/`unknown` (fetch falló o 5xx)                     | "No pudimos conectar. Intentá de nuevo."                                                                                                                                                                                                                                                                                                                     | "Reintentar" (misma key — reintento seguro por idempotencia, el backend devuelve el pedido ya creado si el primer intento sí llegó)                                                         |

**`stockInsufficient`/`businessClosed` no deberían ocurrir en el camino
feliz**: `CartScreen`/`CheckoutScreen` ya deshabilitan el CTA cuando
`needsMore` o `!business.isOpen` (chequeo cliente, defensivo, igual que
ya hace `CartScreen` con `needsMore`) — estos casos del backend son la
red de seguridad para una carrera real (el negocio cambió entre que se
armó el carrito y se confirmó), no el camino principal.

### Éxito → confirmación

- `onSuccess`: `clearCart()` + `invalidateQueries([...,'products'])` del
  negocio (el stock real bajó) + `router.replace('/checkout/confirmation?orderId=' + order.id)`.
- `OrderConfirmationScreen` (`app/(app)/checkout/confirmation.tsx`): NO
  reusa los datos de la mutación por param-threading — hace su propio
  `useOrder(orderId)` (`GET /orders/:id`, primer hook de `orders`,
  reusable por Fase 5/6). Fuente única de verdad, sobrevive incluso a un
  cold-start improbable sobre ese deep link.
- Muestra: id (truncado a un formato corto, ej. "Pedido #" + últimos 6
  caracteres — no se inventa un número secuencial que el contrato no
  tiene), `totalCents` (backend, la verdad), `etaMinutes` SI está
  presente ("Llega en aproximadamente X min"), negocio, dirección de
  entrega. **Sin tracking, sin polling** (Fase 5) — si `etaMinutes` es
  `undefined`, no se muestra esa línea, no se inventa un rango. Una sola
  acción: "Volver al inicio".

## Paridad — adiciones de esta fase

- **Sugerencias del negocio en el carrito**: `CartScreen` agrega, debajo
  de las líneas, productos del mismo negocio (vía `useBusinessProducts`,
  ya existente) que NO estén en el carrito, tope 4-6 (mismo criterio que
  el prototipo). Reusa el quick-add compartido (ver abajo).
- **Quick-add "+"**: `useQuickAddToCart(businessId, businessName)`
  (`src/features/marketplace/hooks/`) — hook compartido entre
  `ProductCard` (catálogo de `BusinessDetailScreen`) y la tira de
  sugerencias de `CartScreen`. `quickAddOrOpen(product)`: si
  `variantGroups.length === 0` → construye la línea vía
  `buildCartLineForSimpleProduct` (ya existe de Fase 3), corre el MISMO
  chequeo `wouldReplaceCart` + diálogo de cambio de negocio que
  `ProductDetailScreen` (necesario: el catálogo de un negocio puede
  verse con el carrito lleno de OTRO negocio); si tiene variantes →
  `router.push` a Product Detail (como hasta ahora, no se puede elegir
  opción sin abrir el detalle). Botón "+" nuevo, chico, circular, mismo
  ícono que el signo "+" del `Stepper` — usado en 2 lugares desde el
  arranque, no es una abstracción especulativa.
- **`ProductCard`**: gana el botón "+" condicional (`Pressable` anidado,
  no interfiere con el `onPress` de la fila completa — RN resuelve la
  negociación de responder táctil de forma nativa entre `Pressable`s
  anidados).
- **`CartScreen` gana el CTA "Ir a pagar"**: `Button` debajo del
  subtotal existente, deshabilitado si `needsMore` o `!business.isOpen`
  (defensivo, mismo criterio que arriba). Navega a `/checkout`.

## Dependencias nuevas

- `expo-location` — ya en el stack cerrado del plan maestro.
- `expo-crypto` — `Crypto.randomUUID()` para el Idempotency-Key; oficial
  de Expo, sin polyfills (se prefiere sobre `uuid` +
  `react-native-get-random-values`, cero dependencias extra).
- Ninguna dependencia de mapa (ya descartado por el plan maestro) ni de
  geocoding externo (descartado por privacidad, ver Context).

## Checkpoints

### Checkpoint A — Infra de direcciones

- Instalar `expo-location`, `expo-crypto` (`npx expo install`/`pnpm add`
  según corresponda), `expo-doctor` en verde.
- `src/features/checkout/data/elSalvadorMunicipios.ts` (+ test de
  integridad) — dato verificado contra una fuente pública durante la
  implementación, citada en comentario.
- `src/features/checkout/api/types.ts` (`Address`,
  `CreateAddressRequest`, `UpdateAddressRequest`).
- `src/features/checkout/api/{getAddresses,createAddress,updateAddress,
deleteAddress,setDefaultAddress}.ts` — wrappers finos de `request<T>`,
  mismo patrón que `marketplace/api/`.
- `src/features/checkout/hooks/{useAddresses,useCreateAddress,
useUpdateAddress,useDeleteAddress,useSetDefaultAddress}.ts`.
- Gate: typecheck + tests afectados (tabla de municipios). Sin
  verificación visual.

### Checkpoint B — Formulario y lista de direcciones

- Componente de captura de ubicación (escalera de 3 niveles: GPS →
  geocoding oportunista de `line` donde la plataforma lo permite →
  picker de municipio) con el estado de permiso-en-contexto.
- `src/features/checkout/schemas.ts` (`addressFormSchema`, zod).
- `AddressFormScreen` (create + edit) — RHF, mismo patrón que
  `SignUpScreen`.
- `AddressListScreen` (modo gestión vs. modo selección por `?returnTo=`).
- Rutas: `app/(app)/addresses/index.tsx`, `.../new.tsx`,
  `.../[addressId]/edit.tsx`.
- Gate: typecheck + tests afectados (schema, cualquier lógica pura de la
  escalera que se extraiga). Reporte de qué verificar visualmente antes
  de seguir (permiso otorgado/negado, picker de municipio).

### Checkpoint C — Home + Carrito accionable

- Selector "Entregar en" en el header de `HomeScreen`.
- `useQuickAddToCart` (`marketplace/hooks/`) + botón "+" en `ProductCard`.
- `CartScreen`: CTA "Ir a pagar" (deshabilitado por `needsMore`/`isOpen`)
  - sección "Sugerencias del negocio".
- Gate: typecheck + tests afectados. Reporte de qué verificar
  visualmente (badge/CTA del carrito, quick-add sin abrir detalle,
  diálogo de cambio de negocio desde quick-add).

### Checkpoint D — Checkout y creación de pedido

- `src/features/checkout/api/{createOrder,getOrderById}.ts` + tipos
  `Order`/`OrderItem`/`CreateOrderPayload`.
- `src/features/checkout/utils/classifyOrderConflict.ts` (+ test).
- `src/features/checkout/hooks/{useCreateOrder,useOrder}.ts`.
- `CheckoutScreen` (`app/(app)/checkout.tsx`): fila de dirección, fila de
  pago estática, resumen, botón confirmar con Idempotency-Key +
  clasificación de errores completa.
- `OrderConfirmationScreen` (`app/(app)/checkout/confirmation.tsx`).
- Gate: typecheck + tests afectados + **suite completa** (`pnpm test`) +
  `pnpm lint` + `pnpm exec tsc --noEmit` + `expo-doctor` como cierre de
  fase.

## Archivos clave

- Crear: todo `src/features/checkout/**` (data, api, hooks, schemas,
  screens, components, utils), `src/features/marketplace/hooks/
useQuickAddToCart.ts`, `app/(app)/addresses/**`,
  `app/(app)/checkout.tsx`, `app/(app)/checkout/confirmation.tsx`.
- Modificar: `src/features/marketplace/components/ProductCard.tsx`
  (botón "+"), `src/features/marketplace/screens/HomeScreen.tsx`
  (selector "Entregar en"), `src/features/cart/screens/CartScreen.tsx`
  (CTA + sugerencias), `package.json`.
- Reusar tal cual: `Button`/`TextField`/`KeyboardAwareScreen`/
  `EmptyState`/`ErrorState`/`Stepper` (`shared/ui`), `formatMoneyCents`,
  `useBusiness`/`useBusinessProducts` (`marketplace/hooks`),
  `buildCartLineForSimpleProduct`/`buildCartLinesForVariants`
  (`marketplace/utils`), `useCartStore`/`subtotalCents`/`itemCount`/
  `wouldReplaceCart` (`cart/store`), patrón RHF+zod de
  `src/features/auth/screens/SignUpScreen.tsx`.

## Verificación

- **Automática (Claude)**: tests por path durante desarrollo; suite
  completa + lint + typecheck + `expo-doctor` una sola vez al cierre
  (Checkpoint D).
- **Visual (usuario)** — Paletería Lili real, ambos teléfonos:
  1. Crear dirección CON permiso de GPS: reverse-geocode prellena
     `line`, guardar funciona.
  2. Crear dirección SIN permiso (negarlo): se revela el picker de
     municipio, guardar funciona con esa coordenada aproximada.
  3. Agregar productos al carrito, ver el CTA "Ir a pagar" habilitado
     (o deshabilitado si el subtotal no alcanza el mínimo), ver
     sugerencias del negocio con quick-add funcionando.
  4. Quick-add "+" en el catálogo de un producto sin variantes agrega
     directo; en uno con variantes abre el detalle.
  5. Completar checkout con dirección + confirmar → pantalla de
     confirmación con total/ETA reales del backend, carrito vacío al
     volver.
  6. Provocar cada error en Neon: `isOpen=false` en el negocio (ver
     mensaje de "no acepta pedidos"), bajar `minOrderCents` del carrito
     por debajo del mínimo salteando el chequeo de cliente si es
     necesario, bajar el stock de una opción a 0 entre armar el carrito
     y confirmar (ver mensaje de stock + carrito para ajustar).

## Notas / backlog

- **Gap de backend a reportar**: `orderInstructions` per-pedido en
  `POST /orders` — hoy las instrucciones viven en la Dirección
  reusable; si los usuarios piden notas específicas por pedido, es un
  campo nuevo de contrato, no se resuelve en esta fase.
- **Gap de backend a reportar**: el `ConflictError` de `POST /orders`
  debería llevar un `reason` estable en `details` (ej.
  `"BUSINESS_CLOSED" | "MIN_ORDER" | "INSUFFICIENT_STOCK"`) — hoy la
  clasificación del cliente depende de la forma/ausencia de `details`,
  frágil ante un cuarto motivo de conflicto que el backend agregue sin
  ese campo.
- **Límite aceptado**: Idempotency-Key no persiste si la OS mata la app
  entre tapear "Confirmar" y recibir respuesta — ver sección dedicada
  arriba.
- **Fuera de esta fase**: tracking en vivo/polling de estado (Fase 5),
  historial de pedidos (Fase 6).

## Notas de git / permisos

- Rama `phase-4-checkout`, ya creada por el usuario desde `main`
  actualizado (post-merge de Fase 3) — confirmado en el estado de git al
  iniciar esta sesión.
- No se crean/leen archivos `.env*`. No `eas build`/`submit`. No
  `git push`.
- Commits: conventional, un commit por checkpoint (`feat(checkout): ...`),
  sin trailer de co-autoría ni atribución a Claude. El fix de
  `docs/API_CONTRACT.md` (commit `a3777c1`) y este archivo de plan van
  aparte, ya resueltos antes de este punto.
