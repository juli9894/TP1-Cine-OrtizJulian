export interface Canje {
    id: number;
    descripcion: string;
    puntosGastados: number;
    creditoOtorgado: number;
    createdAt: string;
}

export interface FilaCanje {
    id: number;
    puntos_gastados: number;
    credito_otorgado: number;
    created_at: string;
    catalogo_puntos: { descripcion: string } | null;
}

export function mapearCanje(fila: FilaCanje): Canje {
    return {
        id: fila.id,
        descripcion: fila.catalogo_puntos?.descripcion ?? '',
        puntosGastados: fila.puntos_gastados,
        creditoOtorgado: fila.credito_otorgado,
        createdAt: fila.created_at,
    };
}