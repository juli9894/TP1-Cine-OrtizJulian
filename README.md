# TP Cine — Programación IV

Aplicación de cine (cartelera, compra de entradas, panel de administración) hecha para el Trabajo Práctico de Programación IV (UTN). Angular para las pantallas, Supabase como backend (base de datos + usuarios).

- **App en producción:** https://tp-1-cine-ortiz-julian.vercel.app
- **Autor:** Julián Ortiz
- **Entrega y defensa oral:** 7 de octubre de 2026

> Estado al 04/10: en desarrollo activo, ya funciona de punta a punta lo principal (ver más abajo en "Qué está hecho"). Falta terminar cancelaciones/crédito, el rol de empleado, reportes y estadísticas, y la app como PWA, antes de la entrega.

## Con qué está hecha

| Parte | Tecnología | Para qué se usa |
|---|---|---|
| Pantallas (frontend) | Angular, con Standalone Components y Signals | Angular es el framework que arma las pantallas. Standalone Components quiere decir que cada pantalla declara lo que necesita por su cuenta, sin tener que armar módulos aparte para agruparlas (así era antes en Angular). Signals es la forma en que la app sabe cuándo algo cambió y hay que actualizar lo que se ve — por ejemplo, cuando elegís una butaca, el precio total se actualiza solo. |
| Estilos | CSS puro (Flexbox, Grid, variables CSS) | Todo el diseño está hecho a mano, sin usar ninguna librería de estilos lista (como Bootstrap). Es más trabajo, pero da control total sobre cómo se ve todo. |
| Base de datos y backend | Supabase (usa PostgreSQL por abajo) | Supabase guarda todos los datos (películas, funciones, reservas, usuarios) y maneja el login. Se eligió porque la base de datos es relacional de verdad (las tablas se conectan entre sí por relación, no quedan "sueltas" como en otros servicios parecidos), y permite poner reglas directo en la base de datos además de en el código. |
| Actualización en vivo | Supabase Realtime | Es lo que hace que, si otra persona reserva una butaca mientras estás mirando la pantalla, se vea marcada como ocupada al instante, sin recargar la página. |
| Formularios | Reactive Forms de Angular | La forma "clásica" de Angular para armar formularios con validaciones (campo obligatorio, formato de email, etc.). Se usó esta y no la más nueva (todavía experimental) porque es la que se ve en la materia. |
| Despliegue | Vercel | Es donde vive la app publicada en internet. Cada vez que subo un cambio a la rama `main` en GitHub, Vercel la actualiza sola, sin que yo tenga que hacer nada manual. |

## Estructura de carpetas

```
src/app/
├── core/                    # Cosas que puede usar cualquier pantalla (no tienen diseño propio)
│   ├── guards/              # Códigos que bloquean el paso a ciertas rutas (ej: admin)
│   ├── models/               # Las "formas" de los datos (película, butaca, reserva, etc.)
│   └── services/             # Un archivo por tabla de la base, para hablar con Supabase
├── features/                # Una carpeta por pantalla
│   ├── auth/                 # login, registro
│   ├── home/                  # cartelera, top 3, buscador
│   ├── pelicula-detalle/      # ficha de la película + reseñas
│   ├── butacas/                # elegir butacas en vivo + pagar + entrada con QR
│   └── admin/                  # panel de administración
└── app.routes.ts             # qué pantalla corresponde a cada URL

supabase/migrations/          # cambios a la base de datos, en el orden en que se fueron agregando
```

**Por qué separar `core/` de `features/`:** `core/` tiene lo que es compartido por toda la app (un guard, un modelo, un service); `features/` tiene cada pantalla con lo que es solo suyo. Así una pantalla no termina usando por error cosas internas de otra.

**Un service por tabla:** cada tabla de la base tiene su propio archivo de service (`SalasService`, `FuncionesService`, etc.), y es el único lugar que habla directo con Supabase para esa tabla — las pantallas nunca le piden datos a Supabase directamente, siempre pasan por el service. Cuando una columna de la base viene con otro formato de nombre (por ejemplo `pelicula_id` en vez de `peliculaId`), el service se encarga de convertirla antes de pasarla al resto de la app.

## Decisiones que tomé y por qué

- **El panel de admin usa un guard que bloquea la ruta antes de que exista (`canMatch`), no uno que la bloquea después de encontrarla (`canActivate`).** Para un usuario sin rol de admin, la idea es que ni se note que esa ruta existe.
- **Si falla la consulta que dice si un usuario es admin, se le niega el acceso, nunca se lo deja pasar "por las dudas".** Un control de seguridad nunca debería fallar dejando pasar a todos.
- **Que no se solapen los horarios de una sala se valida directo en la base de datos (con un trigger), no solo en la pantalla.** Así la regla se cumple siempre, sin importar desde dónde se intente crear una función (la app, o directo en la base).
- **Nunca se usa `any` en TypeScript.** Cuando hay que identificar un error que viene de Supabase (por ejemplo "este dato ya existe"), se revisa el error paso a paso en vez de forzarlo a un tipo cualquiera.
- **Un solo formulario para crear y para editar, no dos parecidos.** Formularios como el de Sala o el de Función reciben un id opcional: si viene, están editando algo que ya existe; si no viene, están creando uno nuevo. Evita tener casi el mismo formulario escrito dos veces.
- **Para elegir fecha y hora se usa el selector nativo del navegador, no uno hecho a mano.** El enunciado pedía evitar selectores confusos o con scroll infinito, y el selector nativo ya cumple eso sin tener que construir ni mantener uno propio.
- **Supabase Realtime (lo que avisa en vivo cuándo se ocupa una butaca) no "habla" igual que el resto de la app, así que hubo que adaptarlo.** El resto de la app usa Signals para reaccionar a cambios; Supabase Realtime, en cambio, llama a una función cada vez que pasa algo nuevo. Hubo que conectar las dos cosas a mano, y además asegurarse de que Angular se entere del cambio (sin eso, el dato llegaba bien pero la pantalla no se actualizaba).
- **Borrar un producto o combo no lo borra de la base, solo lo marca como inactivo.** Si ya se vendió alguna vez, sigue apareciendo en el historial de compras viejas; "eliminarlo" solo significa que deja de ofrecerse para compras nuevas. Salas, Funciones y Películas sí se pueden borrar de verdad, porque la base no deja borrar algo que todavía tiene datos relacionados (tira un error en ese caso).
- **Sumar puntos por una compra se hace con una función directo en la base de datos, no leyendo el saldo desde la app y volviéndolo a guardar.** Si dos compras de la misma cuenta pasan casi al mismo tiempo, leer-y-reescribir puede hacer que una de las dos sumas "se pierda". Haciendo la suma directo en la base, eso no puede pasar.
- **Row Level Security (una capa de seguridad de Supabase que controla quién puede leer o escribir cada fila) quedó pendiente a propósito.** No es algo que el profesor haya pedido puntualmente para este TP, así que se priorizó terminar todo lo funcional primero. Es una decisión consciente, no algo que se haya olvidado.

## Qué está hecho

Probado de punta a punta:

- Registro y login, con los datos que pidió el cliente, y un control para que alguien ya logueado no pueda volver a entrar a login/registro
- Cartelera: top 3 más vendidas, ficha de película con reseñas y promedio de estrellas, buscador por texto y por género
- Elegir butacas, con filas accesibles y VIP marcadas, y que se actualicen en vivo si otra persona reserva mientras estás mirando
- Panel de administración, solo para usuarios con rol admin
- Crear, editar y borrar Salas, Funciones, Películas, Productos y Combos, sin que se puedan pisar los horarios de una sala
- Comprar entradas junto con candy bar/combos, con descuentos automáticos (primera compra, mayores de 50) y puntos acumulados (1 peso gastado = 1 punto)
- Restricción de edad según la clasificación de la película, para usuarios logueados
- Entrada en PDF con código QR, para descargar después de comprar
- La app publicada online, actualizándose sola con cada cambio

Falta (se va completando de acá a la entrega):

- Cancelar una compra (hasta 2hs antes de la función) y que quede como crédito en la cuenta, no reembolso
- Rol de Empleado: escanear el QR con la cámara (o escribirlo a mano) para validar la entrada
- Canjear puntos por entradas o candy, e historial de canjes
- Reportes de ventas, gráficos y un registro de qué hizo cada admin
- Que la app se pueda instalar como PWA, y terminar algunos detalles visuales

## Cómo correrlo en tu máquina

Necesita Node 24 o más nuevo, y una cuenta de Supabase.

```bash
npm install
ng serve
```

Queda disponible en `http://localhost:4200/`. Las claves de Supabase están en `src/environments/environment.ts` (están subidas al repo para simplificar el despliegue en este TP, no se haría así en un proyecto real).

Los cambios a la base de datos están en `supabase/migrations/`, numerados en el orden en que se fueron necesitando. Se corren uno por uno desde el SQL Editor de Supabase.

## Cómo se publica

```bash
ng build
```

Angular deja el resultado en `dist/tp-cine/browser`. Vercel está conectado directo al repositorio de GitHub: cada vez que subo algo a `main`, genera una versión nueva y la publica sola. Un archivo (`vercel.json`) le dice a Vercel que cualquier dirección rara se la mande igual a la app, para que Angular decida qué pantalla mostrar.
