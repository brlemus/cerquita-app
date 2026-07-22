# Fase 1 — Auth (Clerk + /auth/me + gate de cuenta)

Estado: **gate visual pasado (5/5 puntos), 3 hallazgos corregidos — lista para commits de cierre**

### Progreso

- **Checkpoint A** — cerrado. `@clerk/clerk-expo`, `expo-secure-store`,
  `@tanstack/react-query` instalados; `configureAuth` cableado a
  `getToken()` en `app/_layout.tsx`. Nota: `@clerk/clerk-expo` trae
  `expo-auth-session`/`expo-web-browser` como peers reales — sin fijarlos
  explícitamente resuelven en versiones SDK-57 (duplican `expo-constants`/
  `expo-linking`). Se fijaron con `expo install` a versiones SDK-54;
  `expo-doctor` confirma 18/18 checks verdes.
- **Checkpoint B** — cerrado. Rutas `(auth)`/`(app)`, `useAuthMe`,
  `AccountGate`, `SuspendedScreen` (pantalla única para `suspended` y
  `reRegisterBlocked` — mismo tratamiento, sin variantes de copy, tal como
  exige el contrato). `app/index.tsx` (showcase Fase 0) movido a
  `app/(app)/index.tsx` como Home placeholder. Nota de tooling: el
  predicado de retry de `useAuthMe` se extrajo a
  `authMeRetryPolicy.ts` — testearlo desde `useAuthMe.ts` cargaba el SDK
  real de Clerk (mockeado en otros tests, no en ese) y dejaba un timer
  abierto que colgaba `pnpm test` en la suite completa (no en runs
  aislados). Con el predicado en su propio módulo sin imports de Clerk/
  react-query, el proceso de Jest vuelve a salir limpio.
- **Checkpoint C** — cerrado. `TextField` (`shared/ui`), `Text` extendido
  con colores `brand`/`danger`, `Button` con `size="lg"` para el CTA del
  diseño; schemas zod (`signInSchema`, `signUpSchema`, `verificationSchema`,
  vía `@hookform/resolvers/zod` — dependencia de conexión, no una decisión
  de stack nueva); `getClerkErrorMessage` traduce los códigos de error de
  Clerk a copy en español (nunca se muestra texto crudo en inglés al
  usuario); pantallas `SignInScreen`/`SignUpScreen` (sin selector de rol) /
  `VerifyEmailScreen` (código 6 dígitos, `oneTimeCode` solo iOS, reenvío con
  cooldown de 30s) traducidas del prototipo con `react-native-svg` para los
  íconos (tile de marca, chevron). Rutas `app/(auth)/sign-in.tsx`,
  `sign-up.tsx`, `verify-email.tsx`.
- **Gate final (checkpoints A-C)**: `pnpm lint`, `pnpm exec tsc --noEmit` y
  `pnpm test` en verde. `expo-doctor` 18/18.
- **Gate visual del usuario**: los 5 puntos pasan (registro→código→Home con
  `/auth/me` real, persistencia, logout, suspensión vía
  `PATCH /platform/users/:id/suspend`). Encontró 3 hallazgos, todos
  corregidos:

  **1. Bug UX — `VerifyEmailScreen` sin salida.** El estado "esperando
  código" no tenía forma de volver si el email quedado mal escrito.
  Fix: header con botón atrás (mismo patrón visual que `SignUpScreen`) +
  link explícito "¿Email incorrecto? Volver", ambos con `router.back()`.
  Como `VerifyEmailScreen` se llega vía `router.push` desde `SignUpScreen`
  (no `replace`), el stack nativo mantiene `SignUpScreen` montado —
  `router.back()` recupera el form con los valores tal cual los dejó el
  usuario, sin código extra para "precargarlos". No hace falta cancelar el
  intento de Clerk explícitamente: un `signUp.create()` posterior con
  datos nuevos simplemente reemplaza el intento anterior en el servidor.

  **2. Investigado — usuario creado a mano desde el dashboard de Clerk no
  podía entrar.** La hipótesis inicial (claim `name` vacío → 400 en
  `/auth/me`) quedó **descartada**: el usuario de prueba sí tenía
  `firstName`. El síntoma real era otro — fallaba en el Sign In mismo con
  el mensaje genérico "No pudimos iniciar tu sesión", porque
  `getClerkErrorMessage` colapsaba cualquier código de error de Clerk sin
  mapear (o cualquier `status` no-`'complete'` sin excepción) al mismo
  texto opaco — imposible de diagnosticar sin acceso a los logs.
  Hipótesis inicial (antes de confirmar): cuenta creada desde el dashboard
  sin contraseña (`strategy_for_user_invalid`).
  Fix aplicado (mismo criterio que `mapError` del API client — errores
  siempre diseñados, nunca opacos):
  - `getClerkErrorMessage` ahora mapea también `strategy_for_user_invalid`
    ("cuenta sin contraseña configurada — registrate de nuevo o contactá
    soporte"), `user_locked`, `form_password_or_identifier_incorrect`,
    `form_password_compromised`, `signup_rate_limit_exceeded` y
    `captcha_invalid` — todos confirmados como códigos reales de Clerk
    (no se agregó ningún código sin confirmar contra el bundle instalado o
    la documentación).
  - Fallback genérico intacto para lo no mapeado, pero ahora loguea el
    código crudo con `console.warn` bajo `__DEV__` (nunca en producción)
    para poder ampliar el mapeo con evidencia real en vez de adivinar.
  - **Regla de producto documentada**: los usuarios de la app **siempre**
    nacen por el flujo de `SignUpScreen` (que setea `firstName` — necesario
    para el claim `name` del session token). **Crear usuarios a mano desde
    el dashboard de Clerk no es un flujo soportado** por esta app — no hay
    pantalla especial adicional para ese caso porque no es un estado de
    cuenta del contrato del backend (a diferencia de suspended/re-registro),
    es simplemente un flujo no soportado por el lado de Clerk.

  **Causa real confirmada: `needs_second_factor`, no `strategy_for_user_invalid`.**
  El usuario de dashboard sí tenía contraseña — lo que tenía era **MFA
  enrolado**. `signIn.create()` no tira excepción para esto: devuelve
  `status: 'needs_second_factor'` (`SignInResource.status`, confirmado
  contra `SignInStatus` de `@clerk/types`: `'needs_identifier' |
'needs_first_factor' | 'needs_second_factor' | 'needs_new_password' |
'complete'`), y ese branch (`attempt.status !== 'complete'`) todavía tenía
  un solo mensaje genérico fijo — el mismo problema de opacidad que la
  Fase venía corrigiendo, pero en el código de status en vez del de
  excepciones.

  **Decisión de producto**: la app **NO soporta segundo factor en el
  MVP** — solo email+password de un factor. El usuario deshabilita MFA a
  nivel de instancia en el dashboard de Clerk. **MFA queda en el backlog
  post-MVP** (ver `PLAN_MOBILE_CERQUITA.md` si se retoma).

  Fix: `getIncompleteSignInMessage(status)` (junto a `getClerkErrorMessage`
  en `clerkErrorMessage.ts`) mapea los 4 valores no-`'complete'` de
  `SignInStatus`:
  - `needs_second_factor` → "Esta cuenta tiene verificación en dos pasos,
    que la app todavía no soporta. Contactá soporte." (el único que se vio
    en la práctica).
  - `needs_first_factor` / `needs_new_password` → mensajes defensivos
    (no deberían ocurrir con el flujo de password puro que usa la app).
  - `needs_identifier` y cualquier otro no listado → fallback genérico +
    `console.warn` del status crudo en `__DEV__`, mismo criterio que
    `getClerkErrorMessage`.

  **3. Bug de teclado — dead-end en las 3 pantallas de auth.** Una vez
  enfocado cualquier input, tocar afuera no cerraba el teclado y el teclado
  tapaba el CTA (y en Sign In, también el link "Crear cuenta") sin forma de
  llegar a ellos. `VerifyEmailScreen` ni siquiera tenía `ScrollView`; en
  `SignInScreen` no había ninguno; en `SignUpScreen` había uno para los
  campos pero el botón vivía en un `View` pinneado _afuera_ del scroll,
  vulnerable al mismo problema con contenido más alto (errores de
  validación expandiendo el layout).

  **Fix — componente compartido, no parche por pantalla**:
  `src/shared/ui/KeyboardAwareScreen.tsx`. Combina `SafeAreaView` +
  `KeyboardAvoidingView` (`behavior="padding"` en iOS, `undefined` en
  Android — Android ya resuelve con `adjustResize`) + `ScrollView` con
  `keyboardShouldPersistTaps="handled"` (tocar afuera de un input cierra el
  teclado; tocar un botón funciona con el teclado abierto) y
  `keyboardDismissMode="on-drag"`. Acepta un slot `header` (contenido fijo
  arriba del scroll — ej. el back button de `SignUpScreen`/
  `VerifyEmailScreen`, que debe quedar siempre alcanzable sin importar el
  scroll) y `children` para el resto, que sí se desplaza. **Las 3 pantallas
  de auth lo adoptaron**, con el CTA y los links siempre dentro del área
  scrolleable (nunca pinneados afuera).

  **Es el wrapper obligatorio para toda pantalla con formulario de acá en
  adelante** (checkout, direcciones, perfil, etc. — cualquier pantalla con
  `TextInput`). Documentado también en el JSDoc del propio componente, que
  es donde lo va a encontrar quien arme la próxima pantalla.

  De paso, se revisó `returnKeyType`/encadenamiento de campos en los 3
  forms (no estaba antes): campos intermedios usan `returnKeyType="next"` +
  `submitBehavior="submit"` + `onSubmitEditing` con un `ref` (vía
  `forwardRef` de `TextField`) que enfoca el siguiente campo sin cerrar el
  teclado; el último campo de cada form usa `returnKeyType="done"` +
  `submitBehavior="blurAndSubmit"`, que cierra el teclado al tocar "done".
  Orden: Sign In (email→password), Sign Up (nombre→email→contraseña),
  Verify Email (un solo campo, done).

- **Gate final tras los 3 hallazgos**: `pnpm lint`, `pnpm exec tsc --noEmit`
  y `pnpm test` (10 suites / 56 tests) en verde. Lista para los commits de
  cierre de fase.

## Context

Fase 0 dejó el scaffold: theme derivado de `docs/design/TOKENS.md`, API client
único (`src/shared/api/`) con el **seam `configureAuth()` ya listo** (hoy
devuelve `undefined`) y `mapError()` que ya modela los kinds `unauthorized`,
`suspended`, `reRegisterBlocked`. No hay login real que alimente ese seam ni
árbol de rutas protegidas. Esta fase conecta Clerk de punta a punta: es el
**primer end-to-end real de auth** contra el backend de producción (los e2e
del backend usan JWTs locales, nunca se probó con tokens reales de Clerk).

Objetivo: integrar `@clerk/clerk-expo` con `tokenCache` sobre
`expo-secure-store`, traducir Login/Register del prototipo (`docs/design/`)
con el theme, cablear `configureAuth` a `getToken()` de Clerk, y hacer el gate
de sesión con `GET /auth/me` manejando los errores de cuenta del contrato
(401 → refresh/redirect, 403 SUSPENDED y 409 re-registro → pantalla de cuenta
bloqueada).

**Regla dura del backend verificada** (leído en `../cerquita-api`,
`src/modules/auth/infrastructure/clerk-token-verifier.adapter.ts:35`) — el
guard lee del payload del JWT, con `jose.jwtVerify` (JWKS, RS256, sin
template): `sub` → `clerkId`, más `email` y `name`, **los tres como `string`
top-level**. Si `email` o `name` faltan/no son string → `ValidationError` →
**400**. Por eso, si `/auth/me` da 400 en la primera prueba real, el
sospechoso #1 es el mapeo de claims del dashboard de Clerk, **no** el código
de la app.

## Decisiones de producto confirmadas con el usuario

- **Claims del session token**: el backend verifica el session token plano de
  Clerk (sin JWT template). El usuario configura "Customize session token" en
  el dashboard con `email` y `name` top-level.
- **Registro sin selector de rol**: la app es solo customer; el backend hace
  JIT `role=CUSTOMER` siempre. El selector "Cliente" / "Tengo un negocio" del
  prototipo importado **se elimina** del Register traducido. Backlog post-MVP:
  cuando exista el panel web de owners publicado, agregar un punto de entrada
  discreto ("¿Tenés un negocio?") en perfil o registro — no antes.
- **Verificación de email**: pantalla de código de 6 dígitos, diseñada fresh
  desde `TOKENS.md` (no está en el prototipo importado). Input con
  `autoComplete`/`textContentType` de one-time-code para autocompletar desde
  el mail, reenvío con cooldown visible, y estados de error diseñados (código
  incorrecto, expirado).

## Configuración que hace el usuario (Claude no toca `.env` ni el dashboard)

### En el dashboard de Clerk

1. Crear la aplicación Clerk (si no existe). Auth: **Email + Password** como
   identificador (Email address on, Password on). Email verification: **on**
   (código, ver flujo de Register).
2. **Customize session token** (Sessions → Edit session token). Agregar al
   payload, con estas keys EXACTAS (el backend las lee top-level):
   ```json
   {
     "email": "{{user.primary_email_address}}",
     "name": "{{user.full_name}}"
   }
   ```
   `sub` ya viene por default (Clerk user id) — no configurarlo. No hace falta
   ningún JWT template: el backend verifica el **session token plano**.
3. Confirmar que el **issuer** del session token coincide con el
   `CLERK_ISSUER_URL` del backend de producción (y que `CLERK_JWKS_URL` apunta
   a esa misma instancia). Si la app apunta a una instancia Clerk distinta de
   la que valida el backend → 401 en todo. Es alineación app↔backend, la hace
   el usuario.

### Variables de entorno que espera el código

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` = la **Publishable key** de Clerk
  (`pk_test_…` / `pk_live_…`). Va en `.env` local. Se expone vía
  `app.config.ts` → `extra.clerkPublishableKey`, y el `<ClerkProvider>` la
  consume desde ahí (mismo patrón que `apiUrl`).
- `EXPO_PUBLIC_API_URL` ya existe de Fase 0 — apuntarla al backend de
  producción para el gate visual.

## Decisiones de arquitectura (senior FE, 1 línea c/u)

- **Rutas: grupos `(auth)` público vs `(app)` protegido en Expo Router.** El
  layout de `(app)` redirige a `/(auth)/sign-in` si Clerk no está
  `isSignedIn`; el de `(auth)` redirige a `/(app)` si ya hay sesión — un solo
  punto de verdad por grupo, sin chequear auth en cada pantalla.
- **`getToken()` sin template.** El seam se cablea
  `configureAuth(() => getToken())` (session token plano, ya confirmado). Si
  el backend pidiera template más adelante, es cambiar solo esa línea.
- **Data layer: se introduce TanStack Query ahora.** `/auth/me` es server
  state con cache/refetch — es la capa que manda el plan y Fase 2 la necesita
  ya. `QueryClientProvider` se monta en el root layout. **Zustand NO** entra
  en esta fase (la sesión la tiene Clerk; el carrito es Fase 3).
- **Formularios: `react-hook-form` + `zod`** (stack cerrado del plan) — Login
  y Register son los primeros forms; los schemas zod espejan las
  validaciones.
- **Gate de cuenta = componente en `(app)/_layout`.** Con Clerk `isSignedIn`,
  corre la query `/auth/me` y ramifica: cargando → skeleton/splash;
  `suspended` o `reRegisterBlocked` → pantalla de cuenta bloqueada;
  `unauthorized` (401) → `signOut()` de Clerk (redirige solo al login); ok →
  renderiza el Stack.

## Dependencias a agregar

`@clerk/clerk-expo`, `expo-secure-store`, `@tanstack/react-query`,
`react-hook-form`, `zod`. Todas del stack cerrado de
`PLAN_MOBILE_CERQUITA.md`, nada extra. Compatibles con Expo Go (el requisito
de development build recién aparece en Fase 5). `expo-linking` y
`expo-constants` ya están instalados.

## Checkpoints

### Checkpoint A — Plumbing de Clerk + providers + seam

- `src/shared/auth/tokenCache.ts` — `tokenCache` con `SecureStore.getItemAsync`
  / `setItemAsync` / `deleteItemAsync` (patrón documentado de Clerk).
- `app.config.ts` — agregar `extra.clerkPublishableKey` desde
  `process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- `app/_layout.tsx` — envolver el árbol en `<ClerkProvider publishableKey…
tokenCache>` + `<QueryClientProvider>`, y montar un `<AuthConfigurator>` que
  llama `configureAuth(() => getToken())` de `useAuth()` una sola vez.
- Gate: typecheck + test del `tokenCache` (mock de expo-secure-store).

### Checkpoint B — Rutas, query /auth/me y gate de cuenta

- `src/shared/api/types.ts` — agregar `AuthMeResponse` (id, clerkId, name,
  email, role `UserRole`, status `UserStatus`, businessId). Reusa los enums
  `UserRole`/`UserStatus` que ya existen.
- `src/features/auth/api/getAuthMe.ts` — `request<AuthMeResponse>('/auth/me')`.
- `src/features/auth/hooks/useAuthMe.ts` — `useQuery` (key `['auth','me']`,
  `enabled` solo con sesión Clerk, `retry` que NO reintenta 401/403/409).
- `app/(auth)/_layout.tsx` y `app/(app)/_layout.tsx` — redirects por
  `isSignedIn` (`<Redirect>` de Expo Router; esperar `isLoaded`).
- `src/features/auth/components/AccountGate.tsx` — ramificación descrita
  arriba (loading / suspended / reRegisterBlocked / 401 / ok).
- `src/features/auth/screens/SuspendedScreen.tsx` — **diseñada fresh desde
  tokens** (no está en el prototipo): icono, "Tu cuenta está suspendida",
  copy de contactar soporte, botón "Cerrar sesión". Sirve para ambos casos
  (SUSPENDED y re-registro bloqueado) con copy levemente distinto por
  variante.
- `app/(app)/index.tsx` — Home placeholder temporal con saludo (`name` de
  `/auth/me`) + botón **"Cerrar sesión"** (`signOut()`), único medio de
  logout hasta Fase 7; sirve para el gate visual de persistencia. Reemplaza
  al showcase de Fase 0 (mover/eliminar `app/index.tsx`).
- Gate: typecheck + tests de `useAuthMe` (mapea a suspended/reRegisterBlocked
  /401 sin retry) y de la lógica de ramificación del `AccountGate`.

### Checkpoint C — UI compartida + Login + Register + verificación

- `src/shared/ui/TextField.tsx` — label (`bodySm`) + input (`padding:14`,
  `border:1.5 border.default`, `radius.lg`=14, `bodyLg`=15, placeholder
  `text.secondary`), prop `secureTextEntry`, estado de error con
  `colors.danger.default`, y props `autoComplete`/`textContentType`
  passthrough. Con test de comportamiento (RNTL).
- `src/shared/ui/index.ts` — exportar `TextField`. Extender `Text` para
  aceptar color `brand`/`danger` (o exponer helper), necesario para el link
  "Crear cuenta" y textos de error.
- Ajuste menor a `Button` para el CTA del diseño (radius 14, texto 16/600)
  sin romper su uso actual — variante o prop de tamaño, mínima.
- `src/features/auth/schemas.ts` — zod: `signInSchema` (email, password),
  `signUpSchema` (name, email, password ≥6), `verificationSchema` (code 6
  dígitos). Con tests.
- `src/features/auth/screens/SignInScreen.tsx` — traducida del prototipo
  (logo tile brand 76×76, "Cerquita", subtítulo, Email + Contraseña, CTA
  "Iniciar sesión", footer "¿No tenés cuenta? Crear cuenta"). Usa
  `useSignIn()` de Clerk + rhf/zod. Estados de error diseñados (credenciales
  inválidas, red).
- `src/features/auth/screens/SignUpScreen.tsx` — traducida SIN el selector
  de rol (ver Decisiones de producto). Campos Nombre/Email/Contraseña,
  header con back, CTA "Crear cuenta". `useSignUp()` →
  `create({ firstName: name, emailAddress, password })` +
  `prepareEmailAddressVerification` → navega a la pantalla de código. Nota
  clave: setear `firstName` con el "Nombre" garantiza que
  `{{user.full_name}}` no sea vacío → evita el 400 por claim `name`
  faltante.
- `src/features/auth/screens/VerifyEmailScreen.tsx` — **diseñada fresh desde
  tokens**. Input de código de 6 dígitos con `textContentType="oneTimeCode"`
  (hint de autocompletado desde el mail, **solo iOS** — `autoComplete`
  `sms-otp`/`one-time-code` de Android es para códigos por SMS, no aplica a
  un código recibido por email, así que no se usa ni se promete en Android),
  botón "Reenviar código" con **cooldown visible** (ej. 30s), estados de
  error (código incorrecto / expirado). `attemptEmailAddressVerification` →
  `setActive` → sesión iniciada → el gate corre `/auth/me` (JIT en backend).
- Rutas: `app/(auth)/sign-in.tsx`, `sign-up.tsx`, `verify-email.tsx` (montan
  las screens del feature).
- Gate: typecheck + tests de `TextField` y de los schemas zod. **Suite
  completa del proyecto** (`pnpm test`) como cierre de fase, una sola vez.

Flujo Register completo: **Crear cuenta → código → sesión iniciada →
/auth/me (JIT CUSTOMER en el backend)**.

## Archivos clave

- Modificar: `app/_layout.tsx`, `app.config.ts`, `src/shared/api/types.ts`,
  `src/shared/ui/index.ts`, `src/shared/ui/Text.tsx`,
  `src/shared/ui/Button.tsx`, `src/shared/ui/theme.ts` (solo si hace falta
  un token nuevo — evaluar, preferir reusar lo existente).
- Crear: `src/shared/auth/tokenCache.ts`, `src/shared/ui/TextField.tsx`, todo
  `src/features/auth/**` (api, hooks, schemas, components, screens),
  `app/(auth)/**` y `app/(app)/**`.
- Reemplazar/mover: `app/index.tsx` (showcase Fase 0) → Home placeholder en
  `(app)`.
- Reusar tal cual: `configureAuth`/`request`/`ApiRequestError`/`mapError`
  (`src/shared/api/`), `Button`, `Text`, `theme` (`src/shared/ui/`).

## Verificación

- **Automática (Claude)**: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`
  (suite completa al cierre de fase). Tests por path durante desarrollo
  (`tokenCache`, `useAuthMe`, `AccountGate`, schemas zod, `TextField`).
- **Visual (usuario)**, con `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` y
  `EXPO_PUBLIC_API_URL` → producción, y el session token de Clerk con los
  claims `email`/`name` ya configurados:
  1. **Login real**: registrar una cuenta nueva (email+password) → recibir y
     cargar el código de 6 dígitos → entrar al Home con el saludo por
     `name`.
  2. **/auth/me contra producción**: el Home muestra datos reales del
     backend; si devuelve 400, revisar el "Customize session token"
     (claims), no la app.
  3. **Persistencia**: cerrar del todo la app y reabrirla → sigue logueado
     sin pedir credenciales (tokenCache en secure-store).
  4. **Logout**: botón "Cerrar sesión" → vuelve al Login; reabrir → pide
     login.
  5. **Cuenta suspendida**: el usuario suspende su propia cuenta de test vía
     `PATCH /platform/users/:id/suspend` (con su usuario super-admin, en
     producción) → al entrar/reabrir la app, ve la pantalla de cuenta
     bloqueada en vez del Home. Reactiva la cuenta después por el mismo
     medio y confirma que vuelve a entrar normal.

  Qué debe verse: pantallas Login/Register fieles al prototipo (tile brand,
  inputs redondeados 14, CTA violeta); pantalla de código y de cuenta
  suspendida coherentes con el theme; ningún spinner de pantalla completa
  sin diseño, sin pantallas en blanco en los estados de error.

## Notas / backlog

- **Post-MVP**: punto de entrada a owners (ver Decisiones de producto).
- **Post-MVP**: MFA (segundo factor) — no soportado en el MVP (decisión de
  producto confirmada durante el gate visual; el usuario deshabilita MFA a
  nivel de instancia en el dashboard de Clerk). Si se retoma, requiere
  pantallas nuevas (TOTP/SMS) y cablear `needs_second_factor` a un flujo
  real en vez del mensaje de "no soportado" de
  `getIncompleteSignInMessage` (`src/features/auth/clerkErrorMessage.ts`).
- **Fuera de esta fase**: registro de device FCM (`POST /devices`) es Fase 5;
  borrado de cuenta es Fase 7.

## Notas de git / permisos

- Rama actual `phase-1-auth` (ya creada por el usuario) — no se decide ni
  cambia de rama. El push y el PR son del usuario.
- No se crean/leen archivos `.env*` (denegados). No `eas build/submit`.
- Commits: conventional (`feat(auth): clerk provider + token cache`,
  `feat(auth): auth/me gate + suspended screen`, `feat(auth): sign-in/up
screens`), sin trailer de co-autoría.
