export type FormatoFuncion = '2D' | '3D' | '4D' | '5D';
export type IdiomaFuncion = 'castellano' | 'subtitulada';

export interface Funcion {
    id: number;
    peliculaId: number;
    salaId: number;
    horario: string;
    formato: FormatoFuncion;
    idioma: IdiomaFuncion;
}

export interface FilaFuncion {
    id: number;
    pelicula_id: number;
    sala_id: number;
    horario: string;
    formato: FormatoFuncion;
    idioma: IdiomaFuncion;
}

export function mapearFuncion(fila: FilaFuncion): Funcion {
    return {
        id: fila.id,
        peliculaId: fila.pelicula_id,
        salaId: fila.sala_id,
        horario: fila.horario,
        formato: fila.formato,
        idioma: fila.idioma,
    };
}