# Fase 7a — Perfil real

**Estado**: Planificada, no iniciada.

## Contexto

`ProfileScreen` es hoy el stub de Fase 6a: avatar, nombre, email y dos
`Pressable` sueltos centrados ("Enviar comentarios", "Cerrar sesión"). No hay
filas, no hay borrado de cuenta, no hay privacy policy, y la gestión de
direcciones —construida completa en Fase 4— solo se alcanza desde Home y
Checkout.

Dos de esos huecos son **requisito de App Store**, no mejoras: borrado de
cuenta in-app (Guideline 5.1.1(v)) y acceso a la política de privacidad. El
resto es paridad con la pantalla `CLIENT: PROFILE` del prototipo
(`docs/design/Cerca.dc.html:232`).

Alcance partido en dos por tamaño (decisión del usuario): **7a = Perfil**
(esto), **7b = recuperación de contraseña** (se planifica cuando 7a esté
mergeada).

### Verificaciones hechas antes de planificar — no hay bloqueos

El plan maestro (`PLAN_MOBILE_CERQUITA.md:137-141`) exigía verificar dos
cosas antes de implementar, "sin plan B silencioso". Ambas verificadas:

1. **Backend — sin gap.** `cerquita-api` ya maneja el borrado de punta a
   punta: `ClerkWebhookController` despacha `user.deleted`
   (`src/modules/users/presentation/clerk-webhook.controller.ts:130`) →
   `DeleteUserFromClerkHandler` marca `SUSPENDED` con
   `suspensionReason=CLERK_DELETION` y audita. El re-registro con el mismo
   email relinkea y reactiva automáticamente
   (`get-or-create-user-by-clerk-id.handler.ts`, `handleEmailCollision`).
   El contrato lo declara intencional: _"No existe endpoint de borrado de
   cuenta en este backend"_ (`docs/API_CONTRACT.md:124`). **No se pide nada
   al backend en esta fase.**
2. **SDK — disponible.** Verificado en los tipos instalados de
   `@clerk/clerk-expo` 2.19.31
   (`node_modules/@clerk/shared/dist/types/index.d.ts`, `UserResource`):
   `delete: () => Promise<void>` y —hallazgo útil— `deleteSelfEnabled:
boolean`, que expone en runtime el toggle del dashboard de Clerk. La app
   puede detectar sola si falta habilitarlo, en vez de fallar en un tap.

**Único riesgo residual**: el toggle "self-service deletion" del dashboard de
Clerk. No se puede leer desde acá sin la secret key, pero `deleteSelfEnabled`
lo revela en el primer arranque. El plan lo cubre con un estado de UI
diseñado (no un crash) y queda como punto de gate visual.

---

## Alcance

**Entra**: layout de perfil en filas (paridad con prototipo), fila Mis
direcciones, fila Notificaciones, fila Privacidad + pantalla de política,
borrado de cuenta con pantalla de confirmación.

**No entra** (recortes documentados, no olvidos):

- **"Formas de pago"** — `[DECISIÓN: diferida]` ya tomada en
  `PLAN_MOBILE_CERQUITA.md:228`. El MVP es efectivo contra entrega; la fila
  no se muestra hasta que exista una segunda forma de pago. Recorte
  **temporal**, se re-evalúa cuando haya pagos digitales.
- **"¿Tenés un negocio?"** — es Fase 10 (`PLAN_MOBILE_CERQUITA.md:255`).
- **Opt-out de push promocional in-app** — hoy no existe push promocional
  (`[PENDIENTE-BYRON]` #4 del plan maestro). La fila Notificaciones queda en
  el alcance mínimo pedido: estado del permiso + ajustes del sistema.
- **Edición de perfil** (nombre/email/avatar) — el contrato no expone
  `PATCH /auth/me` y el customer no sube avatar (`API_CONTRACT.md:465`).
  Sería vía SDK de Clerk; nadie lo pidió.
- **Recuperación de contraseña** — es 7b.

---

## Checkpoints

### C1 — Layout de filas + Mis direcciones

Reescribe `src/features/profile/screens/ProfileScreen.tsx` siguiendo el
prototipo (`Cerca.dc.html:232-247`): header "Perfil", bloque de identidad
**alineado a la izquierda** (avatar 60px `colors.brand.tint` + nombre 18/600

- email 13px `text.secondary`, gap 14) — hoy está centrado y no es lo que
  especifica el diseño —, y una card de filas (`border 1px colors.border.default`,
  `radius.xl`, `overflow: hidden`, divisores entre filas, la última sin
  divisor).

* **`src/features/profile/components/SettingsRow.tsx`** (nuevo, local al
  feature — no `shared/ui`: lo usa una sola pantalla, extraerlo más arriba
  sería design system prematuro). Props: `{ icon, label, value?, onPress,
destructive?, accessibilityHint? }`. Fila de 15px/600, icono 20×20,
  chevron a la derecha, `minHeight: 44`.
* **`src/features/profile/components/icons.tsx`** (nuevo): `BellIcon`,
  `ShieldIcon` para las filas nuevas.
* **Promoción de `ChevronRightIcon` y `PinIcon`** de
  `src/features/checkout/components/icons.tsx` a **`src/shared/ui/icons.tsx`**
  - export en `src/shared/ui/index.ts`. Justificación: `HomeScreen`
    (marketplace) ya importa `ChevronRightIcon` desde `features/checkout`
    —acoplamiento cross-feature preexistente— y Perfil sería el tercer
    consumidor. El disparador de extracción ya se cumplió. Se actualizan los
    imports en `CheckoutScreen.tsx`, `AddressListScreen.tsx` y `HomeScreen.tsx`.
    _Sacrificio_: toca 3 archivos fuera de `profile/`; a cambio, ningún feature
    nuevo vuelve a importar chrome genérico desde `checkout`.
* **Filas de la card**: Mis direcciones → `router.push('/addresses')`
  (**una línea, cero código nuevo**: `AddressListScreen` ya tiene modo
  gestión sin `returnTo`, y `HomeScreen:68` ya lo usa así) · Notificaciones
  (C2) · Privacidad (C3) · Enviar comentarios → `/feedback` (se mueve el
  `Pressable` suelto de hoy adentro de la card, es una acción de ajustes).
* **Debajo de la card**: "Cerrar sesión" full-width sin caja en
  `text.secondary` (spec del prototipo, conserva `clearCart()` + `useLogout()`
  tal cual) y, separado, "Eliminar mi cuenta" en `colors.danger.default`
  → `/delete-account` (C4). El destructivo va último y de-enfatizado, pero
  visible sin scroll extra — Apple exige que sea fácil de encontrar.

Actualizar `ProfileScreen.test.tsx` (sus 2 tests actuales siguen valiendo;
el mock de `@clerk/clerk-expo` solo exporta `useUser` y habrá que extenderlo
en C4).

### C2 — Fila Notificaciones

- **`src/features/profile/hooks/useNotificationPermission.ts`** (nuevo):
  lee `Notifications.getPermissionsAsync()` y lo **re-lee con `useFocusEffect`**
  — sin eso, volver de los ajustes del sistema deja el estado viejo en
  pantalla. Devuelve `{ status, canAskAgain, isGranted, refresh }`.
- La fila muestra el estado como `value` ("Activadas" / "Desactivadas") y al
  tocarla: si `shouldRequestPermission(...)` (reusa
  `src/features/push/utils/shouldRequestPermission.ts`, ya testeado) →
  `requestPermissionsAsync()`; si no → `Linking.openSettings()` (mismo patrón
  ya usado en `src/features/checkout/hooks/useAddressLocation.ts:114`).
- **Registro del token al activar** — bug real que este checkpoint debe
  evitar: `PushProvider` corta temprano si el permiso no estaba concedido,
  así que activar notificaciones desde Perfil _no registraría el device_ y
  el usuario creería que quedó activado. Al detectar la transición a
  `granted`, disparar `getFcmToken()` + `useRegisterDevice` (ambos ya
  existen en `src/features/push/`). ~10 líneas, sin tocar `PushProvider`.

Test unitario del hook (lógica no trivial: transiciones de estado).

### C3 — Privacy policy

- **`src/features/profile/data/privacyPolicy.ts`** (nuevo): el texto como
  array de secciones tipadas (`{ heading, body }[]`), no HTML ni markdown —
  se renderiza con los `Text` del theme.
- **`src/features/profile/screens/PrivacyPolicyScreen.tsx`** + ruta
  **`app/(app)/privacy.tsx`** (patrón wrapper del repo). `ScrollView` con el
  header estándar de pantalla apilada (`BackIcon` + título, `insets.top`).
- **Contenido — solo prácticas reales de la app de hoy**, según condición
  (a) del usuario. Secciones: (1) qué datos recolectamos y por qué — cuenta
  gestionada por **Clerk** (nombre, email, contraseña; la app nunca almacena
  la contraseña), **token de push de FCM** para avisos de estado del pedido,
  **ubicación** capturada _solo_ al crear/editar una dirección de entrega
  (nunca en background), y **historial de pedidos**; (2) con quién se
  comparte — el negocio al que le pedís recibe tu dirección y tu pedido;
  Clerk y Firebase como proveedores de infraestructura; no se vende ni se
  usa para publicidad de terceros; (3) **retención tras el borrado de
  cuenta** — cláusula obligatoria del plan maestro
  (`PLAN_MOBILE_CERQUITA.md:142`): el historial de pedidos se retiene
  **desanonimizado** por razones contables/legales del negocio, aunque la
  cuenta de acceso se elimine; (4) tus derechos — borrar la cuenta desde
  Perfil, revocar permisos desde los ajustes del sistema; (5) contacto —
  `soporte.cerquita@outlook.com` (única credencial/dato de contacto que va
  en el texto; ninguna otra credencial se escribe en el repo).
  **Nada de Cloudinary/fotos** (no existe en la app de customer) ni de
  analytics/tracking (no hay — de hecho es la base para declarar que ATT no
  aplica). Borrador de Claude Code; el usuario lo revisa antes del commit.
- **Condición (b)**: agregar al checklist de Fase 9 en
  `PLAN_MOBILE_CERQUITA.md:432` un ítem — _"Publicar la privacy policy en
  una URL pública con el mismo texto de `src/features/profile/data/privacyPolicy.ts`
  (requisito de App Store Connect y Google Play Console) — **tuyo**"_.

### C4 — Borrado de cuenta

- **`app/(app)/delete-account.tsx`** + **`src/features/profile/screens/DeleteAccountScreen.tsx`**
  (nuevos). Pantalla propia, no un `Alert` desde la fila: el plan pide
  "confirmación seria, no un tap único" (`PLAN_MOBILE_CERQUITA.md:129`).
  Explica en texto llano qué pasa: perdés el acceso y tus direcciones
  guardadas; el historial de pedidos se conserva desanonimizado por razones
  contables (link a la política); **podés volver a registrarte con el mismo
  email** (cierto — el backend relinkea y reactiva). CTA destructivo abajo →
  `Alert.alert` nativo de confirmación final (2 botones, `style: 'destructive'`),
  igual que el borrado de dirección de Fase 4.
- **Si `user.deleteSelfEnabled === false`**: en vez del CTA, un estado
  diseñado ("No podemos procesar el borrado en este momento — escribinos a
  soporte") + `console.warn` en `__DEV__` con la causa exacta. La fila en
  Perfil se muestra igual — Apple exige que exista; lo que no puede haber es
  un botón que falle en silencio.
- **`src/features/profile/hooks/useDeleteAccount.ts`** (nuevo), modelado
  sobre `useLogout.ts` (mismo guard `isDeleting` a nivel módulo, mismo
  best-effort con `Promise.race`). Orden, que importa:
  1. `DELETE /devices` con el token de FCM — **antes** del borrado, necesita
     el bearer válido (reusa `getFcmToken` + `useUnregisterDevice`).
  2. `queryClient.cancelQueries()` — **antes** de `user.delete()`: si queda
     una query en vuelo (p. ej. el polling de tracking) va a devolver 401 y
     `AccountGate` dispararía su auto-logout compitiendo con este flujo.
  3. `await user.delete()`.
  4. Limpieza local: `useCartStore.getState().clearCart()`,
     `useReviewedOrdersStore` (**necesita una acción `clearReviewed` nueva**
     — hoy solo tiene `markReviewed`), `queryClient.clear()`, y borrar la
     clave `push_permission_requested` de `AsyncStorage` (hay que exportarla
     desde `PushProvider.tsx`, hoy es un const privado) para que un
     re-registro vuelva a pedir el permiso.
  5. `await signOut()` dentro de try/catch — puede rechazar con "You are
     signed out" si `user.delete()` ya cerró la sesión; es exactamente la
     clase de unhandled rejection que documenta
     `docs/phases/chore-logout-unhandled-rejection.md`.
  6. Errores de Clerk → `getClerkErrorMessage()` (ya centralizado). Agregar
     al mapa de `clerkErrorMessage.ts` cualquier código que aparezca.

Test unitario del hook (orden de operaciones + que un fallo de `DELETE
/devices` no bloquee el borrado).

---

## Archivos

**Nuevos**: `src/features/profile/components/{SettingsRow,icons}.tsx` ·
`src/features/profile/hooks/{useNotificationPermission,useDeleteAccount}.ts`
(+ tests) · `src/features/profile/screens/{PrivacyPolicyScreen,DeleteAccountScreen}.tsx`
· `src/features/profile/data/privacyPolicy.ts` · `src/shared/ui/icons.tsx` ·
`app/(app)/{privacy,delete-account}.tsx`.

**Modificados**: `src/features/profile/screens/ProfileScreen.tsx` (+ test) ·
`src/shared/ui/index.ts` · `src/features/checkout/components/icons.tsx` y sus
3 consumidores · `src/features/reviews/store/reviewedOrdersStore.ts`
(`clearReviewed`) · `src/features/push/components/PushProvider.tsx` (exportar
la clave) · `PLAN_MOBILE_CERQUITA.md` (Fase 9 + marcar 7a) ·
`docs/phases/STATUS-AUDIT.md`.

**Se reusa sin tocar**: `AddressListScreen` (modo gestión ya existe) ·
`useLogout` · `getClerkErrorMessage` · `shouldRequestPermission` ·
`getFcmToken` · `useRegisterDevice`/`useUnregisterDevice` ·
`Linking.openSettings()` de `useAddressLocation` · `useBottomInset` para el
CTA anclado de `DeleteAccountScreen`.

---

## Verificación

**Gates automáticos** (por checkpoint: solo lo afectado; suite completa una
vez al cierre):

- `pnpm exec jest src/features/profile src/features/reviews --silent`
- `pnpm exec tsc --noEmit` al cerrar cada checkpoint
- `pnpm exec jest --silent` + `pnpm lint` como gate final de fase

**Gate visual — del usuario, en simulador/dispositivo** (no se verifica UI
desde acá):

1. **Perfil**: identidad alineada a la izquierda, card de 4 filas con
   divisores, "Formas de pago" **ausente**, "Cerrar sesión" gris y "Eliminar
   mi cuenta" en rojo abajo. Tap targets ≥44pt.
2. **Mis direcciones**: abre `/addresses` con el título "Mis direcciones"
   (no "Elegí una dirección") y la fila lleva al editor, no vuelve atrás.
3. **Notificaciones**: con permiso denegado la fila dice "Desactivadas" y
   abre los ajustes del SO; **al volver a la app el texto se actualiza solo**;
   activándolo desde ajustes, el device queda registrado (verificable con un
   push de prueba).
4. **Privacidad**: la pantalla scrollea completa, sin texto cortado, y la
   sección de retención del historial está presente.
5. **Eliminar cuenta**: el `Alert` final se puede cancelar sin efecto. Al
   confirmar, vuelve al login sin crash **y sin unhandled rejection en la
   consola de dev**. Después: registrarse de nuevo con el mismo email debe
   entrar normal (relink del backend), sin pantalla de suspendida.
6. **Punto de bloqueo posible**: si al abrir "Eliminar mi cuenta" aparece el
   estado "no podemos procesar el borrado" en vez del CTA, es el toggle de
   self-service deletion apagado en el dashboard de Clerk (Configure →
   Restrictions). Es config del usuario, no código.

---

## Git

Rama `feat/phase-7a-profile`, creada desde `main` (confirmado sincronizado
con `origin/main` en `00b535c` tras `git fetch` — la lectura previa de 2
commits de diferencia era un ref local desactualizado). Commits
convencionales (`feat(profile):`, `feat(auth):`, `refactor(ui):`, `docs:`),
sin trailer de co-autoría.

Política vigente desde esta fase (`CLAUDE.md`): rama, push y PR por unidad
de trabajo los hace Claude Code. El **merge** sigue siendo exclusivamente
del usuario, siempre y sin excepción.

## Progreso

- [x] **C1 — Layout de filas + Mis direcciones.** Cerrado.
  - `SettingsRow` + íconos de `profile/components/icons.tsx` (`GearIcon`,
    `ShieldIcon`, `ChatIcon` — quedan `GearIcon`/`ShieldIcon` reservados para
    C2/C3). Card con 2 filas hoy: Mis direcciones (`/addresses`, reuso puro)
    y Enviar comentarios (`/feedback`, migrada adentro de la card).
  - Promovidos `PinIcon`/`ChevronRightIcon` a `src/shared/ui/icons.tsx`;
    borrado `src/features/checkout/components/icons.tsx` (quedaba vacío).
    Consumidores actualizados: `CheckoutScreen`, `AddressListScreen`,
    `HomeScreen`, `OrderRow`, `LocationCaptureCard` (este último no estaba
    en el inventario original del plan — mismo import, mismo fix).
  - **Desvío del plan, deliberado**: las filas Notificaciones y Privacidad,
    y la acción "Eliminar mi cuenta", NO se agregaron todavía (el plan las
    listaba dentro de C1 con su lógica marcada para C2/C3/C4). Con
    `experiments.typedRoutes` activo, un `router.push('/privacy')` antes de
    que exista `app/(app)/privacy.tsx` rompe `tsc --noEmit`. En vez de forzar
    `as never` como escape hatch, cada fila se agrega en el mismo checkpoint
    que crea su ruta — evita links muertos en cualquier estado intermedio.
    Layout final sin cambios respecto al plan; solo el orden de aparición.
  - Identidad alineada a la izquierda (avatar 60px + nombre/email), header
    "Perfil" en `titleLg`. Tests existentes de `ProfileScreen.test.tsx`
    (nombre/email, logout limpia carrito) siguen valiendo sin cambios.
  - Gate: `pnpm exec jest src/features/profile src/features/checkout
src/features/marketplace src/features/orders --silent` → 20 suites/96
    tests OK. `pnpm exec tsc --noEmit` → limpio.
- [x] **C2 — Fila Notificaciones.** Cerrado.
  - `useNotificationPermission.ts` (nuevo): re-lee `getPermissionsAsync()` en
    cada foco (`useFocusEffect`); detecta la transición real a `granted`
    (con un ref que distingue "primera lectura, ya estaba concedido" de
    "recién se concedió") y ahí sí registra el device (`getFcmToken` +
    `useRegisterDevice`) — cubre el caso que `PushProvider` no cubre: activar
    el permiso después del login, no en el cold start.
  - **Desvío del plan, deliberado**: NO reusa `shouldRequestPermission` de
    `features/push`. Esa función usa el flag `attempted` de AsyncStorage,
    pensado para el prompt automático de una sola vez en frío
    (`PushProvider`) — reusarlo acá haría que, tras un primer "no" del
    usuario, tocar la fila lo mande a Ajustes en vez de mostrarle el diálogo
    nativo de nuevo aunque `canAskAgain` siga en `true` (Android). En su
    lugar, `requestOrOpenSettings()` decide directo por `canAskAgain` +
    `isGranted`: pide el permiso si es pedible y no está concedido; si no,
    abre Ajustes (también cuando ya está concedido, para que el usuario
    pueda revisarlo/desactivarlo).
  - Fila cableada en `ProfileScreen.tsx` entre "Mis direcciones" y "Enviar
    comentarios" (mismo orden del prototipo), `value` "Activadas"/"Desactivadas".
  - Tests nuevos: `useNotificationPermission.test.ts` (5 casos: primera
    lectura sin registrar, transición a concedido registra con el token,
    los 3 casos de `requestOrOpenSettings`). `ProfileScreen.test.tsx`
    actualizado con `QueryClientProvider` (ahora necesario -- la pantalla
    cuelga de `useRegisterDevice`/`useMutation`) y mocks de
    `expo-notifications` + `expo-router` (`useFocusEffect` real exige un
    `NavigationContainer` que no existe al renderizar la pantalla sola).
  - Gate: `pnpm exec jest src/features/profile src/features/push
src/features/auth --silent` → 15 suites/77 tests OK. `pnpm exec tsc
--noEmit` → limpio.
- [ ] C3 — Privacy policy
- [ ] C4 — Borrado de cuenta
