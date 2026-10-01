export type ClasificacionPelicula = 'ATP' | '+13' | '+18';

export interface Pelicula {
    id: number;
    titulo: string;
    duracionMinutos: number;
    sinopsis: string;
    imagenUrl: string;
    ventas: number;
    clasificacion: ClasificacionPelicula;
}

export interface FilaPelicula {
    id: number;
    titulo: string;
    duracion_minutos: number;
    sinopsis: string;
    imagen_url: string;
    ventas: number;
    clasificacion: ClasificacionPelicula;
}

export function mapearPelicula(fila: FilaPelicula): Pelicula {
    return {
        id: fila.id,
        titulo: fila.titulo,
        duracionMinutos: fila.duracion_minutos,
        sinopsis: fila.sinopsis,
        imagenUrl: fila.imagen_url,
        ventas: fila.ventas,
        clasificacion: fila.clasificacion,
    };
}

export interface NuevaPelicula {
    titulo: string;
    duracionMinutos: number;
    sinopsis: string;
    imagenUrl: string;
    clasificacion: ClasificacionPelicula;
}