-- =========================================================
-- TP Cine - Esquema inicial de base de datos (Sprint 1)
-- Nota: a propósito NO incluye políticas de RLS todavía.
-- Row Level Security se agrega como paso siguiente, explicado
-- aparte, para no mezclar "estructura" con "seguridad".
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- PERSONAS ----------
-- Extiende auth.users (que ya maneja Supabase) con los campos
-- extra que pide la consigna. El id es el mismo que el de auth.users.
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  apellido text not null,
  fecha_nacimiento date not null,
  tipo_sangre text,
  color_ojos text,
  dias_vacaciones integer not null default 0,
  rol text not null default 'cliente' check (rol in ('cliente','empleado','admin')),
  saldo_puntos integer not null default 0,
  saldo_credito numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- CATÁLOGO DE PELÍCULAS ----------
create table generos (
  id serial primary key,
  nombre text not null unique
);

create table peliculas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  duracion_minutos integer not null,
  sinopsis text,
  imagen_url text,
  clasificacion text not null check (clasificacion in ('ATP','+13','+18')),
  created_at timestamptz not null default now()
);

-- Tabla intermedia: relación muchos a muchos entre películas y géneros
create table pelicula_generos (
  pelicula_id uuid references peliculas(id) on delete cascade,
  genero_id integer references generos(id) on delete cascade,
  primary key (pelicula_id, genero_id)
);

create table resenas (
  id uuid primary key default gen_random_uuid(),
  pelicula_id uuid not null references peliculas(id) on delete cascade,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  estrellas integer not null check (estrellas between 1 and 5),
  comentario text,
  created_at timestamptz not null default now(),
  unique (pelicula_id, usuario_id) -- un usuario reseña una película una sola vez
);

-- ---------- INFRAESTRUCTURA FÍSICA ----------
create table salas (
  id serial primary key,
  nombre text not null unique
);

create table butacas (
  id uuid primary key default gen_random_uuid(),
  sala_id integer not null references salas(id) on delete cascade,
  fila text not null,
  columna integer not null,
  tipo text not null check (tipo in ('normal','accesible','vip')),
  unique (sala_id, fila, columna)
);

-- Genera automáticamente el layout estándar de butacas para una sala:
-- filas A-I y L-Q normales (28 butacas c/u), R-S-T VIP (28 c/u),
-- una fila "ACCESIBLE" que reemplaza a J y K (14 butacas).
create or replace function generar_butacas(p_sala_id integer)
returns void as $$
declare
  filas_normales text[] := array['A','B','C','D','E','F','G','H','I','L','M','N','O','P','Q'];
  filas_vip text[] := array['R','S','T'];
  fila text;
  col integer;
begin
  foreach fila in array filas_normales loop
    for col in 1..28 loop
      insert into butacas (sala_id, fila, columna, tipo) values (p_sala_id, fila, col, 'normal');
    end loop;
  end loop;

  foreach fila in array filas_vip loop
    for col in 1..28 loop
      insert into butacas (sala_id, fila, columna, tipo) values (p_sala_id, fila, col, 'vip');
    end loop;
  end loop;

  for col in 1..14 loop
    insert into butacas (sala_id, fila, columna, tipo) values (p_sala_id, 'ACCESIBLE', col, 'accesible');
  end loop;
end;
$$ language plpgsql;

-- ---------- CUPONES (antes de funciones/reservas porque las referencian) ----------
create table cupones (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  tipo text not null check (tipo in ('bienvenida','mayor_50','general')),
  porcentaje_descuento numeric(5,2) not null,
  activo boolean not null default true,
  fecha_desde timestamptz,
  fecha_hasta timestamptz
);

-- ---------- FUNCIONES ----------
-- Une película + sala + horario + formato + idioma.
-- La validación de "30 min de diferencia entre funciones de la misma sala"
-- la vamos a hacer desde el servicio de Angular al crear una función
-- (se explica cuando lleguemos a esa lógica).
create table funciones (
  id uuid primary key default gen_random_uuid(),
  pelicula_id uuid not null references peliculas(id),
  sala_id integer not null references salas(id),
  inicio timestamptz not null,
  fin timestamptz not null,
  formato text not null check (formato in ('2D','3D','4D','5D')),
  idioma text not null check (idioma in ('castellano','subtitulada')),
  precio_base numeric(10,2) not null,
  es_preventa boolean not null default false,
  fin_preventa timestamptz,
  precio_preventa numeric(10,2),
  created_at timestamptz not null default now()
);

-- ---------- CANDY BAR ----------
create table productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null,
  precio numeric(10,2) not null,
  imagen_url text
);

create table combos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio_fijo numeric(10,2) not null
);

create table combo_productos (
  combo_id uuid references combos(id) on delete cascade,
  producto_id uuid references productos(id) on delete cascade,
  cantidad integer not null default 1,
  primary key (combo_id, producto_id)
);

-- ---------- VENTAS ----------
create table reservas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references perfiles(id),
  email_invitado text, -- para compra anónima (guest checkout)
  funcion_id uuid not null references funciones(id),
  cupon_id uuid references cupones(id),
  estado text not null default 'confirmada' check (estado in ('confirmada','cancelada')),
  credito_usado numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  qr_code text unique not null,
  entrada_validada boolean not null default false,
  candy_validado boolean not null default false,
  created_at timestamptz not null default now(),
  check (usuario_id is not null or email_invitado is not null)
);

create table reserva_butacas (
  reserva_id uuid references reservas(id) on delete cascade,
  butaca_id uuid references butacas(id),
  funcion_id uuid not null references funciones(id),
  precio_pagado numeric(10,2) not null,
  primary key (reserva_id, butaca_id),
  unique (funcion_id, butaca_id) -- una butaca no se puede vender dos veces en la misma función
);

create table reserva_productos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  producto_id uuid references productos(id),
  combo_id uuid references combos(id),
  cantidad integer not null default 1,
  precio_pagado numeric(10,2) not null,
  check (producto_id is not null or combo_id is not null)
);

-- ---------- FIDELIZACIÓN ----------
create table catalogo_puntos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada','producto')),
  producto_id uuid references productos(id),
  puntos_requeridos integer not null
);

create table canjes_puntos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id),
  catalogo_punto_id uuid not null references catalogo_puntos(id),
  puntos_usados integer not null,
  created_at timestamptz not null default now()
);

create table alertas_proximamente (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  pelicula_id uuid not null references peliculas(id) on delete cascade,
  notificado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (usuario_id, pelicula_id)
);

-- ---------- SISTEMA ----------
create table auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references perfiles(id),
  accion text not null,
  entidad text not null,
  entidad_id text,
  detalle jsonb,
  created_at timestamptz not null default now()
);
