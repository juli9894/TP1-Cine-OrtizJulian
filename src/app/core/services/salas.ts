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

    async crear(nombre: string): Promise<void> {
        const { data, error } = await this.supabase
            .from('salas')
            .insert({ nombre })
            .select('id')
            .single();

        if (error) throw error;

        const { error: errorButacas } = await this.supabase.rpc('generar_butacas', {
            p_sala_id: data.id,
        });

        if (errorButacas) throw errorButacas;
    }

    async actualizar(id: number, nombre: string): Promise<void> {
        const { error } = await this.supabase
            .from('salas')
            .update({ nombre })
            .eq('id', id);

        if (error) throw error;
    }

    async eliminar(id: number): Promise<void> {
        const { error } = await this.supabase
            .from('salas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async obtenerPorId(id: number): Promise<Sala> {
        const { data, error } = await this.supabase
            .from('salas')
            .select('*')
            .eq('id', id)
            .overrideTypes<Sala[], { merge: false }>();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Sala no encontrada');

        return data[0];
    }
}