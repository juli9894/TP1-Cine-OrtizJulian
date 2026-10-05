import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Funcion, FilaFuncion, mapearFuncion, NuevaFuncion } from '../models/funcion';

@Service()
export class FuncionesService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerPorId(id: number): Promise<Funcion> {
        const { data, error } = await this.supabase
            .from('funciones')
            .select('*')
            .eq('id', id)
            .overrideTypes<FilaFuncion[], { merge: false }>();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Función no encontrada');

        return mapearFuncion(data[0]);
    }

    async obtenerPorPelicula(peliculaId: number): Promise<Funcion[]> {
        const { data, error } = await this.supabase
            .from('funciones')
            .select('*')
            .eq('pelicula_id', peliculaId)
            .gte('horario', new Date().toISOString())
            .order('horario')
            .overrideTypes<FilaFuncion[], { merge: false }>();

        if (error) throw error;

        return data.map(mapearFuncion);
    }

    async crear(datos: NuevaFuncion): Promise<void> {
        const { error } = await this.supabase
            .from('funciones')
            .insert({
                pelicula_id: datos.peliculaId,
                sala_id: datos.salaId,
                horario: datos.horario,
                formato: datos.formato,
                idioma: datos.idioma,
            });

        if (error) throw error;
    }

    async obtenerTodas(): Promise<Funcion[]> {
        const { data, error } = await this.supabase
            .from('funciones')
            .select('*')
            .order('horario')
            .overrideTypes<FilaFuncion[], { merge: false }>();

        if (error) throw error;

        return data.map(mapearFuncion);
    }

    async actualizar(id: number, datos: NuevaFuncion): Promise<void> {
        const { error } = await this.supabase
            .from('funciones')
            .update({
                pelicula_id: datos.peliculaId,
                sala_id: datos.salaId,
                horario: datos.horario,
                formato: datos.formato,
                idioma: datos.idioma,
            })
            .eq('id', id);

        if (error) throw error;
    }

    async eliminar(id: number): Promise<void> {
        const { error } = await this.supabase.from('funciones').delete().eq('id', id);
        if (error) throw error;
    }
}