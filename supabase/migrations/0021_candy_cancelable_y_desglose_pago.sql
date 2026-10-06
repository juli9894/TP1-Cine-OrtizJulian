-- Dos pedidos de Julian, 6 oct:
-- 1) Las reservas de "solo candy" (funcion_id null, migracion 0018) no se
--    podian cancelar nunca: cancelar_reserva hacia un INNER JOIN contra
--    funciones, y una reserva sin funcion simplemente no aparecia en el
--    resultado (quedaba "sin usuario", y tiraba "no pertenece a este
--    usuario"). Se cambia a LEFT JOIN, y el chequeo de las 2 horas se
--    saltea cuando no hay horario (no hay funcion de la cual depender).
-- 2) El total final de una compra pagada con cupon/credito solo mostraba
--    "Total pagado: $0" sin explicar por que -- se persiste el desglose
--    (subtotal, descuento, credito aplicado) para poder mostrarlo despues,
--    tanto en la pantalla de confirmacion como en "Mis reservas".
create or replace function cancelar_reserva(p_reserva_id integer, p_usuario_id uuid)
returns void as $$
declare
    v_usuario_id uuid;
    v_cancelada boolean;
    v_validado boolean;
    v_horario timestamptz;
    v_total numeric;
begin
    select r.usuario_id, r.cancelada, r.qr_validado, r.total, f.horario
    into v_usuario_id, v_cancelada, v_validado, v_total, v_horario
    from reservas r
    left join funciones f on f.id = r.funcion_id
    where r.id = p_reserva_id;

    if v_usuario_id is null or v_usuario_id is distinct from p_usuario_id then
        raise exception 'Esta reserva no pertenece a este usuario';
    end if;

    if v_cancelada then
        raise exception 'Esta reserva ya estaba cancelada';
    end if;

    if v_validado then
        raise exception 'Esta reserva ya fue validada (entrada usada o candy entregado) y no se puede cancelar';
    end if;

    -- Sin funcion asociada (compra de solo candy) no hay horario contra el
    -- cual medir las 2 horas -- el candy se puede cancelar en cualquier
    -- momento mientras no haya sido entregado (qr_validado, chequeado arriba).
    if v_horario is not null and v_horario - now() < interval '2 hours' then
        raise exception 'Ya no se puede cancelar: faltan menos de 2 horas para la funcion';
    end if;

    update reservas set cancelada = true where id = p_reserva_id;
    update perfiles set saldo_credito = saldo_credito + v_total where id = p_usuario_id;
end;
$$ language plpgsql;

alter table reservas add column if not exists subtotal numeric not null default 0;
alter table reservas add column if not exists descuento numeric not null default 0;
alter table reservas add column if not exists credito_aplicado numeric not null default 0;
