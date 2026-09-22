import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Resena, FilaResena, mapearResena } from '../models/resena';

@Service()
export class ResenasService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerResenasDePelicula(peliculaId: number): Promise<Resena[]> {
        const { data, error } = await this.supabase
        .from('resenas')
        .select('*')
        .eq('pelicula_id', peliculaId)
        .order('created_at', { ascending: false })
        .overrideTypes<FilaResena[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map(mapearResena);
    }

    async crearResena(peliculaId: number, calificacion: number, comentario: string): Promise<void> {
        const { data: sesion } = await this.supabase.auth.getSession();
        const usuarioId = sesion.session?.user.id;
        if (!usuarioId) throw new Error('Necesitás estar logueado para dejar una reseña.');

        const { error } = await this.supabase.from('resenas').insert({
        pelicula_id: peliculaId,
        usuario_id: usuarioId,
        calificacion,
        comentario,
        });

        if (error) throw error;
    }
}