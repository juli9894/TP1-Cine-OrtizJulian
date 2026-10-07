import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { calcularEstadoVenta } from '../utils/preventa';
import { Pelicula, FilaPelicula, mapearPelicula } from '../models/pelicula';

// Alertas de "avisame cuando salga a la venta" para la seccion Proximamente.
// Version simple (decidida con Julian, 6 oct): se guarda en la base quien se
// suscribio a que pelicula, y se le avisa con un toast en la app la primera
// vez que entra despues de que la preventa de esa pelicula abrio. No es push
// real (no llega si la app esta cerrada) -- eso necesitaria Service Worker +
// backend que dispare el push, que es la parte de PWA que quedo para el
// final del proyecto. Decision de alcance documentada, no un olvido.
@Service()
export class AlertasProximamenteService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerPeliculaIdsDeUsuario(usuarioId: string): Promise<number[]> {
        const { data, error } = await this.supabase
            .from('alertas_proximamente')
            .select('pelicula_id')
            .eq('usuario_id', usuarioId)
            .overrideTypes<{ pelicula_id: number }[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map((fila) => fila.pelicula_id);
    }

    async activar(usuarioId: string, peliculaId: number): Promise<void> {
        const { error } = await this.supabase
            .from('alertas_proximamente')
            .insert({ usuario_id: usuarioId, pelicula_id: peliculaId });

        if (error) throw error;
    }

    async desactivar(usuarioId: string, peliculaId: number): Promise<void> {
        const { error } = await this.supabase
            .from('alertas_proximamente')
            .delete()
            .eq('usuario_id', usuarioId)
            .eq('pelicula_id', peliculaId);

        if (error) throw error;
    }

    // Alertas sin notificar todavia cuya pelicula ya entro en preventa (o
    // directamente ya se estreno) -- se resuelve en el cliente porque el
    // calculo de la ventana de preventa (estreno - dias_preventa) ya vive en
    // calcularEstadoVenta(), para no duplicar esa cuenta en SQL.
    async obtenerPendientesDeNotificar(usuarioId: string): Promise<{ alertaId: number; pelicula: Pelicula }[]> {
        const { data, error } = await this.supabase
            .from('alertas_proximamente')
            .select('id, peliculas (*)')
            .eq('usuario_id', usuarioId)
            .eq('notificada', false)
            .overrideTypes<{ id: number; peliculas: FilaPelicula }[], { merge: false }>();

        if (error) throw error;

        return (data ?? [])
            .filter((fila) => calcularEstadoVenta(mapearPelicula(fila.peliculas)) !== 'proximamente')
            .map((fila) => ({ alertaId: fila.id, pelicula: mapearPelicula(fila.peliculas) }));
    }

    async marcarNotificadas(alertaIds: number[]): Promise<void> {
        if (alertaIds.length === 0) return;

        const { error } = await this.supabase
            .from('alertas_proximamente')
            .update({ notificada: true })
            .in('id', alertaIds);

        if (error) throw error;
    }
}
