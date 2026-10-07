-- Imagen (opcional) para cada combo, mismo patron que productos (0027).
-- Nullable por la misma razon: no obligamos a recargar combos existentes.
alter table combos add column if not exists imagen_url text;

-- Carga de las imagenes que Julian subio a public/candy/ (assets
-- bundleados con el proyecto, no Supabase Storage: ver justificacion
-- en el chat). Match por nombre exacto de cada producto/combo ya en la base.
update productos set imagen_url = '/candy/Pochoclo-grande.png' where nombre = 'Pochoclo grande';
update productos set imagen_url = '/candy/Pochoclo-chico.png' where nombre = 'Pochoclo chico';
update productos set imagen_url = '/candy/Gaseosa-grande.png' where nombre = 'Gaseosa grande';
update productos set imagen_url = '/candy/Gaseosa-chica.png' where nombre = 'Gaseosa chica linea coca';
update productos set imagen_url = '/candy/Nachos-con-queso.png' where nombre = 'Nachos';

-- Combos: no hay match exacto de nombre contra lo que ya esta cargado
-- ("Combo Clasico Editado" / "Combo Duo Editado"), asi que es un mapeo
-- tentativo por orden. Se corrige en 10 segundos desde /admin/combos
-- con el campo "Imagen" nuevo si no es el que corresponde.
update combos set imagen_url = '/candy/Combo-familia.png' where nombre = 'Combo Clásico Editado';
update combos set imagen_url = '/candy/Combo-mega-recargado.png' where nombre = 'Combo Duo Editado';
