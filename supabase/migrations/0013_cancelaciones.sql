-- Cancelaciones con credito interno (no reembolso monetario).
-- Permitido hasta 2 horas antes de la funcion. Solo para compras con
-- cuenta logueada (una compra de invitado no tiene a quien acreditarle
-- el credito).

alter table perfiles
    add column if not exists saldo_credito numeric not null default 0;

alter table reservas
    add column if not exists cancelada boolean not null default false;

-- Cancela una reserva y acredita su total como credito interno, todo en
-- una sola transaccion de Postgres (no en dos pasos separados desde
-- Angular) para que nunca pueda quedar "cancelada pero sin acreditar" si
-- algo falla en el medio -- mismo motivo por el que sumar_puntos
-- (migracion 0012) corre en la base en vez de leer/escribir el saldo
-- desde el cliente. El chequeo de las 2 horas se repite aca tambien
-- (ademas de en Angular, para feedback inmediato) para que la regla sea
-- imposible de saltear sin importar desde donde se llame -- mismo
-- criterio que el trigger de solapamiento de horarios (migracion 0005).
create or replace function cancelar_reserva(p_reserva_id integer, p_usuario_id uuid)
returns void as $$
declare
    v_usuario_id uuid;
    v_cancelada boolean;
    v_horario timestamptz;
    v_total numeric;
begin
    select r.usuario_id, r.cancelada, r.total, f.horario
    into v_usuario_id, v_cancelada, v_total, v_horario
    from reservas r
    join funciones f on f.id = r.funcion_id
    where r.id = p_reserva_id;

    if v_usuario_id is null or v_usuario_id is distinct from p_usuario_id then
        raise exception 'Esta reserva no pertenece a este usuario';
    end if;

    if v_cancelada then
        raise exception 'Esta reserva ya estaba cancelada';
    end if;

    if v_horario - now() < interval '2 hours' then
        raise exception 'Ya no se puede cancelar: faltan menos de 2 horas para la funcion';
    end if;

    update reservas set cancelada = true where id = p_reserva_id;
    update perfiles set saldo_credito = saldo_credito + v_total where id = p_usuario_id;
end;
$$ language plpgsql;
