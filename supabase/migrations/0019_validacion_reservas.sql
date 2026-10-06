-- Rol Empleado: validar el ingreso (entradas) o la entrega del candy bar
-- escaneando o tipeando el codigo QR de una reserva. La columna qr_validado
-- ya existia desde el schema original (migracion 0001), pero nunca se usaba
-- desde ningun lado de la app -- esta es la primera vez que se conecta.
--
-- Mismo criterio de atomicidad que cancelar_reserva (migracion 0013) /
-- sumar_puntos (migracion 0012) / aplicar_credito (migracion 0015): el
-- chequeo ("no esta cancelada", "no fue validada antes") y la escritura
-- pasan en una sola transaccion de Postgres, nunca en dos pasos separados
-- desde Angular -- evita que dos escaneos casi simultaneos del mismo QR
-- lo validen a la vez. El "select ... for update" bloquea la fila mientras
-- dura la funcion, asi que un segundo escaneo concurrente espera a que
-- termine el primero y recien ahi ve qr_validado = true.
create or replace function validar_reserva(p_qr_code uuid)
returns void as $$
declare
    v_cancelada boolean;
    v_validado boolean;
begin
    select cancelada, qr_validado
    into v_cancelada, v_validado
    from reservas
    where qr_code = p_qr_code
    for update;

    if not found then
        raise exception 'No existe ninguna reserva con ese codigo';
    end if;

    if v_cancelada then
        raise exception 'Esta reserva fue cancelada, no es valida';
    end if;

    if v_validado then
        raise exception 'Este codigo ya fue validado antes';
    end if;

    update reservas set qr_validado = true where qr_code = p_qr_code;
end;
$$ language plpgsql;
