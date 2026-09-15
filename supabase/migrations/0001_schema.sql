-- =========================================================
-- Migracion 0001 - Nucleo del Mail 1 (pedido inicial del cliente)
-- Solo lo que ese mail pide: peliculas, salas, butacas, funciones,
-- perfiles de usuario, cupon de bienvenida y la reserva con sus butacas.
-- Todo lo demas (resenas, generos, candy bar, puntos, etc.) llega
-- en migraciones futuras, a medida que aparezcan esos mails.
-- =========================================================

create extension if not exists pgcrypto;

-- 1) Datos extra del usuario que se registra (el login lo maneja Supabase Auth)
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  apellido text not null,
  fecha_nacimiento date not null,
  tipo_sangre text,
  color_ojos text,
  dias_vacaciones integer,
  created_at timestamptz not null default now()
);

-- 2) Catalogo de peliculas
create table peliculas (
  id serial primary key,
  titulo text not null,
  duracion_minutos integer not null,
  sinopsis text,
  imagen_url text,
  created_at timestamptz not null default now()
);

-- 3) Las salas fisicas del cine
create table salas (
  id serial primary key,
  nombre text not null,
  created_at timestamptz not null default now()
);

-- 4) Cada butaca individual de cada sala
create table butacas (
  id serial primary key,
  sala_id integer not null references salas(id) on delete cascade,
  fila text not null,
  columna integer not null,
  tipo text not null default 'normal'
);

-- 5) Funciones: que pelicula se da, en que sala, horario, formato e idioma
create table funciones (
  id serial primary key,
  pelicula_id integer not null references peliculas(id) on delete cascade,
  sala_id integer not null references salas(id) on delete cascade,
  horario timestamptz not null,
  formato text not null,   -- '2D' | '3D' | '4D' | '5D'
  idioma text not null,    -- 'castellano' | 'subtitulada'
  created_at timestamptz not null default now()
);

-- 6) Cupones (por ahora solo el de bienvenida, configurable)
create table cupones (
  id serial primary key,
  tipo text not null,               -- 'bienvenida' por ahora
  porcentaje_descuento numeric not null,
  activo boolean not null default true
);

-- 7) Reserva = una compra de entradas (permite usuario anonimo)
create table reservas (
  id serial primary key,
  usuario_id uuid references perfiles(id) on delete set null,
  funcion_id integer not null references funciones(id) on delete cascade,
  cupon_id integer references cupones(id) on delete set null,
  total numeric not null,
  qr_code uuid not null default gen_random_uuid(),
  qr_validado boolean not null default false,
  created_at timestamptz not null default now()
);

-- 8) Que butacas puntuales se compraron en cada reserva
create table reserva_butacas (
  id serial primary key,
  reserva_id integer not null references reservas(id) on delete cascade,
  butaca_id integer not null references butacas(id) on delete cascade
);

-- =========================================================
-- Funcion para generar las butacas de una sala.
-- Version simple del Mail 1: 20 filas (A a T), 3 columnas de
-- 4 + 20 + 4 butacas, todas tipo 'normal'.
-- (La fila accesible y las butacas VIP llegan en mails futuros:
-- ese dia vamos a MODIFICAR esta funcion, no crear una nueva.)
-- =========================================================
create or replace function generar_butacas(p_sala_id integer)
returns void as $$
declare
  letras text[] := array['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
  fila text;
  col integer;
begin
  foreach fila in array letras loop
    for col in 1..28 loop
      insert into butacas (sala_id, fila, columna, tipo)
      values (p_sala_id, fila, col, 'normal');
    end loop;
  end loop;
end;
$$ language plpgsql;
