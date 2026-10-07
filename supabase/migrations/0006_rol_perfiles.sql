-- Agrega el rol de cada usuario a la tabla perfiles.
-- Por default todos son 'cliente'. 
alter table perfiles
    add column if not exists rol text not null default 'cliente'
    check (rol in ('cliente', 'empleado', 'admin'));
