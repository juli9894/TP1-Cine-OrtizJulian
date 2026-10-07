-- Valida que no haya dos funciones en la misma sala con menos de
-- 30 minutos de diferencia entre que termina una y empieza la otra.
-- El buffer de 30 min se calcula al vuelo, nunca se guarda en ninguna columna.
create or replace function validar_solapamiento_funcion()
returns trigger as $$
declare
    duracion_nueva integer;
    fin_nueva timestamptz;
    conflicto record;
begin
    -- 1. Busco cuánto dura la película de la función nueva
    select duracion_minutos into duracion_nueva
    from peliculas
    where id = new.pelicula_id;

    -- 2. Calculo cuándo termina la nueva (horario + duración + 30 min de limpieza)
    fin_nueva := new.horario + (duracion_nueva + 30) * interval '1 minute';

    -- 3. Busco si en la misma sala hay alguna función que se solape
    select f.id into conflicto
    from funciones f
    join peliculas p on p.id = f.pelicula_id
    where f.sala_id = new.sala_id
        and f.id is distinct from new.id
        -- Acá está la magia: ¿Este rango de tiempo se pisa con el nuevo?
      and (f.horario, f.horario + (p.duracion_minutos + 30) * interval '1 minute') 
            OVERLAPS 
            (new.horario, fin_nueva)
    limit 1;

    -- 4. Si hubo choque, freno la operación
    if found then
        raise exception 'La sala ya está ocupada en ese horario. Debe haber al menos 30 minutos de espacio entre funciones.';
    end if;

    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_validar_solapamiento on funciones;

create trigger trigger_validar_solapamiento
before insert or update on funciones
for each row execute function validar_solapamiento_funcion();