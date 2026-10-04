export interface Producto {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
    activo: boolean;
}

export interface NuevoProducto {
    nombre: string;
    categoria: string;
    precio: number;
}