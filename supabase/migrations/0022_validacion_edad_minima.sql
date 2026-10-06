-- Restriccion de edad del enunciado: "Menores de 13 o 18 años no pueden
-- comprar para peliculas con dicha restriccion" -- hasta ahora esto SOLO se
-- validaba en seleccion-butacas.ts (confirmarCompra), es decir, en el
-- navegador. Cualquiera con las herramientas de desarrollador podia saltear
-- esa pantalla y llamar directo a la API de Supabase para crear la reserva
-- igual. Mismo criterio que ya se uso para el solapamiento de funciones
-- (migracion 0005) y el saldo de credito (aplicar_credito, migracion 0016):
-- las reglas de negocio importantes se validan en la base, no solo en
-- Angular, porque Angular corre en la computadora del usuario y la base no.
create or replace function validar_edad_minima()
returns trigger as $$
declare
    v_clasificacion text;
    v_fecha_nacimiento date;
    v_edad_minima integer;
    v_edad integer;
begin
    -- Compra de solo candy bar (funcion_id null, ver migracion 0018): no hay
    -- pelicula de la cual depender, no aplica esta regla.
    if new.funcion_id is null then
        return new;
    end if;

    select p.clasificacion into v_clasificacion
    from funciones f
    join peliculas p on p.id = f.pelicula_id
    where f.id = new.funcion_id;

    v_edad_minima := case v_clasificacion
        when '+18' then 18
        when '+13' then 13
        else 0
    end;

    -- ATP (o no se encontro la funcion/pelicula): no hay restriccion que
    -- validar.
    if v_edad_minima = 0 then
        return new;
    end if;

    -- Compra anonima (usuario_id null, guest checkout permitido por el
    -- enunciado): no hay perfil del cual sacar fecha de nacimiento, asi que
    -- no hay forma de validar la edad en la base para este caso -- queda
    -- cubierto por la aclaracion de "requiere acompañamiento adulto" en la
    -- entrada, como pide el enunciado.
    if new.usuario_id is null then
        return new;
    end if;

    select fecha_nacimiento into v_fecha_nacimiento
    from perfiles
    where id = new.usuario_id;

    if v_fecha_nacimiento is null then
        return new;
    end if;

    v_edad := extract(year from age(v_fecha_nacimiento));

    if v_edad < v_edad_minima then
        raise exception 'Esta funcion es % : edad minima % años', v_clasificacion, v_edad_minima;
    end if;

    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_validar_edad_minima on reservas;

create trigger trigger_validar_edad_minima
before insert on reservas
for each row execute function validar_edad_minima();
