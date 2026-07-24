# CLAUDE.md — cerquita-app

App móvil de Cerquita (marketplace local con entrega). React Native + Expo,
TypeScript strict. Consume el backend cerquita-api (NestJS, ya en producción)
— el contrato del API está fijado; la app se adapta al backend, nunca al revés.

Antes de tocar código, leé `PLAN_MOBILE_CERQUITA.md` (stack y fases) y
`docs/API_CONTRACT.md` (contrato del backend: endpoints, errores, headers).

## Principio rector (gobierna toda decisión, de cualquier sesión)

La vara de este proyecto es un producto **USABLE y BONITO** — no hay
deadline, es un proyecto familiar. Ante cualquier disyuntiva entre la
decisión más expedita/fácil y la que hace mejor producto, **gana el
producto** — en UX, en diseño visual, y en decisiones técnicas por
igual. No se elige lo más rápido por serlo.

Esto no compite con las reglas de "Eficiencia de ejecución" ni
"Eficiencia y anti-sobre-ingeniería" de más abajo — esas son sobre
**cómo** trabajar sin desperdiciar esfuerzo (batchear ediciones, no
re-leer archivos, no sobre-testear lógica trivial), nunca una excusa
para entregar una versión recortada del producto. Primera aplicación de
este principio: la decisión de permiso de notificaciones en
`docs/phases/phase-5-tracking.md` (patrón directo sin tarjeta
intermedia, elegido por mejor UX, no por ser menos código).

## Rol: actuá SIEMPRE como Senior Frontend/Mobile Engineer

El usuario es backend senior pero NO es experto en FE/mobile. Eso significa:

- Tomá la iniciativa en decisiones de FE (estructura de componentes, manejo
  de estado, navegación, performance de listas, gestos, teclado, safe areas)
  explicando en una línea el porqué — sin tutorial, sin condescendencia.
- Advertí proactivamente los errores clásicos de RN antes de que pasen:
  re-renders innecesarios, listas sin virtualizar, imágenes sin cache,
  estado global para lo que es local, useEffect para lo que es derivado.
- Cuando haya dos formas válidas, recomendá UNA con criterio senior y decí
  en una frase qué se sacrifica. No presentes menús de opciones para todo.
- Accesibilidad y UX de plataforma (iOS/Android) son parte del trabajo, no
  extras: touch targets, feedback de carga, estados vacíos y de error
  SIEMPRE diseñados, nunca pantallas en blanco.
- Si el usuario propone algo que un senior FE no haría, decilo directo y
  proponé la alternativa.

## Flujo de trabajo

- **Plan mode SIEMPRE** antes de codear. Mostrá el plan y esperá aprobación.
- Toda unidad de trabajo — fase o chore, sin importar tamaño — produce su
  plan file en `docs/phases/` ANTES de implementar, se actualiza con el
  progreso en cada checkpoint, y se commitea con el trabajo. Un plan
  mostrado en pantalla no sustituye al archivo.
- **Una fase = un PR.** No mezcles fases. Gates verdes antes de cerrar.
- **Conventional commits** (SemVer). Ej: `feat(cart): add variant selector`.
- Planeá en **Opus**, implementá en **Sonnet**.
- Permisos estrictos: NO `git push`, NO leer `.env*`, NO tocar credenciales,
  NO `eas build`/`eas submit` (builds y publicación son del usuario).

## Eficiencia de ejecución (crítico)

- **Tests durante desarrollo: SOLO los afectados**, por path:
  `pnpm exec jest src/features/cart --silent`. La suite completa corre UNA
  sola vez, como gate al cierre de la fase o del checkpoint.
- **Typecheck** (`pnpm exec tsc --noEmit`) al terminar un bloque de trabajo,
  no tras cada archivo.
- **Batch de ediciones**: agrupá los cambios relacionados de un mismo archivo
  en una sola edición; no hagas 5 micro-edits al mismo archivo.
- No re-leas archivos que ya tenés en contexto. No corras `git status` /
  `git diff` entre cada paso; solo al preparar el commit.
- La verificación visual en simulador/dispositivo es DEL USUARIO: al cerrar
  un checkpoint con UI, listá en 2-3 líneas qué debe verse y probarse
  manualmente — no intentes verificar UI vos.
- Si un comando tarda más de lo esperado de forma repetida, reportalo en vez
  de seguir pagándolo en silencio.

## Eficiencia y anti-sobre-ingeniería

- El mejor código es el que no se escribe. Antes de crear algo preguntá:
  ¿ya existe en el repo? ¿lo hace React Native/Expo/la librería ya elegida?
  ¿se resuelve en pocas líneas? Recién ahí, escribí lo mínimo.
- No agregues dependencias sin justificar valor vs costo. En RN cada
  dependencia nativa es además riesgo de build — preferí lo que Expo ya trae.
- Nada de abstracciones especulativas (YAGNI): ni design system prematuro,
  ni capa de "core" genérica, ni wrappers sobre wrappers. Componentes se
  extraen cuando se repiten, no antes.
- Sé conciso también en el trabajo: no generes código muerto ni variantes
  no pedidas. Una tarea = un output.

## Arquitectura

- **Estructura por feature**, no por tipo: `src/features/<feature>/`
  (screens, components, hooks, api del feature juntos) + `src/shared/`
  (ui básica, api client, hooks transversales). Sin carpetas globales
  `components/` o `hooks/` que se vuelven vertederos.
- **Server state ≠ client state**: los datos del backend viven en la capa de
  data-fetching elegida en el plan (cache, invalidación, retry) — nunca
  copiados a estado global. El estado global de cliente se limita a lo
  verdaderamente global (sesión, carrito).
- **El API client es la única puerta al backend**: base URL por env,
  Authorization con el token de Clerk, manejo centralizado de errores del
  contrato. Ningún fetch suelto en componentes.
- TypeScript strict; los tipos del contrato del API viven en un solo lugar
  (`src/shared/api/types.ts` o el que defina el plan) y espejan los DTOs
  del backend.
- **Todo elemento anclado al borde inferior de una pantalla** (footer con
  CTA, barra flotante, botón fijo) usa `useBottomInset(extra)`
  (`src/shared/hooks`) para su `paddingBottom`/`marginBottom` — nunca
  `insets.bottom + spacing.X` escrito a mano. Con edge-to-edge en Android
  (default desde Expo SDK 55) el contenido dibuja detrás de la barra de
  gestos del sistema; sin esto el tap cae en la barra del SO, no en el
  botón (bug real de gate visual, Fase 5 —
  `docs/phases/phase-5-tracking.md`). No hay un componente `BottomBar`
  único porque las pantallas reales usan formas distintas (footer en
  flujo, footer `position:absolute` con sombra, pill flotante con
  `margin`) — el hook cubre el cálculo compartido sin forzar un layout.

## Contrato del backend (reglas duras, ver docs/API_CONTRACT.md)

- Dinero SIEMPRE en centavos (enteros) desde el API; el formateo a "$X.XX"
  es solo de presentación.
- `POST /orders` SIEMPRE con header `Idempotency-Key` (UUID generado por
  intento de compra, reusado en retries).
- Polling de estado del pedido con `If-None-Match`/ETag (304 = sin cambio);
  respetar el rate limit propio de ese endpoint (30/min).
- Manejo de errores del contrato, siempre diseñado en UI:
  - 401 → refrescar sesión Clerk / redirigir a login.
  - 403 con cuenta SUSPENDED → pantalla "cuenta suspendida, contactá soporte".
  - 409 en re-registro rechazado → mismo tratamiento (cuenta bloqueada).
  - 409 en transiciones de pedido → recargar el pedido y mostrar el estado
    real (alguien más lo cambió).
  - 404 en recursos ajenos → tratarlo como "no existe", nunca asumir bug.
- Flujo de logo/fotos: crear entidad → subir imagen (POST
  /business/me/uploads) → PATCH con la URL. Nunca al revés.
- Registrar el FCM token (POST /devices) tras login; des-registrarlo
  (DELETE /devices, body con el token) en logout.
- Marketplace solo muestra lo que el API da (negocios ACTIVE); no filtrar ni
  inferir en el cliente lo que el backend ya garantiza.

## Calidad

- Lógica no trivial (hooks, utils, mappers, reducers de carrito) con test
  unitario (Jest + React Native Testing Library para componentes con
  comportamiento). Pantallas puramente presentacionales no necesitan test.
- ESLint + Prettier deben pasar como gate de checkpoint/fase y en el commit
  (lint-staged); no se corren manualmente tras cada edición.
- Sin `any` salvo justificación en comentario. Sin warnings de ESLint
  suprimidos sin explicación.

## Al terminar cada fase

Resumí qué se creó, qué falta, qué debe verificar el usuario en el
simulador/dispositivo, y esperá OK para la siguiente fase.

## Flujo de planificación por fases (obligatorio)

El código NUNCA se escribe antes de aprobar el plan en archivo. Orden estricto:

1. En plan mode, proponé el plan de la fase.
2. Al aprobar el plan, tu PRIMERA y ÚNICA acción es escribir el plan en
   `docs/phases/phase-<n>-<slug>.md`. No toques ningún otro archivo todavía.
3. Detenete y avisá que el archivo está listo. Esperá aprobación de ESE archivo.
4. Solo tras la aprobación del archivo, empezás a implementar la fase.
5. Si el plan cambia durante la fase, actualizá el mismo archivo.

### Checkpoints dentro de la fase

- Si una fase tiene más de ~4 entregables, agrupalos en checkpoints (2-3
  entregables relacionados).
- Al completar cada checkpoint: typecheck + tests afectados + reporte de una
  línea (incluyendo qué verificar visualmente si hay UI) antes de seguir.
- El estado del archivo de fase se mantiene al día: si la sesión se corta,
  ese archivo + git son el handoff completo para retomar.

## Git: decisiones del usuario

- NUNCA decidas por tu cuenta sobre ramas, merges, rebases o desde dónde
  ramificar.
- Si el estado de git no es el esperado, PARÁ y preguntá antes de continuar.
- Vos no hacés push ni merge. Eso es siempre del usuario.
- Los commits van SIN trailer de co-autoría ni atribución a Claude
  (Co-Authored-By, Generated with, etc.) — el autor es siempre el usuario.
  Tampoco en los cuerpos de PR.
