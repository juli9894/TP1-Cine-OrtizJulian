-- Agrega la clasificacion de edad de cada pelicula (Sprint: CRUD de Peliculas).
-- Por default todas quedan en 'ATP' (la mas permisiva) para no romper las
-- peliculas que ya existen; el admin puede editarla despues desde el CRUD.
-- El check constraint evita valores invalidos o mal tipeados (ej. '+18 '
-- con espacio, '18+', 'atp' en minuscula) -- mismo criterio que se uso
-- para el rol en perfiles (migracion 0006), a diferencia de formato/idioma
-- en funciones, que quedaron sin constraint por ser menos criticos.
alter table peliculas
    add column if not exists clasificacion text not null default 'ATP'
    check (clasificacion in ('ATP', '+13', '+18'));
