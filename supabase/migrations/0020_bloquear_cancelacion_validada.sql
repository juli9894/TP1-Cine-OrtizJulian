-- Bug encontrado Julian probando el rol Empleado: una reserva ya
-- VALIDADA (entrada escaneada / candy ya entregado)
--la regla se valida en la base, no solo en Angular, para que sea imposible de
-- saltear sin importar desde donde se llame a cancelar_reserva.
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
    join funciones f on f.id = r.funcion_id
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

    if v_horario - now() < interval '2 hours' then
        raise exception 'Ya no se puede cancelar: faltan menos de 2 horas para la funcion';
    end if;

    update reservas set cancelada = true where id = p_reserva_id;
    update perfiles set saldo_credito = saldo_credito + v_total where id = p_usuario_id;
end;
$$ language plpgsql;
