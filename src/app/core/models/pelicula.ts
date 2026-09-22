export interface Pelicula {
    id: number;
    titulo: string;
    duracionMinutos: number;
    sinopsis: string;
    imagenUrl: string;
    ventas: number;
}

export interface FilaPelicula {
    id: number;
    titulo: string;
    duracion_minutos: number;
    sinopsis: string;
    imagen_url: string;
    ventas: number;
}

export function mapearPelicula(fila: FilaPelicula): Pelicula {
    return {
        id: fila.id,
        titulo: fila.titulo,
        duracionMinutos: fila.duracion_minutos,
        sinopsis: fila.sinopsis,
        imagenUrl: fila.imagen_url,
        ventas: fila.ventas,
    };
}