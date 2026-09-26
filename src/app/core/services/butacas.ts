import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Butaca, FilaButaca, mapearButaca } from '../models/butaca';
import { Observable } from 'rxjs';

@Service()
export class ButacasService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerButacasDeSala(salaId: number): Promise<Butaca[]> {
        const { data, error } = await this.supabase
            .from('butacas')
            .select('*')
            .eq('sala_id', salaId)
            .order('fila')
            .order('columna')
            .overrideTypes<FilaButaca[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map(mapearButaca);
    }

    async obtenerIdsOcupados(funcionId: number): Promise<number[]> {
        const { data: reservas, error: errorReservas } = await this.supabase
            .from('reservas')
            .select('id')
            .eq('funcion_id', funcionId)
            .overrideTypes<{ id: number }[], { merge: false }>();

        if (errorReservas) throw errorReservas;

        const idsReservas = (reservas ?? []).map((fila) => fila.id);

        if (idsReservas.length === 0) return [];

        const { data: reservaButacas, error: errorReservaButacas } = await this.supabase
            .from('reserva_butacas')
            .select('butaca_id')
            .in('reserva_id', idsReservas)
            .overrideTypes<{ butaca_id: number }[], { merge: false }>();

        if (errorReservaButacas) throw errorReservaButacas;

        return (reservaButacas ?? []).map((fila) => fila.butaca_id);
    }

    suscribirseAButacasOcupadas(funcionId: number): Observable<number[]> {
        return new Observable<number[]>((observador) => {
            const canal = this.supabase
                .channel(`reservas-funcion-${funcionId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'reservas', filter: `funcion_id=eq.${funcionId}` },
                    async () => {
                        const ids = await this.obtenerIdsOcupados(funcionId);
                        observador.next(ids);
                    }
                )
                .subscribe();

            return () => {
                canal.unsubscribe();
            };
        });
    }
}