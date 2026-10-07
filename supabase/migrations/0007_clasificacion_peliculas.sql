-- Agrega la clasificacion de edad de cada pelicula (Sprint: CRUD de Peliculas).
-- Por default todas quedan en 'ATP' (la mas permisiva).
alter table peliculas
    add column if not exists clasificacion text not null default 'ATP'
    check (clasificacion in ('ATP', '+13', '+18'));
