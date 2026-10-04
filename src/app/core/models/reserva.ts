export interface ReservaCreada {
    id: number;
    qrCode: string;
    total: number;
}

export interface ReservaDetalle {
    id: number;
    peliculaTitulo: string;
    horario: string;
    formato: string;
    idioma: string;
    butacas: string[];
    total: number;
    qrCode: string;
    cancelada: boolean;
}

export interface FilaReservaDetalle {
    id: number;
    total: number;
    qr_code: string;
    cancelada: boolean;
    funciones: {
        horario: string;
        formato: string;
        idioma: string;
        peliculas: { titulo: string } | null;
    } | null;
    reserva_butacas: { butacas: { fila: string; columna: number } | null }[];
}

export function mapearReservaDetalle(fila: FilaReservaDetalle): ReservaDetalle {
    return {
        id: fila.id,
        peliculaTitulo: fila.funciones?.peliculas?.titulo ?? '',
        horario: fila.funciones?.horario ?? '',
        formato: fila.funciones?.formato ?? '',
        idioma: fila.funciones?.idioma ?? '',
        butacas: fila.reserva_butacas
            .filter((rb) => rb.butacas !== null)
            .map((rb) => `Fila ${rb.butacas!.fila}, Butaca ${rb.butacas!.columna}`),
        total: fila.total,
        qrCode: fila.qr_code,
        cancelada: fila.cancelada,
    };
}