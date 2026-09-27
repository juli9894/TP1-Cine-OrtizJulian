import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Sala } from '../models/sala';

@Service()
export class SalasService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerTodas(): Promise<Sala[]> {
        const { data, error } = await this.supabase
            .from('salas')
            .select('id, nombre')
            .order('nombre')
            .overrideTypes<Sala[], { merge: false }>();

        if (error) throw error;

        return data ?? [];
    }
}