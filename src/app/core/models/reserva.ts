export interface ReservaCreada {
    id: number;
    qrCode: string;
    total: number;
}

export interface ReservaDetalle {
    id: number;
    peliculaId: number;
    peliculaTitulo: string;
    peliculaImagenUrl: string;
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
        peliculas: { id: number; titulo: string; imagen_url: string } | null;
    } | null;
    reserva_butacas: { butacas: { fila: string; columna: number } | null }[];
}

export function mapearReservaDetalle(fila: FilaReservaDetalle): ReservaDetalle {
    return {
        id: fila.id,
        peliculaId: fila.funciones?.peliculas?.id ?? 0,
        peliculaTitulo: fila.funciones?.peliculas?.titulo ?? '',
        peliculaImagenUrl: fila.funciones?.peliculas?.imagen_url ?? '',
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