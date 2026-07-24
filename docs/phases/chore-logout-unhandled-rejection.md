# Chore: fix del unhandled rejection "You are signed out" (2da instancia, backlog Fase 5)

### Progreso

- **Diagnóstico hecho, con evidencia de código (no supuesto)**: no era
  `src/shared/api/client.ts` (`requestRaw`) — ya estaba bien blindado desde
  la Fase 5 (el `try/catch` alrededor de `getAuthToken()` cubre cualquier
  rechazo y cae a `token = null`, dejando que el backend responda `401` con
  un `ApiRequestError` tipado). Verificado además contra el código real de
  `createGetToken` en `@clerk/clerk-react`
  (`node_modules/@clerk/clerk-react/dist/chunk-3EQWAEPK.mjs`): con la sesión
  ya en `null`, `getToken()` resuelve `null` sin rechazar — el rechazo real
  solo puede pasar en la ventana de transición (sesión terminando, todavía
  no `null`).
  - El call site real: `src/features/auth/hooks/useLogout.ts`. Su
    `try/catch` solo cubría el des-registro de FCM ("best-effort, nunca
    bloquea el logout"); `cancelQueries`/`clear`/`signOut()` quedaban sin
    protección. Ningún caller atrapa la promesa que devuelve `useLogout()`
    (la usan fire-and-forget): `AccountGate.tsx:34` (auto-logout en 401) y
    `ProfileScreen.tsx` (`handleLogout`, tap manual — heredado tal cual de
    la implementación original en `HomeScreen.tsx` de Fase 5).
  - Mecanismo de disparo concreto, no solo teórico: `ProfileScreen`'s
    `Pressable` no tiene guard de doble-tap ni estado de carga — un segundo
    tap mientras el primer `logout()` sigue en vuelo dispara un segundo
    `signOut()` concurrente, coherente con "You are signed out" viniendo de
    Clerk al pisarse dos cierres de sesión. `useLogout()` se llama desde dos
    componentes distintos (`AccountGate` + `ProfileScreen`), así que un
    guard por-instancia (`useRef`) no alcanzaría.
- **Fix implementado y gate en verde**: `src/features/auth/hooks/useLogout.ts`
  suma (a) un `try/catch` externo que garantiza que la promesa devuelta
  nunca rechaza (el interno de FCM se mantiene igual, sigue siendo
  best-effort) y (b) un guard de concurrencia a nivel módulo (`isLoggingOut`,
  fuera del hook — no un `useRef`, por la razón de arriba). No se tocó
  `client.ts` ni los call sites en `AccountGate`/`ProfileScreen` — dejan de
  necesitar cambios una vez que `useLogout()` no rechaza nunca.
  - Tests nuevos en `useLogout.test.tsx`, reusando el detector real
    (`process.on('unhandledRejection', ...)`) que ya existía ahí para el
    bug original: `signOut()` rechazando no filtra nada, y dos invocaciones
    concurrentes solo ejecutan `signOut()` una vez.
  - Gate: `tsc --noEmit` limpio, `pnpm run lint` limpio, suite completa
    **46/46 -- 234/234 tests**.
- Commit único ya hecho en la rama `fix-logout-unhandled-rejection`
  (`fix(auth): never let useLogout() reject...`). Este documento + el
  cambio de `CLAUDE.md` (regla nueva: toda unidad de trabajo produce su
  plan file en `docs/phases/`, ver commit de este chore) se suman al mismo
  commit. **Pendiente**: tu confirmación para push + PR.

## Context

Documentado en el cierre de la Fase 5 (`docs/phases/phase-5-tracking.md`,
sección "Backlog — fuera de esta fase"): una segunda instancia del mismo
síntoma que el race de logout ya arreglado ahí (`useLogout.ts` + `client.ts`,
Checkpoint C), pero desde un call site distinto, explícitamente diferida para
una sesión aparte con la instrucción explícita de no asumir que es el mismo
call site que la vez anterior. Observado en dev (iOS): tras un `signOut`, la
consola tira `Uncaught (in promise) e: You are signed out` con stack
apuntando a `baseFetch → getToken` de Clerk.

Rama propia desde `main` actualizado — `chore-app-icon` (chore anterior, en
paralelo) no se toca en ningún momento de este trabajo, tiene builds EAS
corriendo desde su propio estado.

## Alcance

Un solo archivo de código (`useLogout.ts`) + su test. Sin cambios de UI, sin
cambios nativos/config — JS puro, llega al dev client con un reload de
Metro, sin rebuild.

## Fix

En `src/features/auth/hooks/useLogout.ts`:

1. **Guard de concurrencia a nivel módulo** (mismo patrón que el seam
   `getAuthToken`/`configureAuth` de `client.ts` — una variable `let` fuera
   del hook): una segunda invocación mientras hay un logout en curso es un
   no-op inmediato. Se resetea en `finally`.
2. **`try/catch` externo** envolviendo `cancelQueries`/`clear`/`signOut()`
   (el interno de FCM se mantiene intacto) — cualquier falla ahí se loguea
   `__DEV__`-only en vez de dejar rechazar la promesa que `useLogout()`
   devuelve.

## Tests

`src/features/auth/hooks/useLogout.test.tsx`, dos casos nuevos:

1. `signOut()` rechazando no produce un unhandled rejection (mismo detector
   real que el test ya existente del race de FCM).
2. Llamar al `logout` devuelto dos veces en paralelo invoca `signOut()` una
   sola vez (confirma el guard de concurrencia).

## Verificación

- **Automática (hecha)**: `pnpm exec jest src/features/auth/hooks/useLogout.test.tsx`
  → 4/4; suite completa → 46/46 suites, 234/234 tests; `tsc --noEmit` y
  `pnpm run lint` limpios.
- **Visual (usuario, pendiente)**: nada que verificar más allá de un logout
  normal (y, si querés forzarlo, un doble-tap rápido en "Cerrar sesión")
  sobre el dev client ya instalado — sin rebuild nativo necesario.

## Archivos clave

- Modificado: `src/features/auth/hooks/useLogout.ts`,
  `src/features/auth/hooks/useLogout.test.tsx`.
- No tocados (a propósito, ya estaban bien o dejan de necesitar cambios):
  `src/shared/api/client.ts`, `src/features/auth/components/AccountGate.tsx`,
  `src/features/profile/screens/ProfileScreen.tsx`.
- Este chore también actualiza `CLAUDE.md` (regla nueva de plan files para
  toda unidad de trabajo) — cambio permanente de proceso, no del fix en sí,
  pedido explícitamente para entrar en el mismo commit.

## Git

Rama `fix-logout-unhandled-rejection`, desde `main` actualizado. Un commit
(`fix(auth): ...`), conventional. Push y PR solo con confirmación explícita
del usuario — todavía no se pusheó.
