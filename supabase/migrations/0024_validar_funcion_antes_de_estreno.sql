-- Le suma una validacion mas al trigger de funciones de la migracion 0005:
-- ademas de evitar el solapamiento de horarios en la misma sala, ahora
-- tambien rechaza crear/editar una funcion con un horario anterior a la
-- fecha de estreno de la pelicula

create or replace function validar_solapamiento_funcion()
returns trigger as $$
declare
    duracion_nueva integer;
    fecha_estreno_pelicula date;
    fin_nueva timestamptz;
    conflicto record;
begin
    -- 1. Busco duracion y fecha de estreno de la pelicula de la funcion nueva
    select duracion_minutos, fecha_estreno into duracion_nueva, fecha_estreno_pelicula
    from peliculas
    where id = new.pelicula_id;

    -- 2. Validacion nueva: el horario de la funcion no puede caer en un dia
    -- anterior a la fecha de estreno.
    if new.horario::date < fecha_estreno_pelicula then
        raise exception 'No se puede programar una funcion antes de la fecha de estreno de la película (%).', fecha_estreno_pelicula;
    end if;

    -- 3. Calculo cuándo termina la nueva (horario + duración + 30 min de limpieza)
    fin_nueva := new.horario + (duracion_nueva + 30) * interval '1 minute';

    -- 4. Busco si en la misma sala hay alguna función que se solape
    select f.id into conflicto
    from funciones f
    join peliculas p on p.id = f.pelicula_id
    where f.sala_id = new.sala_id
        and f.id is distinct from new.id
        and (f.horario, f.horario + (p.duracion_minutos + 30) * interval '1 minute')
            OVERLAPS
            (new.horario, fin_nueva)
    limit 1;

    -- 5. Si hubo choque, freno la operación
    if found then
        raise exception 'La sala ya está ocupada en ese horario. Debe haber al menos 30 minutos de espacio entre funciones.';
    end if;

    return new;
end;
$$ language plpgsql;
