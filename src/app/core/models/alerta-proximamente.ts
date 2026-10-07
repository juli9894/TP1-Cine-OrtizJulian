export interface AlertaProximamente {
    id: number;
    peliculaId: number;
    notificada: boolean;
}

export interface FilaAlertaProximamente {
    id: number;
    pelicula_id: number;
    notificada: boolean;
}

export function mapearAlertaProximamente(fila: FilaAlertaProximamente): AlertaProximamente {
    return {
        id: fila.id,
        peliculaId: fila.pelicula_id,
        notificada: fila.notificada,
    };
}
