import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { CatalogoPunto, FilaCatalogoPunto, mapearCatalogoPunto } from '../models/catalogo-punto';
import { Canje, FilaCanje, mapearCanje } from '../models/canje';

@Service()
export class PuntosService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerCatalogo(): Promise<CatalogoPunto[]> {
        const { data, error } = await this.supabase
            .from('catalogo_puntos')
            .select('*')
            .eq('activo', true)
            .order('puntos_requeridos')
            .overrideTypes<FilaCatalogoPunto[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map(mapearCatalogoPunto);
    }

    async obtenerHistorialDe(usuarioId: string): Promise<Canje[]> {
        const { data, error } = await this.supabase
            .from('historial_canjes')
            .select('id, puntos_gastados, credito_otorgado, created_at, catalogo_puntos ( descripcion )')
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false })
            .overrideTypes<FilaCanje[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map(mapearCanje);
    }

    async canjear(usuarioId: string, catalogoId: number): Promise<void> {
        const { error } = await this.supabase.rpc('canjear_puntos', {
            p_usuario_id: usuarioId,
            p_catalogo_id: catalogoId,
        });
        if (error) throw error;
    }
}