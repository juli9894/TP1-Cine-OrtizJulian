# TP Cine — Programación IV

Aplicación de cine (cartelera, compra de entradas, panel de administración) para el Trabajo Práctico de Programación IV (UTN).

- **App en producción:** https://tp-1-cine-ortiz-julian.vercel.app
- **Autor:** Julián Ortiz
- **Entrega y defensa oral:** 7 de octubre de 2026

> Estado al 04/10: en desarrollo activo, lo principal ya funciona de punta a punta. Falta cancelaciones/crédito, rol de empleado, reportes/estadísticas y PWA.

## Qué usé y por qué

- **Angular** (Standalone Components + Signals) — para armar las pantallas. Cada componente declara lo que necesita por su cuenta, sin módulos aparte. Signals hace que la pantalla se actualice sola cuando cambia un dato (ej: elegís una butaca y el precio total se actualiza solo).
- **CSS puro** — todo el diseño hecho a mano, sin librerías como Bootstrap.
- **Supabase** — base de datos y login. Tablas relacionadas entre sí (no sueltas), y permite poner reglas directo en la base además del código.
- **Supabase Realtime** — para que una butaca se vea ocupada en vivo si otro usuario la reserva, sin recargar la página.
- **Reactive Forms** (Angular) — para formularios con validaciones (campo obligatorio, formato de email, etc.).
- **Vercel** — donde está publicada la app. Se actualiza sola con cada push a `main`.

## Estructura de carpetas

```
src/app/
├── core/          # Lo que usa cualquier pantalla: guards, models, services
├── features/      # Una carpeta por pantalla: auth, home, pelicula-detalle, butacas, admin
└── app.routes.ts  # Qué pantalla corresponde a cada URL

supabase/migrations/  # Cambios a la base de datos, en orden
```

`core/` es lo compartido por toda la app. `features/` es cada pantalla con lo que es solo suyo. Cada tabla de la base tiene su propio service (`SalasService`, `FuncionesService`, etc.) — las pantallas nunca hablan con Supabase directo, siempre pasan por ahí.

## Decisiones técnicas

- Guard de admin con `canMatch`, no `canActivate` — para que un usuario sin rol admin ni se entere de que esa ruta existe.
- Si falla la consulta del rol, se niega el acceso — nunca se deja pasar "por las dudas".
- El solapamiento de horarios se valida en la base (trigger), no solo en la pantalla — así no se puede saltear.
- Nada de `any` en TypeScript — los errores de Supabase se identifican por código, paso a paso.
- Un solo formulario para crear y editar (con un id opcional), no dos casi iguales.
- Selector de fecha/hora nativo del navegador, no uno hecho a mano.
- Productos y combos se desactivan, no se borran — si ya se vendieron, quedan en el historial. Salas/Funciones/Películas sí se borran.
- Sumar puntos se hace con una función directo en la base, no leyendo y reescribiendo desde la app — para que dos compras al mismo tiempo no se pisen.
- RLS (seguridad por fila de Supabase) quedó pendiente a propósito — no era algo pedido puntualmente para este TP, se priorizó terminar lo funcional.

## Qué está hecho

- Registro y login, con guard para no volver a login si ya estás logueado
- Cartelera: top 3, ficha de película con reseñas, buscador por texto y género
- Elegir butacas (accesibles y VIP marcadas), actualización en vivo
- Panel de administración, solo para admin
- CRUD de Salas, Funciones, Películas, Productos y Combos
- Compra con candy bar/combos, descuentos (primera compra, +50 años) y puntos (1 peso = 1 punto)
- Restricción de edad por clasificación de película
- Entrada en PDF con QR
- Deploy automático

## Falta

- Cancelaciones (hasta 2hs antes) con crédito en vez de reembolso
- Rol de Empleado: escanear QR o cargarlo a mano
- Canje de puntos e historial
- Reportes, gráficos y log de auditoría
- PWA y detalles visuales

## Correrlo en tu máquina

Necesita Node 24+ y una cuenta de Supabase.

```bash
npm install
ng serve
```

Queda en `http://localhost:4200/`. Las claves de Supabase están en `src/environments/environment.ts`.

Las migraciones están en `supabase/migrations/`, numeradas en orden — se corren una por una desde el SQL Editor de Supabase.

## Cómo se publica

```bash
ng build
```

Vercel está conectado al repo: cada push a `main` genera una versión nueva y la publica sola.
