export interface Cupon {
    id: number;
    tipo: string;
    porcentajeDescuento: number;
    activo: boolean;
}

export interface FilaCupon {
    id: number;
    tipo: string;
    porcentaje_descuento: number;
    activo: boolean;
}

export function mapearCupon(fila: FilaCupon): Cupon {
    return {
        id: fila.id,
        tipo: fila.tipo,
        porcentajeDescuento: fila.porcentaje_descuento,
        activo: fila.activo,
    };
}