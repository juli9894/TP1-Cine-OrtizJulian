import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Canje, FilaCanje, mapearCanje } from '../models/canje';

@Service()
export class PuntosService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerHistorialDe(usuarioId: string): Promise<Canje[]> {
        const { data, error } = await this.supabase
            .from('historial_canjes')
            .select('id, puntos_gastados, credito_otorgado, created_at')
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false })
            .overrideTypes<FilaCanje[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map(mapearCanje);
    }

    async canjear(usuarioId: string): Promise<void> {
        const { error } = await this.supabase.rpc('canjear_puntos', {
            p_usuario_id: usuarioId,
        });
        if (error) throw error;
    }
}