export interface Canje {
    id: number;
    puntosGastados: number;
    creditoOtorgado: number;
    createdAt: string;
}

export interface FilaCanje {
    id: number;
    puntos_gastados: number;
    credito_otorgado: number;
    created_at: string;
}

export function mapearCanje(fila: FilaCanje): Canje {
    return {
        id: fila.id,
        puntosGastados: fila.puntos_gastados,
        creditoOtorgado: fila.credito_otorgado,
        createdAt: fila.created_at,
    };
}