import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Pelicula, FilaPelicula, mapearPelicula } from '../models/pelicula';

@Service()
export class PeliculasService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerTop3(): Promise<Pelicula[]> {
        const { data, error } = await this.supabase
        .from('peliculas')
        .select('*')
        .order('ventas', { ascending: false })
        .limit(3)
        .overrideTypes<FilaPelicula[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map(mapearPelicula);
    }

    async obtenerPorId(id: number): Promise<Pelicula> {
        const { data, error } = await this.supabase
            .from('peliculas')
            .select('*')
            .eq('id', id)
            .overrideTypes<FilaPelicula[], { merge: false }>();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Película no encontrada');

        return mapearPelicula(data[0]);
    }

    async buscar(texto: string, generoId: number | null): Promise<Pelicula[]> {
        let idsPermitidos: number[] | null = null;

        if (generoId !== null) {
            const { data, error } = await this.supabase
                .from('pelicula_generos')
                .select('pelicula_id')
                .eq('genero_id', generoId)
                .overrideTypes<{ pelicula_id: number }[], { merge: false }>();

            if (error) throw error;

            idsPermitidos = (data ?? []).map((fila) => fila.pelicula_id);
        }

        let consulta = this.supabase
            .from('peliculas')
            .select('*')
            .ilike('titulo', `%${texto}%`)
            .order('titulo');

        if (idsPermitidos !== null) {
            consulta = consulta.in('id', idsPermitidos);
        }

        const { data, error } = await consulta.overrideTypes<FilaPelicula[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map(mapearPelicula);
    }
}