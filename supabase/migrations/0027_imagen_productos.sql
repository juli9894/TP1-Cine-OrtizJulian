-- Imagen (opcional) para cada producto del candy bar, a pedido de Julian
-- para que el panel de compra se vea menos "pelado". Nullable: los
-- productos ya cargados quedan sin imagen (se muestra un placeholder en
-- la UI) hasta que el admin les cargue una URL.
alter table productos add column if not exists imagen_url text;
