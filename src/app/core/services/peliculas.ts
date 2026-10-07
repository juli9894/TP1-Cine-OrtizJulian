import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Pelicula, FilaPelicula, NuevaPelicula, mapearPelicula } from '../models/pelicula';

@Service()
export class PeliculasService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerTodas(): Promise<Pelicula[]> {
        const { data, error } = await this.supabase
            .from('peliculas')
            .select('*')
            .order('titulo')
            .overrideTypes<FilaPelicula[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map(mapearPelicula);
    }

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

    // Seccion "Proximamente" del Home: peliculas cuya fecha de estreno todavia
    // no llego. No filtramos por preventa aca -- eso se decide pelicula por
    // pelicula en la pantalla de compra, comparando fecha_estreno/dias_preventa
    // contra la fecha de hoy (ver core/utils/preventa.ts).
    async obtenerProximamente(): Promise<Pelicula[]> {
        const hoy = new Date().toISOString().slice(0, 10);
        const { data, error } = await this.supabase
            .from('peliculas')
            .select('*')
            .gt('fecha_estreno', hoy)
            .order('fecha_estreno')
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

    async obtenerGenerosDe(peliculaId: number): Promise<number[]> {
        const { data, error } = await this.supabase
            .from('pelicula_generos')
            .select('genero_id')
            .eq('pelicula_id', peliculaId)
            .overrideTypes<{ genero_id: number }[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map((fila) => fila.genero_id);
    }

    async crear(datos: NuevaPelicula, generoIds: number[]): Promise<void> {
        const { data, error } = await this.supabase
            .from('peliculas')
            .insert({
                titulo: datos.titulo,
                duracion_minutos: datos.duracionMinutos,
                sinopsis: datos.sinopsis,
                imagen_url: datos.imagenUrl,
                clasificacion: datos.clasificacion,
                fecha_estreno: datos.fechaEstreno,
                dias_preventa: datos.diasPreventa,
                precio_preventa: datos.precioPreventa,
            })
            .select('id')
            .single();

        if (error) throw error;

        await this.guardarGeneros(data.id, generoIds);
    }

    async actualizar(id: number, datos: NuevaPelicula, generoIds: number[]): Promise<void> {
        const { error } = await this.supabase
            .from('peliculas')
            .update({
                titulo: datos.titulo,
                duracion_minutos: datos.duracionMinutos,
                sinopsis: datos.sinopsis,
                imagen_url: datos.imagenUrl,
                clasificacion: datos.clasificacion,
                fecha_estreno: datos.fechaEstreno,
                dias_preventa: datos.diasPreventa,
                precio_preventa: datos.precioPreventa,
            })
            .eq('id', id);

        if (error) throw error;

        await this.guardarGeneros(id, generoIds);
    }

    async eliminar(id: number): Promise<void> {
        const { data, error: errorBusqueda } = await this.supabase
            .from('funciones')
            .select('id')
            .eq('pelicula_id', id)
            .limit(1);

        if (errorBusqueda) throw errorBusqueda;

        if (data && data.length > 0) {
            throw new Error('No se puede eliminar: esta película tiene funciones cargadas.');
        }

        const { error } = await this.supabase.from('peliculas').delete().eq('id', id);
        if (error) throw error;
    }

    private async guardarGeneros(peliculaId: number, generoIds: number[]): Promise<void> {
        const { error: errorBorrado } = await this.supabase
            .from('pelicula_generos')
            .delete()
            .eq('pelicula_id', peliculaId);

        if (errorBorrado) throw errorBorrado;

        if (generoIds.length === 0) return;

        const filas = generoIds.map((generoId) => ({ pelicula_id: peliculaId, genero_id: generoId }));

        const { error: errorInsercion } = await this.supabase.from('pelicula_generos').insert(filas);

        if (errorInsercion) throw errorInsercion;
    }
}