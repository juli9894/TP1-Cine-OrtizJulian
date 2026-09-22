export interface Resena {
    id: number;
    peliculaId: number;
    usuarioId: string;
    calificacion: number;
    comentario: string | null;
    createdAt: string;
}

export interface FilaResena {
    id: number;
    pelicula_id: number;
    usuario_id: string;
    calificacion: number;
    comentario: string | null;
    created_at: string;
}

export function mapearResena(fila: FilaResena): Resena {
    return {
        id: fila.id,
        peliculaId: fila.pelicula_id,
        usuarioId: fila.usuario_id,
        calificacion: fila.calificacion,
        comentario: fila.comentario,
        createdAt: fila.created_at,
    };
}