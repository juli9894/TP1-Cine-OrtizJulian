import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Cupon, FilaCupon, mapearCupon } from '../models/cupon';

@Service()
export class CuponesService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerPorTipo(tipo: string): Promise<Cupon | null> {
        const { data, error } = await this.supabase
            .from('cupones')
            .select('*')
            .eq('tipo', tipo)
            .eq('activo', true)
            .overrideTypes<FilaCupon[], { merge: false }>();

        if (error) throw error;
        if (!data || data.length === 0) return null;

        return mapearCupon(data[0]);
    }
}