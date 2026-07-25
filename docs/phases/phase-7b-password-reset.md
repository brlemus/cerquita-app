# Fase 7b — Recuperación de contraseña

**Estado**: Implementada, gate de cierre en verde. Pendiente: PR + merge + verificación visual del usuario.

## Contexto

La Fase 7a partió su alcance en dos: **7a = Perfil** (mergeada, `1c404df`) y
**7b = recuperación de contraseña** (esta fase). Hoy la app tiene un hueco
real: si un usuario olvida su contraseña **no tiene salida in-app** — el
link "¿Olvidaste tu contraseña?" del login se omitió a propósito en el
chore de marca (`docs/phases/chore-brand-v2-login-splash.md:72`) porque no
existía flujo detrás, y quedó anotado como backlog en
`PLAN_MOBILE_CERQUITA.md:383`.

Esta fase cierra ese hueco: flujo de reset por código de Clerk, restaurar el
link del login en la posición/estilo que fija el README de marca, y mapear
los códigos de error nuevos al patrón centralizado.

**Estado de git verificado al planificar**: `main` limpio, alineado con
`origin/main` (`1c404df`). Rama nueva desde `main`.

---

## Alcance

**Entra**: pantalla forgot-password (email), pantalla reset-password
(código 6 dígitos + contraseña nueva), link en el login, códigos de error
nuevos, caso borde de cuentas social-only.

**No entra** (recortes explícitos):

- Reset por SMS (`reset_password_phone_code`) — la app no usa teléfono.
- `signOutOfOtherSessions` — requiere el flujo de 2 llamadas de Clerk, que
  puede consumir el código antes de validar la contraseña (ver "Decisión 2").
  Post-MVP.
- Cambio de contraseña desde Perfil (usuario ya logueado) — nadie lo pidió,
  es otro flujo (`user.updatePassword`).

---

## Decisiones de diseño

### Decisión 1 — Detección de cuentas social-only: determinista, no por error

El caso borde pedido (usuarios que entraron **solo** por Google/Apple y no
tienen contraseña) **no se resuelve mapeando un error crudo**, porque el
código que Clerk devolvería no está confirmado y la regla del repo es no
adivinar códigos (`clerkErrorMessage.ts:5-8`).

Se replica lo que hace la propia UI de Clerk (verificado en el bundle,
`node_modules/@clerk/clerk-js/dist/signin_clerk.browser_*.js`): dos
llamadas.

```ts
const attempt = await signIn.create({ identifier: email }); // no manda código todavía
const availability = getResetPasswordAvailability(attempt.supportedFirstFactors);
// 'available'   -> prepareFirstFactor + navegar
// 'social-only' -> mensaje que NOMBRA el proveedor, sin navegar
// 'unavailable' -> mensaje de contactá soporte
await signIn.prepareFirstFactor({ strategy: 'reset_password_email_code', emailAddressId });
```

Ventajas sobre la variante de una sola llamada
(`signIn.create({ strategy: 'reset_password_email_code', identifier })`):
detecta social-only **con certeza** en vez de depender de un código de
error no confirmado, y da el `safeIdentifier` (email enmascarado) para el
copy de la pantalla siguiente. Se sacrifica un round-trip extra antes de
mandar el código — invisible para el usuario, ya está en estado de carga.

Tipos verificados en `@clerk/shared/dist/types/index.d.ts` (no supuestos):
`ResetPasswordEmailCodeFactor` = `{ strategy, emailAddressId, safeIdentifier, primary? }`,
`OauthFactor` = `{ strategy: 'oauth_google' | 'oauth_apple' | ... }`,
`SignInResource.prepareFirstFactor/attemptFirstFactor`.

### Decisión 2 — Reset en UNA llamada, no dos

`attemptFirstFactor({ strategy: 'reset_password_email_code', code, password })`
resuelve a `complete` en una sola llamada (`ResetPasswordEmailCodeAttempt`
acepta `password`). La alternativa de dos pasos (`attemptFirstFactor(code)` →
`needs_new_password` → `signIn.resetPassword({ password })`) permitiría
`signOutOfOtherSessions`, pero **parte el fallo en dos**: si la contraseña
se rechaza por política, el código ya se consumió y el usuario queda a
mitad de camino. Una llamada = un punto de fallo, y el link "Reenviar
código" es la salida si algo se rompe. Se sacrifica cerrar las otras
sesiones (post-MVP).

Tras `complete` → `setActive({ session })`: el usuario queda logueado en el
acto (no lo mandamos de vuelta al login a re-tipear lo que acaba de crear).

Si el status vuelve `needs_second_factor` (caso real visto en Android,
`chore-brand-v2-login-splash.md`), se reusa **tal cual** el camino
existente: `findEmailCodeSecondFactor` + `prepareSecondFactor` + navegar a
`/(auth)/second-factor` — el recurso `signIn` es compartido entre
pantallas, `SecondFactorScreen` funciona sin tocarla.

### Decisión 3 — Reuso del patrón OTP: extraer 3 piezas, no un mega-componente

`VerifyEmailScreen` y `SecondFactorScreen` ya son ~95% duplicadas entre sí.
La pantalla de reset sería la **tercera** copia. Se extrae lo que se repite
literal (regla del repo: los componentes se extraen cuando se repiten):

| Pieza                                                            | Hoy duplicada en                      | Con 7b |
| ---------------------------------------------------------------- | ------------------------------------- | ------ |
| `BackButton` (Pressable circular + chevron SVG)                  | VerifyEmail, SecondFactor, **SignUp** | 5 usos |
| `CodeField` (TextField 6 dígitos, `oneTimeCode` iOS, number-pad) | VerifyEmail, SecondFactor             | 3 usos |
| `useResendCooldown(30)` (useState + useEffect + timer)           | VerifyEmail, SecondFactor             | 3 usos |

**No** se extrae una `OtpScreen` completa: la de reset tiene un campo extra
(contraseña nueva) y otro copy, y forzar un layout único llevaría a un
componente con slots — el mismo criterio con el que el repo decidió no
tener un `BottomBar` único (CLAUDE.md, Arquitectura).

### Decisión 4 — El link del login, exactamente como lo fija el README de marca

`assets/brand/README.md:107`: _"Link «¿Olvidaste tu contraseña?»: Inter 600
13px, `color.brand`, alineado a la derecha"_ y `:108` _"Botón primario […]
A 24px del link"_. Confirmado también en
`assets/brand/login-final-referencia.png` (entre el campo Contraseña y el
botón, pegado a la derecha).

`Text variant="bodySm"` YA es 13px/600 (`theme.ts:80`) — no se agrega
ninguna variante. Se usa `PressableOpacity` (patrón app-wide desde
`d1d0748`) con `hitSlop` en vez de padding, para no alterar los 24px que
manda el spec.

---

## Checkpoints

### C1 — Piezas compartidas del patrón OTP

Nuevos en `src/features/auth/`:

- `components/BackButton.tsx` — el `Pressable` circular 38px con el
  chevron (`accessibilityLabel="Volver"`, `onPress` prop). Solo el botón,
  **no** la barra: cada pantalla arma su `topBar` (SignUp lleva título al
  lado).
- `components/CodeField.tsx` — el `TextField` de código con sus props
  fijas (`keyboardType="number-pad"`, `maxLength={6}`, `textContentType`
  `oneTimeCode` solo iOS, `returnKeyType="done"`); recibe
  `value/onChangeText/onBlur/error`.
- `hooks/useResendCooldown.ts` — `{ cooldown, restart }`, arranca en 30s y
  decrementa con `setTimeout` (mismo código que hoy, un solo lugar).

Refactor mecánico a esas piezas: `VerifyEmailScreen`, `SecondFactorScreen`,
`SignUpScreen` (solo `BackButton`).

Test: `useResendCooldown.test.ts` con fake timers (arranque, decremento,
`restart`). `BackButton`/`CodeField` son presentacionales → sin test.

Gate C1: `pnpm exec tsc --noEmit` + `pnpm exec jest src/features/auth --silent`.

### C2 — Flujo de reset

- `schemas.ts`: `forgotPasswordSchema = signInSchema.pick({ email: true })`
  (reuso, no re-declarar el email) y
  `resetPasswordSchema = verificationSchema.extend({ password: z.string().min(6, 'Mínimo 6 caracteres') })`
  — mismo mínimo y mismo copy que `signUpSchema`, para no contradecirlo.
- `resetPasswordFactor.ts` — espejo de `findEmailCodeSecondFactor.ts`:
  `getResetPasswordAvailability(factors)` →
  `{ kind:'available', emailAddressId, safeIdentifier }`
  | `{ kind:'social-only', providers: ['Google'|'Apple'] }`
  | `{ kind:'unavailable' }`, más `getSocialOnlyMessage(providers)` que
  arma el copy nombrando el proveedor: _"Esta cuenta se creó con Google,
  así que no tiene contraseña. Volvé e iniciá sesión con ese botón."_
  (genérico si hay varios o ninguno reconocido).
- `screens/ForgotPasswordScreen.tsx` — layout de la familia VerifyEmail
  (pantalla blanca + `BackButton`, no el header violeta): título
  "¿Olvidaste tu contraseña?", subtítulo "Te mandamos un código de 6
  dígitos para crear una nueva.", campo Email, botón "Enviar código", link
  "Volver al inicio de sesión". Aplica la Decisión 1.
- `screens/ResetPasswordScreen.tsx` — `CodeField` + campo "Contraseña
  nueva" (`secureTextEntry`, `textContentType="newPassword"`), botón
  "Cambiar contraseña", "Reenviar código" con `useResendCooldown`.
  Subtítulo con `safeIdentifier` si está, genérico si no (mismo fallback
  que `SecondFactorScreen:126`). Aplica la Decisión 2.
- Rutas: `app/(auth)/forgot-password.tsx` y `app/(auth)/reset-password.tsx`
  (wrappers de 5 líneas, como `sign-in.tsx`). El `Stack` de
  `app/(auth)/_layout.tsx` ya es `headerShown: false` — no se toca.
- `clerkErrorMessage.ts`: agregar al mapa **solo códigos confirmados en el
  bundle de clerk-js** (verificados uno por uno):
  `form_password_not_strong_enough`, `form_password_validation_failed`,
  `form_password_length_too_long`, `form_password_size_in_bytes_exceeded`,
  `form_password_no_uppercase`, `form_password_no_lowercase`,
  `form_password_no_number`, `form_password_no_special_char`,
  `rate_limit_exceeded`, `form_param_format_invalid`.
  (`form_identifier_not_found`, `form_code_incorrect` y
  `strategy_for_user_invalid` ya están mapeados y cubren el resto del
  flujo.)

Tests: `resetPasswordFactor.test.ts` (available / social-only Google /
social-only Apple / lista vacía o null → unavailable / copy que nombra el
proveedor), casos nuevos en `schemas.test.ts` y en
`clerkErrorMessage.test.ts`. Las pantallas son orquestación + presentación
→ sin test, consistente con `VerifyEmailScreen`/`SecondFactorScreen`.

Gate C2: typecheck + `jest src/features/auth`.

### C3 — Link en el login + cierre

- `SignInScreen.tsx`: `PressableOpacity` con `Text variant="bodySm"
color="brand"` "¿Olvidaste tu contraseña?" entre el bloque de inputs y
  el botón primario, `alignSelf: 'flex-end'`, `marginTop: spacing.md`,
  `hitSlop` para el touch target; `styles.submit` mantiene sus 24px del
  spec. Navega con `<Link href="/(auth)/forgot-password" asChild>` (mismo
  patrón que el footer "Crear cuenta").
- Docs: esta fase al día, `PLAN_MOBILE_CERQUITA.md:185` y `:383` (7b →
  Construida, sacar del backlog), `docs/phases/STATUS-AUDIT.md:29,59`.
- Gate completo: `pnpm exec tsc --noEmit`, `pnpm exec jest --silent`
  (suite entera, una sola vez), lint.
- Rama `feat/password-reset`, commits convencionales, **PR abierto por
  Claude Code; el merge es del usuario**.

---

## Archivos

**Nuevos**: `src/features/auth/components/{BackButton,CodeField}.tsx`,
`src/features/auth/hooks/useResendCooldown.ts(+test)`,
`src/features/auth/resetPasswordFactor.ts(+test)`,
`src/features/auth/screens/{ForgotPassword,ResetPassword}Screen.tsx`,
`app/(auth)/{forgot-password,reset-password}.tsx`,
`docs/phases/phase-7b-password-reset.md` (este archivo).

**Modificados**: `SignInScreen.tsx`, `VerifyEmailScreen.tsx`,
`SecondFactorScreen.tsx`, `SignUpScreen.tsx`, `schemas.ts(+test)`,
`clerkErrorMessage.ts(+test)`, `PLAN_MOBILE_CERQUITA.md`,
`docs/phases/STATUS-AUDIT.md`.

---

## Verificación

**Automática**: `pnpm exec tsc --noEmit` · `pnpm exec jest --silent` ·
lint. Los tests cubren la lógica no trivial: elección de factor de reset,
detección social-only y su copy, schemas, códigos de error nuevos,
cooldown.

**Visual (del usuario, ANTES del merge)** — con la app corriendo, 5
caminos:

1. **Login**: el link "¿Olvidaste tu contraseña?" aparece a la derecha
   entre el campo Contraseña y el botón violeta, mismo look que
   `login-final-referencia.png`, y se atenúa al presionarlo.
2. **Feliz**: tap → email real con contraseña → llega el código → código +
   contraseña nueva → entrás directo a la app; cerrar sesión y volver a
   entrar con la contraseña nueva funciona.
3. **Social-only**: pedí reset con un email que creaste con Google →
   mensaje que **nombra a Google** y no te manda a la pantalla de código
   (nunca un error crudo en inglés).
4. **Errores**: email inexistente → "No encontramos una cuenta con ese
   email."; código mal → "El código es incorrecto."; contraseña de 3
   caracteres → error de validación bajo el campo.
5. **Regresión del refactor**: registro (verificar email) y, si aparece,
   el segundo factor siguen viéndose y funcionando igual — se tocaron esas
   pantallas para compartir botón/campo/cooldown. Chequear también el
   botón "Volver" de Crear cuenta.

---

## Git

Rama `feat/password-reset`, creada desde `main` (verificado sincronizado
con `origin/main` en `1c404df` antes de planificar). Commits
convencionales, sin trailer de co-autoría. PR abierto por Claude Code al
cierre; el **merge** es exclusivamente del usuario.

## Progreso

### C1 — Piezas compartidas del patrón OTP (cerrado)

- Creados `components/BackButton.tsx`, `components/CodeField.tsx`,
  `hooks/useResendCooldown.ts` (+ `useResendCooldown.test.ts`, 4 casos:
  arranque en 30, decremento, piso en 0, `restart`).
- Refactor mecánico a las tres piezas en `VerifyEmailScreen`,
  `SecondFactorScreen` (botón + campo + cooldown) y `SignUpScreen` (solo
  botón) — sin cambios de comportamiento ni de estilos visuales, mismos
  estilos calculados, solo se movió el código fuente.
- **Nota de implementación**: `advanceTimersByTime` con un solo salto
  grande no le daba a React chance de flushear el `useEffect` que
  reprograma el próximo `setTimeout` entre ticks (el hook solo agenda un
  timer por vez) — el test de cooldown avanza de a 1s con su propio
  `act()` cada uno en vez de un salto único.
- **Gate C1**: `pnpm exec tsc --noEmit` → limpio. `pnpm exec jest
src/features/auth --silent` → **11 suites, 61 tests, 0 fallos**.

**Verificación visual pendiente para el usuario** (no bloquea, pero conviene
chequear antes del cierre de fase): pantallas de "Verificá tu email"
(registro) y "Confirmá tu identidad" (segundo factor) se ven y funcionan
igual que antes — botón "Volver" circular, campo de código, cooldown de
reenvío contando 30→0. Mismo chequeo en el botón "Volver" de "Crear cuenta".

### C2 — Flujo de reset (cerrado)

- `schemas.ts`: `forgotPasswordSchema` (pick de `signInSchema.email`) y
  `resetPasswordSchema` (extend de `verificationSchema` + `password` mínimo
  6, mismo copy que `signUpSchema`).
- `resetPasswordFactor.ts` — `getResetPasswordAvailability` (espejo de
  `findEmailCodeSecondFactor`) y `getSocialOnlyMessage`. Implementa la
  Decisión 1: replica la detección de la propia UI de Clerk (verificada en
  el bundle) sobre `supportedFirstFactors` tras `signIn.create({ identifier })`
  — `reset_password_email_code` presente → `available`; solo factores
  `oauth_*` → `social-only` con la lista de proveedores (Google/Apple,
  deduplicados; un proveedor no ofrecido por la app cae a lista vacía pero
  sigue siendo `social-only`, nunca `unavailable`); nada de eso →
  `unavailable`.
- `screens/ForgotPasswordScreen.tsx` y `screens/ResetPasswordScreen.tsx` —
  layout de la familia VerifyEmail (`BackButton` + `KeyboardAwareScreen`).
  `ResetPasswordScreen` implementa la Decisión 2 (una sola llamada,
  `attemptFirstFactor` con `code` + `password`) con un fallback defensivo:
  si el servidor igual devuelve `needs_new_password` (el tipo
  `ResetPasswordEmailCodeAttempt.password` documenta el atajo pero no hay
  forma de confirmar el comportamiento del backend de Clerk sin credenciales
  de prueba), se completa con `signIn.resetPassword({ password })` sin
  pedirle el código de nuevo al usuario. `resetFactor.safeIdentifier` se lee
  del recurso `signIn` compartido, mismo patrón que `SecondFactorScreen`.
- Rutas `app/(auth)/forgot-password.tsx` y `app/(auth)/reset-password.tsx`
  (wrappers de 3 líneas).
- `clerkErrorMessage.ts`: 10 códigos nuevos agregados, todos confirmados uno
  por uno contra el bundle de `clerk-js` antes de mapearlos (regla del
  archivo: nunca adivinar un código) — validación de contraseña nueva
  (`form_password_not_strong_enough`, `_validation_failed`,
  `_length_too_long`, `_size_in_bytes_exceeded`, `_no_uppercase`,
  `_no_lowercase`, `_no_number`, `_no_special_char`), más
  `rate_limit_exceeded` y `form_param_format_invalid`.
- **Nota de implementación real**: mismo caso que Fase 7a C3/C4 —
  `.expo/types/router.d.ts` no tenía `/forgot-password` ni
  `/reset-password` hasta regenerar con `expo start` (~20s en background,
  killeado después).
- Tests nuevos: `resetPasswordFactor.test.ts` (7 casos: available,
  social-only Google, social-only Apple, social-only con ambos sin
  duplicar, proveedor no reconocido → providers vacío, unavailable sin
  factores, unavailable con null/vacío), 3 casos de `getSocialOnlyMessage`,
  3 casos nuevos en `schemas.test.ts`, 3 casos nuevos en
  `clerkErrorMessage.test.ts`.
- **Gate C2**: `pnpm exec tsc --noEmit` → limpio. `pnpm exec jest
src/features/auth --silent` → **12 suites, 79 tests, 0 fallos**.

### C3 — Link en el login + cierre (cerrado)

- `SignInScreen.tsx`: link "¿Olvidaste tu contraseña?" con
  `PressableOpacity` + `Text variant="bodySm" color="brand"`, `alignSelf:
'flex-end'`, entre el bloque de inputs y el botón primario — el
  `marginTop: spacing.xxl` que ya tenía `submit` (24px) queda como el
  espaciado botón↔link que pide `assets/brand/README.md:108` sin tocarlo.
- Docs: `PLAN_MOBILE_CERQUITA.md` (fila 7b → Construida, sacado el ítem del
  backlog post-MVP), `docs/phases/STATUS-AUDIT.md` (fila 7b actualizada,
  ítem de backlog correspondiente eliminado).
- **Gate de cierre de fase**: `pnpm exec tsc --noEmit` → limpio. `pnpm exec
jest --silent` (suite completa) → **61 suites, 333 tests, 0 fallos**.
  `pnpm lint` → 0 errores, 2 warnings preexistentes (mismos de la Fase 7a,
  `react-hooks/exhaustive-deps` sobre mocks de `useFocusEffect` en tests,
  no en código de producción).
