-- Agrega el rol de cada usuario a la tabla perfiles.
-- Por default todos son 'cliente'. 'empleado' se usa después (Sprint 5,
-- escáner de QR); 'admin' es quien puede entrar al panel de administración.
-- El check constraint evita que se guarde cualquier otro valor por error
-- (por ejemplo un typo como 'Admin' con mayúscula, o 'administrador').
alter table perfiles
    add column if not exists rol text not null default 'cliente'
    check (rol in ('cliente', 'empleado', 'admin'));
