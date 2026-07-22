# Fase 1.5 — Social Login (Google + Apple vía Clerk)

Estado: **implementación completa, pendiente de verificación visual del usuario**

### Progreso

- **Checkpoint A** — cerrado. `expo-apple-authentication` instalado
  (`expo-doctor` 18/18); `app.config.ts` con el plugin y
  `ios.usesAppleSignIn: true`; `WebBrowser.maybeCompleteAuthSession()` en
  `app/_layout.tsx`. `SocialSignInButtons` (Google con el logo oficial
  multicolor vía `react-native-svg`, botón de Apple con
  `AppleAuthenticationButton` pero disparando `useSSO` —
  `Platform.OS === 'ios'` gatea su render) insertado en `SignInScreen` y
  `SignUpScreen`, reusando el mismo `formError`/`setFormError` de cada
  pantalla. Confirmado en el código real de `useSSO`
  (`node_modules/@clerk/clerk-expo/dist/hooks/useSSO.js`) que
  `redirectUrl` no hace falta pasarlo — Clerk lo arma internamente con
  `AuthSession.makeRedirectUri({path:'sso-callback'})`, y que la
  cancelación del usuario (`authSessionResult.type !== 'success'`) vuelve
  como `createdSessionId: null` sin excepción, nunca como error.
  `clerkErrorMessage.ts` suma `external_account_exists` y
  `oauth_access_denied`, confirmados contra el bundle de
  `@clerk/clerk-js` (mismo método que Fase 1). Gate: typecheck, lint,
  `pnpm test` (11 suites / 63 tests, sale limpio) y `expo-doctor` 18/18
  en verde.
- **Checkpoint B** — cerrado. `completeNameFlow.ts` (`saveNameAndRefreshToken`)
  orquesta `user.update({firstName})` → `getToken({skipCache:true})` →
  `refetch()` en ese orden estricto — **el test no solo asertó el orden de
  los mocks, sino que armó un `getToken` falso que simula el cache real de
  Clerk (token viejo hasta que se llama con `skipCache:true`) y verificó
  con el `request()`/`configureAuth` reales que el `Authorization` del
  reintento a `/auth/me` viaja con el token nuevo**, no el cacheado — se
  confirmó manualmente que el test falla si se invierte el orden
  (`refetch()` antes del `skipCache`), y vuelve a pasar al revertir.
  `CompleteNameScreen` (diseñada desde `TOKENS.md`, mismo criterio que
  `VerifyEmailScreen`: un campo, `KeyboardAwareScreen`, y un escape de
  "Cerrar sesión" para que nunca sea un dead-end). `AccountGate` extendido
  con dos ramas nuevas: proactiva (`!user?.firstName` → `CompleteNameScreen`
  antes de mirar `/auth/me`, sin esperar la query) y defensiva
  (`kind === 'validation'`, el único 400 documentado de `/auth/me` → misma
  pantalla, no el error genérico). Gate: typecheck, lint,
  `jest src/features/auth` (8 suites / 48 tests) en verde.
- **Gate final**: `pnpm lint`, `pnpm exec tsc --noEmit` y `pnpm test`
  (13 suites / 74 tests, sale limpio, sin cuelgues) en verde.
  `expo-doctor` 18/18. Falta la verificación visual del usuario (ver
  sección Verificación), con las conexiones de Google y Apple habilitadas
  en el dashboard de Clerk (credenciales dev, sin configuración adicional).

## Context

Fase 1 dejó email+password funcionando con Clerk. Agregar "Continuar con
Google" reduce fricción de registro — pero en cuanto se ofrece **un**
login de terceros, la App Store Review Guideline 4.8 de Apple exige que
"Sign in with Apple" se ofrezca como opción **equivalente**: mismo
tamaño/prominencia, con el asset oficial de Apple, y **Apple no soporta
"solo Android"** — en la práctica esto significa que si Google aparece,
Apple tiene que aparecer también en iOS (nunca en Android, ahí no
corresponde).

Esta fase agrega ambos botones a Sign In y Sign Up vía Clerk
(`@clerk/clerk-expo`), resuelve el caso crítico de contrato con el backend
(usuario de Apple que no comparte su nombre → claim `name` vacío → 400 en
`/auth/me`, la regla verificada en Fase 1), y dimensiona correctamente qué
depende de tener una cuenta de Apple Developer paga (Fase 9) vs qué se
puede construir y **probar de punta a punta ya, con credenciales dev de
Clerk**.

**Decisiones ya tomadas con el usuario** (no se re-discuten al implementar):

1. **Ambos proveedores vía `useSSO`** (OAuth basado en browser,
   `@clerk/clerk-expo`) — no `useSignInWithApple` (el hook nativo de
   Clerk sobre `expo-apple-authentication`). Motivo: Clerk sirve
   credenciales dev compartidas para `oauth_google` **y** `oauth_apple`
   sin necesitar cuenta propia — todo el flujo, incluido el caso crítico
   del nombre vacío con una cuenta de Apple real, se prueba end-to-end en
   el gate visual de esta fase. El flujo nativo de Apple
   (`useSignInWithApple`) necesita el Team ID real de Apple Developer
   configurado en Clerk — no es posible probarlo de punta a punta sin
   cuenta paga, ni siquiera con credenciales dev. **Se documenta como
   tarea explícita de Fase 9** la migración a nativo (ver sección
   correspondiente) — cambio aislado, mismo shape de retorno
   (`{createdSessionId, setActive, signIn, signUp}`) entre ambos hooks.
2. **El botón de Apple usa el asset oficial** de
   `expo-apple-authentication` (`AppleAuthenticationButton`) — el
   componente es solo visual (cumple la guideline de diseño de Apple,
   "system button... automáticamente aprobado por Apple"); su `onPress`
   dispara `useSSO` en vez del flujo nativo del propio componente. Esto es
   válido: Apple no exige el SDK nativo específico, exige el asset visual
   correcto y que el login realmente autentique contra Apple — que ocurre
   igual vía OAuth web (misma pantalla de consentimiento real de Apple,
   incluida la opción de no compartir el nombre).
3. **Caso crítico del claim `name` vacío**: gate proactivo en
   `AccountGate` + fallback defensivo. Antes de llamar `/auth/me`, se
   chequea `user.firstName` de Clerk (reactivo, sin red); si falta, se
   muestra una pantalla "Completá tu nombre" (diseñada desde
   `TOKENS.md`, mismo criterio que `VerifyEmailScreen` de Fase 1) que
   guarda con `user.update({firstName})` y fuerza un token fresco con
   `getToken({ skipCache: true })` — **confirmado que existe en el SDK
   instalado** (`GetTokenOptions` en `@clerk/shared`, usado por
   `@clerk/clerk-expo@2.19.31`) antes de reintentar. Si `/auth/me`
   igual devolviera 400 (`kind: 'validation'` — el único 400 documentado
   de ese endpoint es claims faltantes), la **misma pantalla** se muestra
   como red de seguridad, no el error genérico.

## Compatibilidad Expo Go / SDK 54 (verificado, no asumido)

- `@clerk/clerk-expo`'s `useSSO` usa `expo-web-browser` +
  `expo-auth-session` (ya instalados desde Fase 1) — sin módulos nativos
  nuevos, 100% Expo Go.
- `expo-apple-authentication` (nuevo): confirmado contra la documentación
  oficial de Expo — **"You can test this library in Expo Go on iOS
  without following any of the instructions above"** (los identificadores
  que devuelve difieren de un build real, pero el componente de botón y la
  interacción funcionan). Se instala vía `expo install` para fijar
  versión compatible con SDK 54, y se corre `expo-doctor` después (mismo
  procedimiento que Fase 1 con `expo-auth-session`/`expo-web-browser`).
- Nada de esto requiere development build — Expo Go sigue siendo la
  herramienta de verificación visual hasta Fase 5, sin cambios respecto al
  plan general.

## Configuración que hace el usuario

### En el dashboard de Clerk

1. **Google** (Social Connections → Google): habilitar. En desarrollo
   funciona de inmediato con las credenciales compartidas de Clerk — cero
   configuración en Google Cloud para probar.
2. **Apple** (Social Connections → Apple): habilitar como conexión OAuth
   estándar (la misma familia que Google, no la native/Team ID). En
   desarrollo, igual que Google: credenciales compartidas de Clerk,
   funciona de inmediato.
3. **Para producción — Google**: en el dashboard de Clerk, activar "Use
   custom credentials" en la conexión de Google. Clerk muestra ahí mismo
   el **redirect URI exacto** a copiar a Google Cloud Console (ver abajo).
   Pegar el Client ID / Client Secret que genera Google Cloud en esos
   campos.
4. **Para producción — Apple**: igual mecánica ("Use custom
   credentials"), pero acá **sí depende de la cuenta de Apple Developer**
   (ver sección Fase 9 — bloqueado, no es solo una config de Clerk).

### En Google Cloud Console (solo necesario para producción, no para probar en dev)

1. Crear/usar un proyecto, configurar la **OAuth consent screen** (External;
   scopes básicos de email/perfil — estos no requieren el proceso de
   verificación de Google, alcanza con publicar la consent screen).
2. Crear credenciales → **OAuth client ID → tipo "Web application"**
   (no "iOS" ni "Android" — el redirect real es contra el dominio de
   Clerk, que actúa de intermediario; así es como Clerk documenta la
   integración para cualquier plataforma, nativa incluida).
3. Agregar como "Authorized redirect URI" exactamente el que Clerk mostró
   en el paso 3 de arriba.
4. Copiar Client ID + Client Secret a Clerk.

**Nada de esto es necesario para el gate visual de esta fase** — es
trabajo de cuando se prepare la build de producción (Fase 9 checklist),
documentado acá para que quede a mano.

### Bloqueado hasta la cuenta de Apple Developer (Fase 9)

- **Credenciales de producción de Apple en Clerk** (Services ID + Team ID
  - Key ID + `.p8` de "Sign in with Apple", generados en Certificates,
    Identifiers & Profiles) — Apple, a diferencia de Google, no tiene una
    ruta gratuita a producción: el nivel dev-compartido de Clerk alcanza
    para probar, pero producción sí exige la cuenta paga. Esto aplica
    **incluso seguimos usando el flujo OAuth web** en vez del nativo.
- **Migración a `useSignInWithApple` (flujo nativo)**: requiere Bundle ID
  con la capability "Sign In with Apple" registrada en un Team real —
  imposible sin la cuenta. Tarea explícita de Fase 9: cambiar el
  `onPress` del botón de Apple de `useSSO({strategy:'oauth_apple'})` a
  `useSignInWithApple().startAppleAuthenticationFlow()` — cambio acotado,
  mismo shape de retorno, sin tocar `AccountGate` ni el resto del flujo.

## Decisiones de arquitectura (senior FE, 1 línea c/u)

- **Un solo componente `SocialSignInButtons`** en
  `src/features/auth/components/`, usado igual en `SignInScreen` y
  `SignUpScreen` — la lógica de OAuth de Clerk no distingue "iniciar
  sesión" de "registrarse" (un mismo flujo cubre cuenta nueva o
  existente), así que duplicarlo por pantalla sería puro código muerto.
- **Botón de Google con el logo oficial** ("G" multicolor, SVG inline vía
  `react-native-svg`, ya instalado) — mismo rigor visual que el botón de
  Apple, no una aproximación.
- **`AppleAuthenticationButton` renderizado, oculto en Android**
  (`Platform.OS === 'ios'`) — nunca se muestra Apple fuera de iOS,
  como pide la guideline.
- **`CompleteNameScreen` vive en `screens/`** (no `components/`) —
  mismo criterio que `SuspendedScreen`: es una pantalla completa que
  `AccountGate` decide renderizar, no un componente reusable.
- **`WebBrowser.maybeCompleteAuthSession()`** se llama una vez a nivel de
  módulo en `app/_layout.tsx` (junto a `SplashScreen.preventAutoHideAsync()`)
  — patrón estándar de Expo AuthSession, inocuo en nativo, necesario para
  cerrar sesiones de browser colgadas en algunos casos.
- **`useWarmUpBrowser`** (helper de `expo-web-browser`, `warmUpAsync`/
  `coolDownAsync` en un `useEffect`) vive local a `SocialSignInButtons.tsx`
  — no se extrae a `shared/` porque es plomería específica de OAuth, un
  solo lugar de uso.

## Checkpoints

### Checkpoint A — Dependencias, plomería OAuth, botón de Google

- `pnpm exec expo install expo-apple-authentication` + `expo-doctor`
  (mismo procedimiento de verificación que Fase 1).
- `app.config.ts`: agregar `'expo-apple-authentication'` a `plugins`, y
  `ios: { usesAppleSignIn: true }` (config nativa, inocua en Expo Go,
  necesaria para cuando Fase 9 haga el build real).
- `app/_layout.tsx`: `WebBrowser.maybeCompleteAuthSession()` a nivel de
  módulo.
- `src/features/auth/components/SocialSignInButtons.tsx` (+ test): botón
  de Google (SVG oficial + `useSSO({strategy:'oauth_google'})`), divisor
  "O", manejo de error con `getClerkErrorMessage`. Apple se agrega en
  Checkpoint B pero el componente ya queda armado para recibirlo.
- `clerkErrorMessage.ts`: agregar códigos de error de OAuth **confirmados
  contra el bundle de `@clerk/clerk-js`** (mismo método que Fase 1 — no
  se adivinan códigos), típicamente algo como cuenta ya existente con otro
  método, cancelación del usuario, etc. — la lista exacta se confirma al
  implementar.
- Insertar `<SocialSignInButtons />` en `SignInScreen` (entre el botón
  "Iniciar sesión" y el link "Crear cuenta") y `SignUpScreen` (después del
  botón "Crear cuenta").
- Gate: typecheck + `jest src/features/auth`.

### Checkpoint B — Botón de Apple + fix del claim `name` vacío

- `SocialSignInButtons.tsx`: agregar `AppleAuthenticationButton`
  (`buttonStyle: BLACK` — contraste correcto sobre el fondo claro del
  theme, `buttonType: CONTINUE` para calzar con "Continuar con Apple"),
  oculto fuera de iOS, `onPress` → `useSSO({strategy:'oauth_apple'})`.
- `src/features/auth/screens/CompleteNameScreen.tsx` (+ test): un campo
  "Nombre" (`TextField` + `KeyboardAwareScreen`, mismo patrón que
  `VerifyEmailScreen`), botón "Continuar". `onSubmit`:
  `user.update({firstName})` → `getToken({skipCache:true})` → notifica a
  `AccountGate` para reintentar. Test de la secuencia completa: update →
  token fresco → `/auth/me` ok (mocks en orden, assert de que el refetch
  ocurre después de ambos awaits).
- `AccountGate.tsx`: nueva rama al principio — `useUser()` +
  `hasName = Boolean(user?.firstName)`; si `!hasName`, renderiza
  `CompleteNameScreen` (con el handler de guardado) antes de mirar el
  resultado de `/auth/me`. Nueva rama defensiva: `kind === 'validation'`
  (el único 400 documentado de `/auth/me`) → misma `CompleteNameScreen`,
  no el error genérico de "Reintentar". Tests actualizados cubriendo
  ambas ramas nuevas.
- Gate: typecheck + `jest src/features/auth`.

### Cierre de fase

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test` (suite completa) y
  `expo-doctor` en verde.
- Este archivo actualizado con progreso real por checkpoint (mismo
  formato que Fase 1).

## Archivos clave

- Crear: `src/features/auth/components/SocialSignInButtons.tsx` (+test),
  `src/features/auth/screens/CompleteNameScreen.tsx` (+test).
- Modificar: `app.config.ts`, `app/_layout.tsx`,
  `src/features/auth/components/AccountGate.tsx` (+test),
  `src/features/auth/clerkErrorMessage.ts` (+test),
  `src/features/auth/screens/SignInScreen.tsx`,
  `src/features/auth/screens/SignUpScreen.tsx`, `package.json`/
  `pnpm-lock.yaml` (nueva dependencia).
- Reusar tal cual: `KeyboardAwareScreen`, `TextField`, `Button`, `Text`,
  `theme` (`src/shared/ui/`), `configureAuth`/`ApiRequestError`
  (`src/shared/api/`).

## Verificación

- **Automática**: typecheck + tests por checkpoint; suite completa +
  lint + `expo-doctor` al cierre.
- **Visual del usuario** (Expo Go, con las conexiones dev de Clerk
  habilitadas para Google y Apple):
  1. "Continuar con Google" desde Sign In y Sign Up → cuenta nueva y
     existente, sesión persistida.
  2. "Continuar con Apple" (solo visible en iOS) → cuenta nueva y
     existente.
  3. **El caso crítico**: probar Apple sin compartir el nombre (opción
     real del consentimiento de Apple) → debe aparecer "Completá tu
     nombre", guardar, y entrar normalmente al Home sin error 400.
  4. Confirmar que en Android el botón de Apple no aparece en absoluto.
  5. Confirmar visualmente que ambos botones cumplen tamaño/prominencia
     equivalente.

## Notas de git / permisos

- Rama `phase-1.5-social-login` creada desde `main` al aprobar este plan
  (confirmado con el usuario — el repo estaba en `main`, la rama no
  existía todavía). No se decide ni cambia de rama más allá de esto. El
  push y el PR son del usuario.
- No se crean/leen archivos `.env*` (denegados). No `eas build/submit`.
- Commits: conventional (`feat(auth): social sign-in buttons`,
  `feat(auth): complete-name gate for empty Apple claim`), sin trailer de
  co-autoría.
