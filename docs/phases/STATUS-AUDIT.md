# Auditoría de estado — cerquita-app

Fecha: 2026-07-24. Sesión de auditoría, sin cambios de código. Fuente: `PLAN_MOBILE_CERQUITA.md`
completo (incluida la tabla de paridad y el backlog post-MVP), `docs/API_CONTRACT.md`,
los 11 archivos de `docs/phases/`, `git log` (ramas y merges reales), y grep sobre
`src/`/`app/` (TODOs, estados de error, código de modo owner).

Reporte puramente factual — sin recomendaciones de prioridad.

---

## 1. Fases del plan maestro — estado real

| Fase                                                | Estado                                              | Plan file(s)                                                                                                                                                             | Referencia de merge                                                                                                                    |
| --------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Scaffold                                        | **Implementada**                                    | `docs/phases/phase-0-scaffold.md`                                                                                                                                        | PR #1 (`phase-0-scaffold`)                                                                                                             |
| 1 — Auth                                            | **Implementada**                                    | `docs/phases/phase-1-auth.md`                                                                                                                                            | PR #2 (`phase-1-auth`)                                                                                                                 |
| 1.5 — Social Login (Google + Apple vía Clerk)       | **Implementada**                                    | `docs/phases/phase-1.5-social-login.md`                                                                                                                                  | PR #3 (`phase-1.5-social-login`)                                                                                                       |
| 2 — Marketplace                                     | **Implementada**                                    | `docs/phases/phase-2-marketplace.md`                                                                                                                                     | PR #4 (`phase-2-marketplace`)                                                                                                          |
| 3 — Detalle de producto + Carrito                   | **Implementada**                                    | `docs/phases/phase-3-cart.md`                                                                                                                                            | PR #5 (`phase-3-cart`)                                                                                                                 |
| 4 — Checkout                                        | **Implementada**                                    | `docs/phases/phase-4-checkout.md`                                                                                                                                        | PR #6 (`phase-4-checkout`)                                                                                                             |
| 5 — Tracking + Push                                 | **Implementada**                                    | `docs/phases/phase-5-tracking.md`                                                                                                                                        | PR #7 (`phase-5-tracking`)                                                                                                             |
| 6a — Tab bar + Mis pedidos                          | **Implementada**                                    | `docs/phases/phase-6-orders-tabs.md`                                                                                                                                     | PR #8 (`phase-6-orders-tabs`)                                                                                                          |
| chore: app icon                                     | **Implementada**                                    | Sin plan file en `docs/phases/` (anterior a la regla de `CLAUDE.md` que exige un plan file por unidad de trabajo — esa regla nació recién en el chore de logout, PR #10) | PR #9 (`chore-app-icon`)                                                                                                               |
| chore: fix logout unhandled rejection               | **Implementada**                                    | `docs/phases/chore-logout-unhandled-rejection.md`                                                                                                                        | PR #10 (`fix-logout-unhandled-rejection`)                                                                                              |
| chore: brand v2 (login + splash)                    | **Implementada**                                    | `docs/phases/chore-brand-v2-login-splash.md`                                                                                                                             | PR #11 (`chore-brand-v2-login-splash`)                                                                                                 |
| 6b — Reviews + Feedback + consumo de contrato nuevo | **Implementada, rama pusheada, PR aún no mergeado** | `docs/phases/phase-6b-reviews-feedback.md`                                                                                                                               | Rama `phase-6b-reviews-feedback` sincronizada con `origin`; no aparece en el historial de merges a `main` al momento de esta auditoría |
| 7a — Perfil real                                    | **Implementada, rama pusheada, PR aún no mergeado** | `docs/phases/phase-7a-profile.md`                                                                                                                                        | Rama `feat/phase-7a-profile`; no aparece en el historial de merges a `main` al momento de esta actualización (2026-07-24)              |
| 7b — Recuperación de contraseña                     | **Implementada, rama pusheada, PR aún no mergeado** | `docs/phases/phase-7b-password-reset.md`                                                                                                                                 | Rama `feat/password-reset`                                                                                                             |
| 8 — Hardening + Store readiness                     | **Pendiente** (no iniciada)                         | —                                                                                                                                                                        | —                                                                                                                                      |
| 9 — Publicación                                     | **Pendiente** (no iniciada)                         | —                                                                                                                                                                        | —                                                                                                                                      |
| Modo owner (post-Fase 9, número TBD)                | **Pendiente** (no iniciada)                         | —                                                                                                                                                                        | —                                                                                                                                      |

### Notas factuales sobre estados marcados "Implementada"

- **Fase 0**: la línea de "Estado" del propio plan file dice literalmente
  _"completa, pendiente de verificación visual en Expo Go"_ — nunca se editó
  tras el cierre real (el merge del PR #1 y todo el trabajo posterior asume
  que se cerró).
- **Fase 1.5**: no es un número de fase de la tabla original de
  `PLAN_MOBILE_CERQUITA.md` — se insertó entre Fase 1 y Fase 2 (documentado
  como tal en su propio plan file, sin re-numerar la tabla del plan maestro).
- **Fase 6b**: implementada de punta a punta (los 3 checkpoints del plan
  file en verde: `tsc`, lint, suite completa 52/52 · 259/259 tests al cierre
  de la sesión de implementación), pero **no mergeada** — pendiente de PR y
  aprobación del usuario, no de trabajo de Claude.

---

## 2. Backlog consolidado (todos los ítems dispersos en plan files)

| Ítem                                                                                                    | Origen                                                                           | Nota                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mapa interactivo con pin arrastrable para direcciones (`react-native-maps`)                             | `PLAN_MOBILE_CERQUITA.md` — Backlog post-MVP                                     | Condicionado a demanda real de ajustar el pin más allá de GPS + referencia en texto.                                                                                                                                                                                        |
| Favoritos / negocios recientes                                                                          | `PLAN_MOBILE_CERQUITA.md` — Backlog post-MVP                                     | Sin fase de origen específica; anotado directo en el plan maestro.                                                                                                                                                                                                          |
| Notificaciones de promociones (opt-in separado del push transaccional)                                  | `PLAN_MOBILE_CERQUITA.md` — Backlog post-MVP                                     | —                                                                                                                                                                                                                                                                           |
| Banner promocional en Home                                                                              | `PLAN_MOBILE_CERQUITA.md` — Backlog post-MVP (también en tabla de paridad)       | Requiere modelo de promociones (tabla + endpoint) inexistente en el contrato.                                                                                                                                                                                               |
| Multi-negocio por pedido                                                                                | `PLAN_MOBILE_CERQUITA.md` — Backlog post-MVP                                     | —                                                                                                                                                                                                                                                                           |
| Estado de reseña en `GET /orders/:id` (gap de contrato)                                                 | `docs/phases/phase-6b-reviews-feedback.md`, anotado en `PLAN_MOBILE_CERQUITA.md` | `reviewedOrdersStore` (cliente) es la única fuente de verdad hoy; no exacto en multi-dispositivo.                                                                                                                                                                           |
| Punto de entrada a "modo owner" desde Perfil ("¿Tenés un negocio?")                                     | `docs/phases/phase-1-auth.md` — Notas/backlog                                    | Reforzado por la sección "Re-alcance: modo owner" del plan maestro (fases futuras, número TBD).                                                                                                                                                                             |
| MFA (segundo factor) — soporte parcial                                                                  | `docs/phases/phase-1-auth.md` — Notas/backlog                                    | Decía "no soportado en el MVP"; durante la Fase 5 se agregó soporte real para `email_code` como segundo factor (`SecondFactorScreen`). TOTP y otras estrategias siguen sin soportar. El backlog de Fase 1 no se actualizó para reflejar el soporte parcial (ver sección 4). |
| `orderInstructions` per-pedido en `POST /orders` (gap de backend)                                       | `docs/phases/phase-4-checkout.md`                                                | Hoy las instrucciones viven en la Dirección reusable, no en el pedido puntual.                                                                                                                                                                                              |
| `reason` estable en `details` del 409 de `POST /orders` y de `POST /orders/:id/cancel` (gap de backend) | `docs/phases/phase-4-checkout.md`, `docs/phases/phase-5-tracking.md`             | La clasificación de conflictos del cliente depende hoy de la forma/ausencia de `details`, frágil ante un motivo nuevo.                                                                                                                                                      |
| Producto con 2+ `variantGroups` no representable en `POST /orders` (gap de contrato)                    | `docs/phases/phase-3-cart.md`                                                    | El cliente usa solo el primer grupo si aparece un producto real con 2+; sin reportar todavía porque no se dio el caso en producción, según el propio plan file.                                                                                                             |
| `icon-512-maskable.svg` sin cablear (sin target web/PWA en este repo)                                   | `docs/phases/chore-brand-v2-login-splash.md` (Checkpoint A)                      | Queda como fuente en `assets/brand/` para cuando/si haga falta.                                                                                                                                                                                                             |
| Migración de "Sign in with Apple" al flujo nativo (`useSignInWithApple`)                                | `docs/phases/phase-1.5-social-login.md`                                          | Tarea explícita asignada a Fase 9 — bloqueada hoy por depender de Team ID real de Apple Developer. **No aparece en el checklist de Fase 9 del plan maestro** (ver sección 4).                                                                                               |
| Credenciales de producción de Apple/Google en Clerk para social login                                   | `docs/phases/phase-1.5-social-login.md`                                          | Google: solo requiere config en Google Cloud Console. Apple: bloqueado hasta la cuenta de Apple Developer paga (Fase 9). **Tampoco aparece en el checklist de Fase 9 del plan maestro** (ver sección 4).                                                                    |
| Fotos de producto reales (Cloudinary)                                                                   | `PLAN_MOBILE_CERQUITA.md` — tabla de paridad                                     | Depende del flujo de upload a Cloudinary y del catálogo de modo owner, ninguno construido.                                                                                                                                                                                  |
| Idempotency-Key no persiste si la OS mata la app entre "Confirmar" y la respuesta                       | `docs/phases/phase-4-checkout.md` — límite aceptado explícitamente, no resuelto  | Riesgo de pedido duplicado en un caso extremo; no hay plan de resolverlo documentado en ninguna fase futura.                                                                                                                                                                |

---

## 3. Gaps del prototipo aprobado no cubiertos por ninguna fase (paridad visual)

Extraído de la tabla "Paridad con el prototipo" de `PLAN_MOBILE_CERQUITA.md`, filtrado a
filas que NO dicen "Fase X — construida":

| Elemento del prototipo                           | Estado en el plan maestro                 | Nota                                                                                                                                  |
| ------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Búsqueda de productos                            | Bloqueado — gap de contrato               | `GET /marketplace/businesses` solo expone `search` sobre el nombre del negocio; no existe búsqueda de productos en el contrato.       |
| Orden por cercanía                               | Bloqueado — gap de contrato               | `Business` tiene `lat`/`lng`, pero el endpoint de listado no expone ningún parámetro de orden/distancia — solo paginación por cursor. |
| Banner promocional (Home)                        | Backlog post-MVP                          | Ver sección 2.                                                                                                                        |
| Campana de notificaciones (Home)                 | Recorte permanente                        | Decisión de producto ya cerrada: el push deep-linkea directo al pedido; un centro de notificaciones aparte sería UI sin función real. |
| Fotos de producto reales                         | Dato pendiente (Cloudinary + fases owner) | Ver sección 2.                                                                                                                        |
| Pill "Próximamente" (negocio/producto no activo) | Recorte permanente                        | El contrato nunca entrega al customer un recurso `PENDING`/inactivo — no hay estado que mostrar.                                      |

### Dos filas de la tabla de paridad desactualizadas (resueltas por Fase 6b, no reflejado en el texto)

| Elemento del prototipo                              | Texto actual en `PLAN_MOBILE_CERQUITA.md` | Estado real verificado en código                                                                                                                                                                               |
| --------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre/logo del negocio en la fila de "Mis pedidos" | "Bloqueado — gap de contrato"             | **Parcialmente resuelto**: `businessName` se agregó al DTO de `Order` y se consume en `OrderRow.tsx` (Fase 6b). `logoUrl` del negocio **no** se agregó ni se consume — sigue sin mostrarse.                    |
| Chips de categoría de catálogo (detalle de negocio) | "Bloqueado — gap de contrato"             | **Resuelto**: `catalogCategoryName` se agregó al DTO de `Product` y se consume como pill por producto en `ProductCard.tsx` (Fase 6b, no como fila de chips filtrable — decisión de diseño tomada en esa fase). |

---

## 4. Lo que el plan maestro no contempla (huecos detectados)

Verificación de código: `grep -rn "TODO\|FIXME\|XXX\|HACK" src app` → **cero resultados**.
Verificación de estados de error por pantalla: todas las pantallas con `useQuery`/mutaciones
que pueden fallar tienen manejo de error (vía el componente `ErrorState` compartido o, en
`CheckoutScreen`/formularios de auth/feedback, un bloque de error inline por diseño
documentado) — **no se encontraron pantallas con estado de error faltante**.

Huecos reales encontrados, todos de naturaleza documental o de checklist, no de código
faltante silencioso:

1. **Cláusula de permiso de notificaciones desactualizada en `PLAN_MOBILE_CERQUITA.md`**:
   la sección "Store readiness" (línea ~145-150) todavía dice que se pide "pantalla propia
   ... antes de pedir notificaciones". Durante la Fase 5 esa decisión cambió a un patrón
   directo sin tarjeta intermedia (`docs/phases/phase-5-tracking.md`, sección "Decisión:
   permiso de notificaciones sin paso intermedio"; también referenciado como el primer caso
   de aplicación del "Principio rector" en `CLAUDE.md`). El propio plan file de Fase 5
   afirma haber actualizado esa cláusula en `PLAN_MOBILE_CERQUITA.md`, pero el texto actual
   del archivo (verificado por grep) no refleja el cambio — la cláusula de ubicación
   ("antes de pedir ubicación") sigue vigente y sí implementada tal cual (Fase 4).

2. **Checklist de Fase 9 (Publicación) no incluye dos tareas ya identificadas por la
   Fase 1.5 como propias de esa fase**: migrar "Sign in with Apple" del flujo OAuth web
   al nativo (`useSignInWithApple`), y cargar las credenciales de producción de
   Apple/Google en Clerk. Ambas están documentadas como bloqueadas hasta la cuenta de
   Apple Developer en `docs/phases/phase-1.5-social-login.md`, pero el checklist de 8
   pasos de la sección "Publicación (Fase 9)" del plan maestro no las menciona.

3. **Tabla de paridad desactualizada** — ver sección 3 (dos filas que dicen "Bloqueado"
   pese a estar resueltas, una de ellas solo parcialmente).

4. **Backlog de MFA sin actualizar** — ver sección 2 (dice "no soportado" sin reflejar
   el soporte parcial de `email_code` agregado en Fase 5).

5. **`chore-app-icon` sin plan file** — PR #9, mergeado, sin archivo en `docs/phases/`.
   Es anterior a la regla de `CLAUDE.md` que exige un plan file por unidad de trabajo
   (esa regla se agregó recién en el commit del chore de logout, PR #10) — no es un
   incumplimiento de una regla que todavía no existía, pero deja un hueco real en la
   trazabilidad histórica vía `docs/phases/`.

6. **Fases 7, 8 y 9, y el "modo owner" post-Fase 9, sin plan file ni código**: consistente
   con el flujo de planificación del proyecto (se planifican recién cuando se abordan),
   pero factualmente hoy no existe: borrado de cuenta, privacy policy accesible, checklist
   MASVS corrido, auditoría de accesibilidad dedicada, documentación formal de por qué ATT
   no aplica, ni ningún paso del checklist de publicación (cuenta de developer, certificados,
   assets de store, builds de producción, TestFlight/Internal testing, submit, revisión).

7. **Límite aceptado del Idempotency-Key** (ver sección 2) no tiene ninguna fase futura
   asignada en el plan maestro — vive solo como nota de "límite conocido" dentro de
   `docs/phases/phase-4-checkout.md`.
