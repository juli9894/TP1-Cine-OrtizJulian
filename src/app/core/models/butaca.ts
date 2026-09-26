export type TipoButaca = 'normal' | 'accesible' | 'vip';

export interface Butaca {
    id: number;
    salaId: number;
    fila: string;
    columna: number;
    tipo: TipoButaca;
}

export interface FilaButaca {
    id: number;
    sala_id: number;
    fila: string;
    columna: number;
    tipo: TipoButaca;
}

export function mapearButaca(fila: FilaButaca): Butaca {
    return {
        id: fila.id,
        salaId: fila.sala_id,
        fila: fila.fila,
        columna: fila.columna,
        tipo: fila.tipo,
    };
}