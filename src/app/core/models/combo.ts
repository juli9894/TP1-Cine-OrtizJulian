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
