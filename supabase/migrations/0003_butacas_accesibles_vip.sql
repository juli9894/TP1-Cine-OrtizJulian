create or replace function generar_butacas(p_sala_id integer)
returns void as $$
declare
  letras text[] := array['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','Q','R','S','T'];
  fila text;
  col integer;
  cantidad_columnas integer;
  tipo_butaca text;
begin
  foreach fila in array letras loop
    if fila = 'J' then
      cantidad_columnas := 14;
      tipo_butaca := 'accesible';
    elsif fila in ('R', 'S', 'T') then
      cantidad_columnas := 28;
      tipo_butaca := 'vip';
    else
      cantidad_columnas := 28;
      tipo_butaca := 'normal';
    end if;

    for col in 1..cantidad_columnas loop
      insert into butacas (sala_id, fila, columna, tipo)
      values (p_sala_id, fila, col, tipo_butaca);
    end loop;
  end loop;
end;
$$ language plpgsql;