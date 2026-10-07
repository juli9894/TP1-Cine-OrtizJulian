import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';

export interface ReporteFacturacion {
    fecha: string;
    totalFacturado: number;
    entradasVendidas: number;
}

export interface ReporteSemanal {
    desde: string;
    hasta: string;
    totalFacturado: number;
    entradasVendidas: number;
    dias: ReporteFacturacion[];
}

export interface ItemMasVendido {
    nombre: string;
    cantidad: number;
}

interface FilaReservaResumen {
    id: number;
    total: number;
}

interface FilaReservaConFecha {
    id: number;
    total: number;
    created_at: string;
}

interface FilaProductoVendido {
    cantidad: number;
    productos: { nombre: string } | null;
}

@Service()
export class ReportesService {
    private readonly supabase = inject(SupabaseClientService).client;

    // Facturacion y entradas vendidas de un dia puntual (00:00 a 23:59:59
    // locales). Mismo patron de dos consultas encadenadas que ya usa
    // ButacasService.obtenerIdsOcupados(): primero se resuelven las
    // reservas del dia, despues se cuentan las butacas asociadas a esas
    // reservas -- reserva_butacas no tiene una columna de fecha propia.
    async facturacionDiaria(fecha: string): Promise<ReporteFacturacion> {
        const desde = `${fecha}T00:00:00`;
        const hasta = `${fecha}T23:59:59`;

        const { data: reservas, error } = await this.supabase
            .from('reservas')
            .select('id, total')
            .eq('cancelada', false)
            .gte('created_at', desde)
            .lte('created_at', hasta)
            .overrideTypes<FilaReservaResumen[], { merge: false }>();
        if (error) throw error;

        const totalFacturado = (reservas ?? []).reduce((suma, r) => suma + Number(r.total), 0);
        const idsReservas = (reservas ?? []).map((r) => r.id);

        let entradasVendidas = 0;
        if (idsReservas.length > 0) {
            const { count, error: errorButacas } = await this.supabase
                .from('reserva_butacas')
                .select('id', { count: 'exact', head: true })
                .in('reserva_id', idsReservas);
            if (errorButacas) throw errorButacas;
            entradasVendidas = count ?? 0;
        }

        return { fecha, totalFacturado, entradasVendidas };
    }

    // Igual que facturacionDiaria, pero para una semana completa (7 dias
    // a partir de fechaInicio) -- a pedido de Julian, un reporte de un
    // solo dia quedaba "pobre" para mostrar en la defensa. En vez de
    // llamar 7 veces a facturacionDiaria (7 ida y vueltas a la base), se
    // trae TODA la semana en una sola consulta y se reparte por dia en
    // el cliente con un Map -- mismo criterio de "una sola consulta en
    // vez de un loop" que ya se uso en productosMasVendidos().
    async facturacionSemanal(fechaInicio: string): Promise<ReporteSemanal> {
        const dias = diasDeLaSemana(fechaInicio);
        const fechaFin = dias[dias.length - 1];

        const { data: reservas, error } = await this.supabase
            .from('reservas')
            .select('id, total, created_at')
            .eq('cancelada', false)
            .gte('created_at', `${fechaInicio}T00:00:00`)
            .lte('created_at', `${fechaFin}T23:59:59`)
            .overrideTypes<FilaReservaConFecha[], { merge: false }>();
        if (error) throw error;

        const totalPorDia = new Map<string, number>();
        const idsPorDia = new Map<string, number[]>();
        for (const dia of dias) {
            totalPorDia.set(dia, 0);
            idsPorDia.set(dia, []);
        }

        for (const r of reservas ?? []) {
            const dia = r.created_at.slice(0, 10);
            if (!totalPorDia.has(dia)) continue;
            totalPorDia.set(dia, totalPorDia.get(dia)! + Number(r.total));
            idsPorDia.get(dia)!.push(r.id);
        }

        const idsTotales = (reservas ?? []).map((r) => r.id);
        const diaPorReserva = new Map<number, string>();
        for (const [dia, ids] of idsPorDia) {
            for (const id of ids) diaPorReserva.set(id, dia);
        }

        const entradasPorDia = new Map<string, number>(dias.map((d) => [d, 0]));
        if (idsTotales.length > 0) {
            const { data: butacas, error: errorButacas } = await this.supabase
                .from('reserva_butacas')
                .select('reserva_id')
                .in('reserva_id', idsTotales);
            if (errorButacas) throw errorButacas;

            for (const b of butacas ?? []) {
                const dia = diaPorReserva.get(b.reserva_id);
                if (dia) entradasPorDia.set(dia, (entradasPorDia.get(dia) ?? 0) + 1);
            }
        }

        const diasReporte: ReporteFacturacion[] = dias.map((fecha) => ({
            fecha,
            totalFacturado: totalPorDia.get(fecha) ?? 0,
            entradasVendidas: entradasPorDia.get(fecha) ?? 0,
        }));

        return {
            desde: fechaInicio,
            hasta: fechaFin,
            totalFacturado: diasReporte.reduce((suma, d) => suma + d.totalFacturado, 0),
            entradasVendidas: diasReporte.reduce((suma, d) => suma + d.entradasVendidas, 0),
            dias: diasReporte,
        };
    }

    // Top 5 peliculas por ventas -- reutiliza la columna `ventas` ya usada
    // para el Top 3 del Home, solo que con un ranking mas largo.
    async peliculasMasVistas(): Promise<ItemMasVendido[]> {
        const { data, error } = await this.supabase
            .from('peliculas')
            .select('titulo, ventas')
            .order('ventas', { ascending: false })
            .limit(5)
            .overrideTypes<{ titulo: string; ventas: number }[], { merge: false }>();
        if (error) throw error;
        return (data ?? []).map((p) => ({ nombre: p.titulo, cantidad: p.ventas }));
    }

    // Productos de candy bar mas vendidos: select anidado (mismo patron ya
    // usado en ReservaDetalle) para traer el nombre del producto junto con
    // la cantidad vendida en cada fila de reserva_productos, sin armar un
    // join manual aparte. La suma por producto se hace en el cliente con
    // un Map, porque son pocas filas (no amerita una funcion de Postgres).
    async productosMasVendidos(): Promise<ItemMasVendido[]> {
        const { data, error } = await this.supabase
            .from('reserva_productos')
            .select('cantidad, productos ( nombre )')
            .overrideTypes<FilaProductoVendido[], { merge: false }>();
        if (error) throw error;

        const totales = new Map<string, number>();
        for (const fila of data ?? []) {
            const nombre = fila.productos?.nombre ?? 'Producto eliminado';
            totales.set(nombre, (totales.get(nombre) ?? 0) + fila.cantidad);
        }

        return [...totales.entries()]
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);
    }
}

// 7 fechas 'YYYY-MM-DD' consecutivas a partir de fechaInicio, armadas a
// mano (sin pasar por Date() para el calculo final) para no repetir el
// mismo bug de timezone que ya encontramos y corregimos en SelectorFecha:
// partimos fechaInicio con un "T00:00:00" explicito para que Date lo
// interprete en hora LOCAL, no UTC.
function diasDeLaSemana(fechaInicio: string): string[] {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const dias: string[] = [];

    for (let i = 0; i < 7; i++) {
        const dia = new Date(inicio);
        dia.setDate(dia.getDate() + i);
        const anio = dia.getFullYear();
        const mes = String(dia.getMonth() + 1).padStart(2, '0');
        const numeroDia = String(dia.getDate()).padStart(2, '0');
        dias.push(`${anio}-${mes}-${numeroDia}`);
    }

    return dias;
}
