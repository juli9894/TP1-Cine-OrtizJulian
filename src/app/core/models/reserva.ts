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
    sala: string;
    horario: string;
    formato: string;
    idioma: string;
    butacas: string[];
    candyItems: string[];
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
        salas: { nombre: string } | null;
    } | null;
    reserva_butacas: { butacas: { fila: string; columna: number } | null }[];
    reserva_productos: { cantidad: number; productos: { nombre: string } | null }[];
    reserva_combos: { cantidad: number; combos: { nombre: string } | null }[];
}

export function mapearReservaDetalle(fila: FilaReservaDetalle): ReservaDetalle {
    // El candy bar de una reserva puede venir de dos tablas distintas
    // (productos sueltos y combos armados) — acá los juntamos en una sola
    // lista de textos, igual que hace itemsSeleccionados() en el carrito.
    const itemsProductos = fila.reserva_productos
        .filter((rp) => rp.productos !== null)
        .map((rp) => `${rp.cantidad}x ${rp.productos!.nombre}`);
    const itemsCombos = fila.reserva_combos
        .filter((rc) => rc.combos !== null)
        .map((rc) => `${rc.cantidad}x ${rc.combos!.nombre}`);

    return {
        id: fila.id,
        peliculaId: fila.funciones?.peliculas?.id ?? 0,
        peliculaTitulo: fila.funciones?.peliculas?.titulo ?? '',
        peliculaImagenUrl: fila.funciones?.peliculas?.imagen_url ?? '',
        sala: fila.funciones?.salas?.nombre ?? '',
        horario: fila.funciones?.horario ?? '',
        formato: fila.funciones?.formato ?? '',
        idioma: fila.funciones?.idioma ?? '',
        butacas: fila.reserva_butacas
            .filter((rb) => rb.butacas !== null)
            .map((rb) => `Fila ${rb.butacas!.fila}, Butaca ${rb.butacas!.columna}`),
        candyItems: [...itemsProductos, ...itemsCombos],
        total: fila.total,
        qrCode: fila.qr_code,
        cancelada: fila.cancelada,
    };
}
