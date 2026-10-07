export interface Combo {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    activo: boolean;
    imagenUrl: string | null;
}

export interface FilaCombo {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    activo: boolean;
    imagen_url: string | null;
}

// Mismo patron que Producto/FilaProducto/mapearProducto: la unica columna
// de mas de una palabra (imagen_url) es la que obliga a mapear en vez de
// tipar la fila de la base directo como Combo.
export function mapearCombo(fila: FilaCombo): Combo {
    return {
        id: fila.id,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        precio: fila.precio,
        activo: fila.activo,
        imagenUrl: fila.imagen_url,
    };
}

export interface NuevoCombo {
    nombre: string;
    descripcion: string;
    precio: number;
    imagenUrl: string | null;
}
