# Fase 0 — Scaffold (cerquita-app)

Estado: **completa, pendiente de verificación visual en Expo Go**

Los 4 checkpoints están cerrados con lint/typecheck/test verdes (20 tests).
Ver el resumen de cierre en el historial de commits de esta rama. Queda
pendiente únicamente la verificación visual del usuario en Expo Go (ver
sección Verificación) antes de abrir el PR.

## Context

El repo `cerquita-app` está en verde pero vacío de código: solo `docs/`,
`CLAUDE.md`, `PLAN_MOBILE_CERQUITA.md`, `docs/design/TOKENS.md`,
`docs/API_CONTRACT.md` y `.claude/settings.json` (que fija **pnpm** como
package manager, allowlist de comandos y un hook de prettier). No hay
`package.json` ni `src/`.

Esta fase establece la fundación técnica de la app customer: proyecto Expo

- TypeScript strict, tooling de calidad (ESLint/Prettier/Husky/lint-staged),
  CI por PR, el **theme** derivado 1:1 de `TOKENS.md`, la estructura de
  carpetas por feature, y el **API client base** con inyección de
  `Authorization` y mapeo de errores del contrato — todavía sin login real que
  lo alimente (eso es Fase 1). El gate es que la app arranca en Expo Go
  mostrando una pantalla de prueba con el theme aplicado (verificación visual
  del usuario), con lint/typecheck/test verdes y el CI corriendo en el primer PR.

Solo se instalan las dependencias del stack cerrado que **esta** fase
necesita. Clerk, TanStack Query, Zustand, FlashList, expo-image, etc. los
instala su propia fase (YAGNI). Decisión confirmada con el usuario: **Expo
Router se incluye en Fase 0** (define el entry point, la carpeta `app/` y
trae safe-area-context; la Fase 1 solo agrega rutas, sin re-armar el shell).

## Dependencias a instalar (solo lo que la fase necesita)

Runtime (vía `expo install` para versiones compatibles con el SDK):

- `expo`, `react`, `react-native` (scaffold base)
- `expo-router` + `react-native-safe-area-context`, `react-native-screens`
  (navegación/shell — vienen juntos con el template de router)
- `expo-font`, `@expo-google-fonts/inter` (Inter 400/500/600/700 embebida — el
  theme es "bold-first", no se carga por link externo)
- `expo-splash-screen` (mantener splash hasta que carguen las fuentes)
- `expo-constants` (leer base URL del API desde `extra`)

Dev:

- `typescript`, `@types/react`
- `eslint`, `eslint-config-expo`, `eslint-config-prettier`, `prettier`
- `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`
- `husky`, `lint-staged`

No se agrega `babel-plugin-module-resolver`: los path aliases (`@/*`) se
resuelven con `experiments.tsconfigPaths` de Expo Router.

## Configuración base

**pnpm + Metro (gotcha crítico)**: crear `.npmrc` con `node-linker=hoisted`.
El linker simbólico por defecto de pnpm rompe la resolución de módulos nativos
de Metro/RN; `hoisted` es el modo soportado por Expo con pnpm. Sin esto los
builds fallan de forma confusa.

**`app.config.ts`**: config de Expo en TS. `extra.apiUrl` leído desde
`process.env.EXPO_PUBLIC_API_URL` con fallback de dev. `experiments.tsconfigPaths: true`,
scheme para deep links (lo usará Clerk en Fase 1), plugin `expo-router`,
`newArchEnabled` en el default del SDK. Base URL **nunca** hardcodeada.

- Nota: no se crean archivos `.env*` (denegados por permisos). El uso del env
  var `EXPO_PUBLIC_API_URL` se documenta en el reporte de cierre; el usuario
  crea su `.env` local. El fallback de dev permite arrancar sin `.env`.

**`tsconfig.json`**: extiende `expo/tsconfig.base`, `strict: true`,
`paths: { "@/*": ["./src/*"] }`, incluye `app/` y `src/`.

**`eslint.config.js`** (flat config): `eslint-config-expo` +
`eslint-config-prettier` al final. Regla anti-`any` alineada con CLAUDE.md.

**`.prettierrc`**: config mínima consistente con el hook ya existente.

**`jest.config.js`**: preset `jest-expo`, `setupFilesAfterEnv` con
`@testing-library/react-native`, `transformIgnorePatterns` estándar para RN.

**Husky + lint-staged**: `.husky/pre-commit` → `pnpm exec lint-staged`;
`lint-staged` corre `eslint --fix` + `prettier --write` sobre staged.
`"prepare": "husky"` en scripts.

**Scripts en `package.json`**: `start`, `android`, `ios`, `lint`,
`typecheck` (`tsc --noEmit`), `test` (`jest`), `prepare`.

**CI — `.github/workflows/ci.yml`**: trigger `pull_request`. Job en
`ubuntu-latest`, node 20, `pnpm/action-setup@v4` + cache pnpm. Pasos:
`pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` →
`pnpm test -- --ci`. (lint + typecheck + test, exactamente el gate del plan.)

## Theme — `src/shared/ui/theme.ts`

Traducción **1:1 de `TOKENS.md`** a tokens tipados de RN (`as const`), no CSS
copiado. Un solo objeto `theme` (o módulos `colors`/`typography`/`radius`/
`spacing` reexportados) con tipos derivados.

- **`colors`**: `brand` (default `#6C4CF1`, pressed `#573BD1`, dark `#3B2A9E`,
  tint `#EDE9FC`, tintStrong `#C3B8F0`, soft `#8A6FF4`), `surface`
  (default/subtle/warm/mutedAlt), `text` (primary `#241C19`, secondary
  `#9A9A9A`, onBrand `#FFFFFF`), `border` (default/strong), `success`
  (default/bg), `danger.default`. Overlays rgba como helpers/constantes.
- **`typography`**: familias Inter por peso
  (`Inter_400Regular/500Medium/600SemiBold/700Bold`) y la escala semántica
  de TOKENS.md (`caption` 11 … `display` 28) con `fontSize`, `lineHeight`,
  `fontFamily` y `weight`. **Default de cuerpo peso 600** (la UI es
  bold-first, tal como observa el doc), no 400.
- **`radius`**: `sm` 8, `md` 12, `lg` 14, `xl` 18, `full` 9999.
- **`spacing`**: `xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 20, `xxl` 24,
  `xxxl` 32, + `screenPadding` 16.

## Fuentes (arranque)

En el layout raíz (`app/_layout.tsx`): `useFonts` de
`@expo-google-fonts/inter` cargando los 4 pesos; `SplashScreen.preventAutoHideAsync()`
al inicio y `hideAsync()` cuando las fuentes están listas — sin flash de
fuente del sistema. El theme referencia esos `fontFamily`.

## Componentes base — `src/shared/ui/` (mínimos, solo para probar el theme)

Sin design system especulativo. Solo dos, con la escala del theme:

- **`Text.tsx`**: envuelve `RN.Text`; prop `variant` (mapea a la escala
  tipográfica), `color` (de `theme.colors.text`), default `body.md` / peso 600. Presentacional.
- **`Button.tsx`**: variante primaria (fondo `brand.default`, texto
  `onBrand`, `radius.md`), estado pressed (`brand.pressed`), `disabled` y
  `loading` (`ActivityIndicator`), `minHeight`/`minWidth` ≥ 44 (touch target
  del plan), `accessibilityRole="button"`. Tiene comportamiento → **test RNTL**
  (onPress, no dispara si disabled/loading).

Más componentes (Card, Input, EmptyState, Skeleton) se extraen cuando su
feature los necesite, no ahora.

## API client base — `src/shared/api/`

La única puerta al backend. Todavía sin Clerk (Fase 1) → seam limpio para el
token.

- **`types.ts`**: espeja del contrato **solo lo transversal** que ya se usa
  (envelope de paginación cursor `{ data, nextCursor, hasNextPage }`, las dos
  formas de error del contrato, enums compartidos como `UserStatus`/`Role`).
  Los DTOs por feature (marketplace, orders, etc.) los agrega su fase para no
  dejar código muerto.
- **`errors.ts`**: `ApiError` como **unión discriminada** por `kind`
  (`unauthorized` | `suspended` | `reRegisterBlocked` | `forbidden` |
  `notFound` | `conflict` | `validation` | `rateLimited` | `network` |
  `server` | `unknown`), conservando `status`, `code`/`message`/`details`
  del body. `mapError(status, body)` clasifica según el contrato de errores:
  401→unauthorized; 403 con `"User is suspended"`→suspended vs forbidden;
  404→notFound; 409→conflict (llevando `code`/`message` para que el feature
  distinga re-registro vs transición de pedido); 400→validation; 429→
  rateLimited; 5xx→server. **Lógica no trivial → test unitario** que cubra
  cada rama, incluida la discriminación de 403 suspended por mensaje.
- **`client.ts`**: `request<T>()` que arma `<baseUrl>/api/v1<path>`, inyecta
  `Authorization: Bearer <token>` vía un **provider de token inyectable**
  (`configureAuth(getToken)`; en Fase 0 devuelve `undefined`, Fase 1 lo
  cablea a Clerk), `Content-Type: application/json`, parsea JSON, lanza
  `ApiError` (vía `mapError`) en no-2xx, maneja `304` (sentinela para el
  polling de la Fase 5) y errores de red → `kind: 'network'`. Base URL desde
  `Constants.expoConfig.extra.apiUrl`. Ningún `fetch` suelto fuera de acá.
- `index.ts` reexporta la superficie pública.

## Estructura de carpetas por feature

```
app/
  _layout.tsx          # carga de fuentes + splash + Stack
  index.tsx            # pantalla de prueba del theme (temporal, la reemplaza Fase 2)
src/
  features/            # auth, marketplace, cart, checkout, orders,
                       # reviews, feedback, profile — creadas con .gitkeep
  shared/
    api/               # client.ts, types.ts, errors.ts, index.ts
    ui/                # theme.ts, Text.tsx, Button.tsx, index.ts
    hooks/             # .gitkeep (transversales, se llena por demanda)
```

Los directorios de feature vacíos llevan `.gitkeep` solo para fijar la
convención (no código muerto).

## Pantalla de prueba — `app/index.tsx`

`ScrollView` dentro de `SafeAreaView` que muestra: cada variante tipográfica
del theme (para verificar que Inter cargó y la escala es correcta), swatches
de los colores de marca/superficie/texto/estado, y `Button` en sus estados
(default, disabled, loading). Es el gate visual; presentacional, sin test.
Se reemplaza por el Home real en la Fase 2.

## Checkpoints

Por ser >4 entregables, agrupados. Al cerrar cada uno: typecheck + tests
afectados + reporte de una línea.

1. **Scaffold + tooling**: proyecto Expo (con router), `.npmrc`,
   `app.config.ts`, `tsconfig` strict, ESLint/Prettier, Husky/lint-staged,
   `jest.config`, scripts, CI workflow. Gate: `pnpm lint` y
   `pnpm typecheck` verdes en un scaffold mínimo.
2. **Theme + fuentes + componentes base**: `theme.ts`, carga de Inter en
   `_layout.tsx`, `Text`, `Button` (+ test de Button). Gate: typecheck +
   `jest src/shared/ui`.
3. **API client base**: `types.ts`, `errors.ts` (+ test del mapper),
   `client.ts`, `index.ts`, estructura de carpetas de feature. Gate:
   typecheck + `jest src/shared/api`.
4. **Pantalla de prueba + gate de fase**: `app/index.tsx`, suite completa
   una vez (`pnpm test`), lint + typecheck finales.

## Verificación

- **Automática (Claude)**: `pnpm lint`, `pnpm exec tsc --noEmit`,
  `pnpm test` (suite completa como gate de cierre). Tests unitarios de
  `mapError` (todas las ramas del contrato) y de `Button` (onPress /
  disabled / loading).
- **CI**: al abrir el PR de la fase, el workflow corre lint + typecheck +
  test — parte del gate.
- **Visual (usuario, en Expo Go)**: `pnpm start` → abrir en Expo Go. Debe
  verse la pantalla de prueba con:
  1. Tipografía **Inter** aplicada (no la fuente del sistema) en toda la
     escala, cuerpo en peso 600.
  2. Los colores de marca/superficie/estado tal cual TOKENS.md.
  3. El `Button` primario con su color de marca, estado pressed al tocar,
     y los estados disabled/loading.
     Sin pantallas en blanco ni flash de fuente del sistema al arrancar.

## Notas de git / permisos

- Rama actual `phase-0-scaffold` (ya creada por el usuario) — no se decide ni
  cambia de rama. El push y el PR son del usuario.
- No se crean/leen archivos `.env*` (denegados). No `eas build/submit`.
- Commits: conventional (`chore(scaffold): ...`, `feat(ui): theme + base
components`, `feat(api): base client + error mapping`).
