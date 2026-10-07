import { Pelicula } from '../models/pelicula';

// Los tres estados de venta de una pelicula, segun la fecha de hoy contra
// fecha_estreno y dias_preventa (configurable por pelicula):
//   'proximamente' -> todavia no se vende nada, falta mas de dias_preventa
//                      para el estreno.
//   'preventa'      -> ya se puede comprar, a precio_preventa si esta
//                      configurado (si no, al precio normal de siempre).
//   'normal'        -> ya paso el estreno, precio normal de siempre.
export type EstadoVentaPelicula = 'proximamente' | 'preventa' | 'normal';

export function calcularEstadoVenta(pelicula: Pelicula): EstadoVentaPelicula {
    const hoy = new Date();
    const estreno = new Date(pelicula.fechaEstreno);
    const aperturaPreventa = new Date(estreno);
    aperturaPreventa.setDate(aperturaPreventa.getDate() - pelicula.diasPreventa);

    if (hoy < aperturaPreventa) return 'proximamente';
    if (hoy < estreno) return 'preventa';
    return 'normal';
}
