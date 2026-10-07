// src/app/core/services/combos.ts
import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Combo, FilaCombo, mapearCombo, NuevoCombo } from '../models/combo';

@Service()
export class CombosService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerActivos(): Promise<Combo[]> {
        const { data, error } = await this.supabase
            .from('combos')
            .select('*')
            .eq('activo', true)
            .overrideTypes<FilaCombo[], { merge: false }>();
        if (error) throw error;
        return (data ?? []).map(mapearCombo);
    }

    async obtenerTodos(): Promise<Combo[]> {
        const { data, error } = await this.supabase
            .from('combos')
            .select('*')
            .overrideTypes<FilaCombo[], { merge: false }>();
        if (error) throw error;
        return (data ?? []).map(mapearCombo);
    }

    async obtenerPorId(id: number): Promise<Combo> {
        const { data, error } = await this.supabase
            .from('combos')
            .select('*')
            .eq('id', id)
            .overrideTypes<FilaCombo[], { merge: false }>();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Combo no encontrado');
        return mapearCombo(data[0]);
    }

    async crear(datos: NuevoCombo): Promise<void> {
        const { error } = await this.supabase.from('combos').insert({
            nombre: datos.nombre,
            descripcion: datos.descripcion,
            precio: datos.precio,
            imagen_url: datos.imagenUrl,
        });
        if (error) throw error;
    }

    async actualizar(id: number, datos: NuevoCombo): Promise<void> {
        const { error } = await this.supabase
            .from('combos')
            .update({
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                precio: datos.precio,
                imagen_url: datos.imagenUrl,
            })
            .eq('id', id);
        if (error) throw error;
    }

    async eliminar(id: number): Promise<void> {
        const { error } = await this.supabase.from('combos').update({ activo: false }).eq('id', id);
        if (error) throw error;
    }
}
