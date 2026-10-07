import { ClasificacionPelicula } from './pelicula';

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
    peliculaClasificacion: ClasificacionPelicula | null;
    sala: string;
    horario: string;
    formato: string;
    idioma: string;
    butacas: string[];
    butacasPorFila: { fila: string; columnas: number[] }[];
    candyItems: string[];
    total: number;
    qrCode: string;
    cancelada: boolean;
    qrValidado: boolean;
    subtotal: number;
    descuento: number;
    creditoAplicado: number;
}

export interface FilaReservaDetalle {
    id: number;
    total: number;
    qr_code: string;
    cancelada: boolean;
    qr_validado: boolean;
    subtotal: number;
    descuento: number;
    credito_aplicado: number;
    funciones: {
        horario: string;
        formato: string;
        idioma: string;
        peliculas: { id: number; titulo: string; imagen_url: string; clasificacion: ClasificacionPelicula } | null;
        salas: { nombre: string } | null;
    } | null;
    reserva_butacas: { butacas: { fila: string; columna: number } | null }[];
    reserva_productos: { cantidad: number; productos: { nombre: string } | null }[];
    reserva_combos: { cantidad: number; combos: { nombre: string } | null }[];
}

export function mapearReservaDetalle(fila: FilaReservaDetalle): ReservaDetalle {
    // El candy bar de una reserva puede venir de dos tablas distintas
    // (productos sueltos y combos armados) — los junto en una sola
    // lista de textos.
    const itemsProductos = fila.reserva_productos
        .filter((rp) => rp.productos !== null)
        .map((rp) => `${rp.productos!.nombre} x${rp.cantidad}`);
    const itemsCombos = fila.reserva_combos
        .filter((rc) => rc.combos !== null)
        .map((rc) => `${rc.combos!.nombre} x${rc.cantidad}`);

    // Mis reservas muestra las butacas agrupadas por fila ("Fila A: Butaca 5,
    // Butaca 6") agrupo una sola vez, para no parsear strings ya formateadas en el componente.
    const butacasPorFilaMap = new Map<string, number[]>();
    for (const rb of fila.reserva_butacas) {
        if (!rb.butacas) continue;
        const columnas = butacasPorFilaMap.get(rb.butacas.fila) ?? [];
        columnas.push(rb.butacas.columna);
        butacasPorFilaMap.set(rb.butacas.fila, columnas);
    }
    const butacasPorFila = Array.from(butacasPorFilaMap, ([fila, columnas]) => ({ fila, columnas })).sort(
        (a, b) => a.fila.localeCompare(b.fila),
    );

    return {
        id: fila.id,
        peliculaId: fila.funciones?.peliculas?.id ?? 0,
        peliculaTitulo: fila.funciones?.peliculas?.titulo ?? '',
        peliculaImagenUrl: fila.funciones?.peliculas?.imagen_url ?? '',
        peliculaClasificacion: fila.funciones?.peliculas?.clasificacion ?? null,
        sala: fila.funciones?.salas?.nombre ?? '',
        horario: fila.funciones?.horario ?? '',
        formato: fila.funciones?.formato ?? '',
        idioma: fila.funciones?.idioma ?? '',
        butacas: fila.reserva_butacas
            .filter((rb) => rb.butacas !== null)
            .map((rb) => `Fila ${rb.butacas!.fila}, Butaca ${rb.butacas!.columna}`),
        butacasPorFila,
        candyItems: [...itemsProductos, ...itemsCombos],
        total: fila.total,
        qrCode: fila.qr_code,
        cancelada: fila.cancelada,
        qrValidado: fila.qr_validado,
        subtotal: fila.subtotal,
        descuento: fila.descuento,
        creditoAplicado: fila.credito_aplicado,
    };
}
