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
}