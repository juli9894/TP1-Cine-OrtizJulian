export interface CatalogoPunto {
    id: number;
    descripcion: string;
    puntosRequeridos: number;
    valorCredito: number;
    activo: boolean;
}

export interface FilaCatalogoPunto {
    id: number;
    descripcion: string;
    puntos_requeridos: number;
    valor_credito: number;
    activo: boolean;
}

export function mapearCatalogoPunto(fila: FilaCatalogoPunto): CatalogoPunto {
    return {
        id: fila.id,
        descripcion: fila.descripcion,
        puntosRequeridos: fila.puntos_requeridos,
        valorCredito: fila.valor_credito,
        activo: fila.activo,
    };
}