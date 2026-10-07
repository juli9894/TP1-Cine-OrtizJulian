-- Fix chico sobre la migracion 0024: el mensaje de error mostraba la fecha
-- de estreno en formato ISO (2026-10-31, el formato nativo en el que
-- Postgres interpola un valor "date" dentro de un string), inconsistente
-- con el DD/MM/AAAA que se usa en toda la UI. to_char() le pide a Postgres
-- que formatee la fecha como texto ANTES de interpolarla en el mensaje.
create or replace function validar_solapamiento_funcion()
returns trigger as $$
declare
    duracion_nueva integer;
    fecha_estreno_pelicula date;
    fin_nueva timestamptz;
    conflicto record;
begin
    select duracion_minutos, fecha_estreno into duracion_nueva, fecha_estreno_pelicula
    from peliculas
    where id = new.pelicula_id;

    if new.horario::date < fecha_estreno_pelicula then
        raise exception 'No se puede programar una función antes de la fecha de estreno de la película (%).', to_char(fecha_estreno_pelicula, 'DD/MM/YYYY');
    end if;

    fin_nueva := new.horario + (duracion_nueva + 30) * interval '1 minute';

    select f.id into conflicto
    from funciones f
    join peliculas p on p.id = f.pelicula_id
    where f.sala_id = new.sala_id
        and f.id is distinct from new.id
        and (f.horario, f.horario + (p.duracion_minutos + 30) * interval '1 minute')
            OVERLAPS
            (new.horario, fin_nueva)
    limit 1;

    if found then
        raise exception 'La sala ya está ocupada en ese horario. Debe haber al menos 30 minutos de espacio entre funciones.';
    end if;

    return new;
end;
$$ language plpgsql;
