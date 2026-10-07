export type ClasificacionPelicula = 'ATP' | '+13' | '+18';

export interface Pelicula {
    id: number;
    titulo: string;
    duracionMinutos: number;
    sinopsis: string;
    imagenUrl: string;
    ventas: number;
    clasificacion: ClasificacionPelicula;
    fechaEstreno: string;
    diasPreventa: number;
    precioPreventa: number | null;
}

export interface FilaPelicula {
    id: number;
    titulo: string;
    duracion_minutos: number;
    sinopsis: string;
    imagen_url: string;
    ventas: number;
    clasificacion: ClasificacionPelicula;
    fecha_estreno: string;
    dias_preventa: number;
    precio_preventa: number | null;
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
        fechaEstreno: fila.fecha_estreno,
        diasPreventa: fila.dias_preventa,
        precioPreventa: fila.precio_preventa,
    };
}

export interface NuevaPelicula {
    titulo: string;
    duracionMinutos: number;
    sinopsis: string;
    imagenUrl: string;
    clasificacion: ClasificacionPelicula;
    fechaEstreno: string;
    diasPreventa: number;
    precioPreventa: number | null;
}