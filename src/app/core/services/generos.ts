import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Genero } from '../models/genero';

@Service()
export class GenerosService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerTodos(): Promise<Genero[]> {
        const { data, error } = await this.supabase
        .from('generos')
        .select('*')
        .order('nombre')
        .overrideTypes<Genero[], { merge: false }>();

        if (error) throw error;

        return data ?? [];
    }
}