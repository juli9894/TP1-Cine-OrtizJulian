-- =========================================================
-- Migracion 0002 - Mails 2 y 3 (top 3, generos y resenas)
-- Esta migracion se habia corrido directo en el SQL Editor de
-- Supabase en su momento; este archivo la deja documentada en
-- el repo, con la estructura real confirmada en la base el
-- 22 sep (information_schema.columns + pg_constraint).
-- =========================================================

-- 1) Top 3 mas vendidas en el Home: contador denormalizado
--    sobre peliculas (todavia no existe el flujo de compra,
--    asi que se actualiza a mano por ahora)
alter table peliculas
  add column ventas integer not null default 0;

-- 2) Catalogo de generos (para el buscador con filtro por genero)
create table generos (
  id serial primary key,
  nombre text not null unique
);

-- 3) Relacion muchos a muchos: una pelicula puede tener varios generos
create table pelicula_generos (
  pelicula_id integer not null references peliculas(id) on delete cascade,
  genero_id integer not null references generos(id) on delete cascade,
  primary key (pelicula_id, genero_id)
);

-- 4) Resenas: estrellas (1 a 5) + comentario corto.
--    Una sola resena por usuario por pelicula (UNIQUE compuesta).
--    usuario_id apunta directo a auth.users (a diferencia de
--    reservas, que apunta a perfiles) porque una resena siempre
--    necesita un usuario identificado -- no hay resena anonima --
--    y tiene sentido que se borre en cascada junto con la cuenta.
create table resenas (
  id serial primary key,
  pelicula_id integer not null references peliculas(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  calificacion integer not null check (calificacion >= 1 and calificacion <= 5),
  comentario text,
  created_at timestamptz not null default now(),
  unique (pelicula_id, usuario_id)
);
