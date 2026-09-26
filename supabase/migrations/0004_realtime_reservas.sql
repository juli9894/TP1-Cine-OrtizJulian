-- Habilita Supabase Realtime sobre la tabla reservas, para que la
-- pantalla de seleccion de butacas pueda enterarse en vivo cuando
-- se crea una reserva nueva para la funcion que se esta mirando.
alter publication supabase_realtime add table reservas;
