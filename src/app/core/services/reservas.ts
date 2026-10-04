import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { PreciosButacaService } from './precios-butaca';
import { RecargosFormatoService } from './recargos-formatos';
import { PrecioButaca } from '../models/precio-butaca';
import { RecargoFormato } from '../models/recargo-formato';
import { Funcion } from '../models/funcion';
import { Butaca } from '../models/butaca';
import { Producto } from '../models/producto';
import { Combo } from '../models/combo';
import { ReservaCreada } from '../models/reserva';

export interface ProductoSeleccionado {
    productoId: number;
    cantidad: number;
}

export interface ComboSeleccionado {
    comboId: number;
    cantidad: number;
}

@Service()
export class ReservasService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly preciosService = inject(PreciosButacaService);
    private readonly recargosService = inject(RecargosFormatoService);

    async obtenerTarifas(): Promise<{ precios: PrecioButaca[]; recargos: RecargoFormato[] }> {
        const [precios, recargos] = await Promise.all([
            this.preciosService.obtenerTodos(),
            this.recargosService.obtenerTodos(),
        ]);
        return { precios, recargos };
    }

    calcularTotal(
        funcion: Funcion,
        butacasSeleccionadas: Butaca[],
        precios: PrecioButaca[],
        recargos: RecargoFormato[],
    ): number {
        const recargo = recargos.find((r) => r.formato === funcion.formato)?.recargo ?? 0;
        return butacasSeleccionadas.reduce((total, butaca) => {
            const precio = precios.find((p) => p.tipo === butaca.tipo)?.precio ?? 0;
            return total + precio + recargo;
        }, 0);
    }

    calcularTotalCandy(
        productosSeleccionados: ProductoSeleccionado[],
        combosSeleccionados: ComboSeleccionado[],
        productos: Producto[],
        combos: Combo[],
    ): number {
        const totalProductos = productosSeleccionados.reduce((total, sel) => {
            const precio = productos.find((p) => p.id === sel.productoId)?.precio ?? 0;
            return total + precio * sel.cantidad;
        }, 0);

        const totalCombos = combosSeleccionados.reduce((total, sel) => {
            const precio = combos.find((c) => c.id === sel.comboId)?.precio ?? 0;
            return total + precio * sel.cantidad;
        }, 0);

        return totalProductos + totalCombos;
    }

    async crear(
        funcion: Funcion,
        butacasSeleccionadas: Butaca[],
        usuarioId: string | null,
        total: number,
        productosSeleccionados: ProductoSeleccionado[],
        combosSeleccionados: ComboSeleccionado[],
    ): Promise<ReservaCreada> {
        const { data, error } = await this.supabase
            .from('reservas')
            .insert({ usuario_id: usuarioId, funcion_id: funcion.id, total })
            .select('id, qr_code')
            .single();
        if (error) throw error;

        const filasButacas = butacasSeleccionadas.map((butaca) => ({
            reserva_id: data.id,
            butaca_id: butaca.id,
        }));
        const { error: errorButacas } = await this.supabase.from('reserva_butacas').insert(filasButacas);
        if (errorButacas) throw errorButacas;

        if (productosSeleccionados.length > 0) {
            const filasProductos = productosSeleccionados.map((p) => ({
                reserva_id: data.id,
                producto_id: p.productoId,
                cantidad: p.cantidad,
            }));
            const { error: errorProductos } = await this.supabase.from('reserva_productos').insert(filasProductos);
            if (errorProductos) throw errorProductos;
        }

        if (combosSeleccionados.length > 0) {
            const filasCombos = combosSeleccionados.map((c) => ({
                reserva_id: data.id,
                combo_id: c.comboId,
                cantidad: c.cantidad,
            }));
            const { error: errorCombos } = await this.supabase.from('reserva_combos').insert(filasCombos);
            if (errorCombos) throw errorCombos;
        }

        return { id: data.id, qrCode: data.qr_code, total };
    }
}