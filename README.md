# TP Cine — Programación IV

Aplicación completa para un cine (cartelera, compra de entradas, panel de administración) desarrollada como Trabajo Práctico de Programación IV (UTN). Angular en el frontend, Supabase como backend.

- **App en producción:** https://tp-1-cine-ortiz-julian.vercel.app
- **Autor:** Julián Ortiz
- **Entrega y defensa oral:** 5 de octubre de 2026

> Estado del proyecto al 28/09: en desarrollo activo. La sección [Estado actual](#estado-actual) de más abajo dice, con honestidad, qué está construido y probado y qué todavía falta — se va a completar para la fecha de entrega.

## Stack y arquitectura

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Angular 22 (Standalone Components, Signals, `@if`/`@for`) | Sin `NgModules`: menos boilerplate y mejor tree-shaking, porque cada componente declara sus propias dependencias en vez de depender de un módulo que las agrupe. Signals en vez de Zone.js donde alcanza: recalculan solo lo que depende de un dato que cambió, en vez de disparar una detección de cambios global en toda la app. |
| Estilos | CSS puro (Flexbox, Grid, variables CSS) | Sin librerías de terceros, por consigna del TP. |
| Backend / datos | Supabase (PostgreSQL, Auth, Realtime, Storage) | Base de datos relacional real (no un BaaS tipo Firebase con NoSQL), con reglas de negocio que se pueden meter directo en la base (triggers, constraints) además de en el código. |
| Reactividad | Signals para casi todo el estado; Observable/RxJS puntual (Supabase Realtime) | Se usa RxJS únicamente donde la fuente de datos ya es asincrónica por naturaleza (un canal de WebSocket) y no encaja con el modelo de "leer un signal". Para todo lo demás (formularios, datos traídos una vez), un signal alcanza y es más simple. |
| Formularios | Reactive Forms (`FormGroup`/`FormControl`/`Validators`) | Enfoque clásico y estable de Angular, no la API experimental de Signal Forms — decisión alineada con lo visto en clase. |
| Despliegue | Vercel (CI/CD automático desde `main`) | Cada push a `main` dispara un build y deploy nuevo sin pasos manuales. |

## Estructura de carpetas

```
src/app/
├── core/                    # Todo lo transversal a la app, sin UI propia
│   ├── guards/              # soloInvitadoGuard, adminGuard
│   ├── models/               # Interfaces TypeScript (tipado estricto, sin `any`)
│   └── services/             # Un service por entidad, hablan con Supabase
├── features/                # Un folder por pantalla/funcionalidad
│   ├── auth/                 # login, registro
│   ├── home/                  # cartelera, top 3, buscador
│   ├── pelicula-detalle/      # ficha + reseñas
│   ├── butacas/                # selección de butacas en tiempo real
│   └── admin/                  # panel de administración (salas, funciones)
└── app.routes.ts             # rutas + guards

supabase/migrations/          # una migración SQL por cambio de esquema, en orden
```

**Por qué esta división (`core/` vs `features/`):** `core/` agrupa lo que cualquier pantalla puede necesitar (un guard, un modelo, un service) y no depende de ninguna en particular; `features/` agrupa cada pantalla con lo que le pertenece solo a ella. Evita que un componente de una pantalla importe cosas internas de otra.

**Patrón repetido en los servicios:** cada entidad tiene un service propio (`SalasService`, `FuncionesService`, etc.) que es el único punto de contacto con Supabase para esa tabla — los componentes nunca llaman a Supabase directamente. Cuando la tabla tiene columnas en `snake_case` que no calzan con la convención `camelCase` de TypeScript (por ejemplo `pelicula_id` → `peliculaId`), el service expone una interfaz `Fila<Entidad>` (la forma cruda que devuelve Supabase) y una función `mapear<Entidad>()` que la convierte a la interfaz de dominio (`Entidad`) que usa el resto de la app.

## Decisiones técnicas y su justificación

- **`CanMatchFn` en vez de `CanActivateFn` para `/admin/*`.** `canActivate` bloquea una ruta ya encontrada; `canMatch` decide si la ruta existe siquiera para ese usuario. Para el panel de admin tiene más sentido conceptual: un usuario sin rol admin no debería ni "saber" que esa ruta existe.
- **Guards devuelven un `UrlTree` (`router.parseUrl(...)`), no `false` a secas.** Con `canMatch`, devolver `false` solo le dice al Router que esa ruta no matchea, sin garantizar ninguna redirección. Devolver el `UrlTree` fuerza la navegación a una ruta conocida.
- **Fail-safe / deny by default en `adminGuard`.** Cualquier error al consultar el rol del usuario (perfil inexistente, falla de red) deniega el acceso en vez de dejarlo pasar. Un guard de seguridad nunca debería fallar "abierto".
- **Validación de horarios con un trigger de Postgres, no solo en el frontend.** Que no haya dos funciones en la misma sala con menos de 30 minutos de diferencia es una regla de negocio crítica; ponerla en un trigger (`before insert or update on funciones`) la hace imposible de saltear, sin importar desde dónde se inserte el dato (la app, el SQL Editor, un futuro endpoint). El trigger se excluye a sí mismo al comparar (`f.id is distinct from new.id`) para que funcione también al editar una función existente.
- **Manejo de errores con `unknown` y type narrowing progresivo, nunca `any`.** Los errores de Supabase/Postgres se identifican por código (`23505` — dato duplicado, `23503` — referencia rota, `P0001` — error de un trigger propio) verificando de a un paso genuino (`typeof === 'object'` → `!== null` → `'code' in err` → comparar el código) en vez de forzar un cast.
- **Un solo componente para crear y editar, no dos casi idénticos.** `FormularioSala` y `FormularioFuncion` reciben un `id` opcional (`input<string>()`) y derivan con `computed()` si están en modo edición. Evita duplicar el 90% del formulario por una diferencia de comportamiento chica.
- **Selector de fecha/hora nativo (`input[type="datetime-local"]`), no un date-picker custom.** Cumple el pedido explícito del cliente de evitar selectores confusos o con scroll infinito, sin tener que construir ni mantener un componente propio.
- **Supabase Realtime envuelto en un `Observable` de RxJS hecho a mano**, porque la librería expone una API de callbacks, no Observables nativos — es el patrón estándar para integrar cualquier fuente asincrónica externa bajo la interfaz común de Observable/Subscription. El callback corre fuera de la zona que Angular vigila con Zone.js, así que el `.set()` del signal va envuelto en `ngZone.run(...)` para que dispare la actualización de la vista.
- **RLS (Row Level Security) de Supabase, deprioritizado a propósito.** Sigue en la lista de decisiones técnicas del enunciado, pero se bajó de prioridad porque no parece ser un requisito que se vaya a evaluar formalmente en este TP — queda para el buffer final si sobra tiempo. Se documenta acá para que quede claro que es una decisión consciente, no un olvido.

## Estado actual

Hecho y probado de punta a punta:

- Autenticación (registro con los campos pedidos por el cliente, login, guard `soloInvitadoGuard`)
- Cartelera: Top 3 más vendidas, ficha de película con reseñas y promedio, buscador por texto y por género
- Selección de butacas con matriz accesible + VIP y actualización en tiempo real (Supabase Realtime)
- Rol de usuario y panel de administración protegido (`canMatch`)
- CRUD completo de Salas y de Funciones, con validación automática de solapamiento de horarios
- Deploy en producción con CI/CD

Pendiente (se va completando sprint a sprint hasta la entrega):

- CRUD de Películas
- Candy bar, combos y checkout con cupones/puntos
- Generación de PDF + QR, rol de empleado (escaneo), cancelaciones con crédito
- Reportes de facturación, gráficos estadísticos, log de auditoría
- PWA (manifiesto + service worker) y diseño visual propio

## Correr el proyecto localmente

Requiere Node 24+ y una cuenta de Supabase.

```bash
npm install
ng serve
```

La app queda disponible en `http://localhost:4200/`. Las credenciales de Supabase están en `src/environments/environment.ts` (trackeado en git para simplificar el deploy en este TP).

Las migraciones de base de datos están en `supabase/migrations/`, numeradas en el orden en que se fueron necesitando — se corren una por una desde el SQL Editor de Supabase.

## Build y despliegue

```bash
ng build
```

El build queda en `dist/tp-cine/browser` (el builder moderno de Angular separa la salida de browser y de server aunque no haya SSR — importante si se configura el Output Directory en otra plataforma de hosting). El deploy en Vercel está conectado al repo: cada push a `main` dispara un build y deploy automático, con `vercel.json` reescribiendo cualquier ruta hacia `index.html` para que el Router de Angular la resuelva del lado del cliente.
