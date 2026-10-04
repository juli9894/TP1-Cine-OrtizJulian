import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { PreciosButacaService } from './precios-butaca';
import { RecargosFormatoService } from './recargos-formatos';
import { PrecioButaca } from '../models/precio-butaca';
import { RecargoFormato } from '../models/recargo-formato';
import { Funcion } from '../models/funcion';
import { Butaca } from '../models/butaca';
import { ReservaCreada } from '../models/reserva';

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

    async crear(
        funcion: Funcion,
        butacasSeleccionadas: Butaca[],
        usuarioId: string | null,
        total: number,
    ): Promise<ReservaCreada> {
        const { data, error } = await this.supabase
            .from('reservas')
            .insert({ usuario_id: usuarioId, funcion_id: funcion.id, total })
            .select('id, qr_code')
            .single();
        if (error) throw error;

        const filas = butacasSeleccionadas.map((butaca) => ({
            reserva_id: data.id,
            butaca_id: butaca.id,
        }));

        const { error: errorButacas } = await this.supabase.from('reserva_butacas').insert(filas);
        if (errorButacas) throw errorButacas;

        return { id: data.id, qrCode: data.qr_code, total };
    }
}