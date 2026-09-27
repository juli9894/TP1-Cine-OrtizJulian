import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Perfil } from '../models/perfil';

@Service()
export class PerfilesService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerPorId(id: string): Promise<Perfil> {
        const { data, error } = await this.supabase
            .from('perfiles')
            .select('*')
            .eq('id', id)
            .overrideTypes<Perfil[], { merge: false }>();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Perfil no encontrado');

        return data[0];
    }
}