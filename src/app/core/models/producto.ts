export interface Producto {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
    activo: boolean;
    imagenUrl: string | null;
}

export interface FilaProducto {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
    activo: boolean;
    imagen_url: string | null;
}

// Primera columna de mas de una palabra que tiene Producto (imagen_url) --
// hasta ahora nombre/categoria/precio/activo no necesitaban el patron
// Fila/mapear() porque ya eran una sola palabra, igual en snake_case y en
// camelCase.
export function mapearProducto(fila: FilaProducto): Producto {
    return {
        id: fila.id,
        nombre: fila.nombre,
        categoria: fila.categoria,
        precio: fila.precio,
        activo: fila.activo,
        imagenUrl: fila.imagen_url,
    };
}

export interface NuevoProducto {
    nombre: string;
    categoria: string;
    precio: number;
    imagenUrl: string | null;
}
