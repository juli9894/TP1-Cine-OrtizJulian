// src/app/core/services/productos.ts
import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { Producto, NuevoProducto } from '../models/producto';

@Service()
export class ProductosService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtenerActivos(): Promise<Producto[]> {
        const { data, error } = await this.supabase
            .from('productos')
            .select('*')
            .eq('activo', true)
            .order('categoria')
            .overrideTypes<Producto[], { merge: false }>();
        if (error) throw error;
        return data ?? [];
    }

    async obtenerTodos(): Promise<Producto[]> {
        const { data, error } = await this.supabase
            .from('productos')
            .select('*')
            .order('categoria')
            .overrideTypes<Producto[], { merge: false }>();
        if (error) throw error;
        return data ?? [];
    }
    
    async obtenerPorId(id: number): Promise<Producto> {
        const { data, error } = await this.supabase
            .from('productos')
            .select('*')
            .eq('id', id)
            .overrideTypes<Producto[], { merge: false }>();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Producto no encontrado');
        return data[0];
    }

    async crear(datos: NuevoProducto): Promise<void> {
        const { error } = await this.supabase.from('productos').insert(datos);
        if (error) throw error;
    }

    async actualizar(id: number, datos: NuevoProducto): Promise<void> {
        const { error } = await this.supabase.from('productos').update(datos).eq('id', id);
        if (error) throw error;
    }

    async eliminar(id: number): Promise<void> {
        const { error } = await this.supabase.from('productos').update({ activo: false }).eq('id', id);
        if (error) throw error;
    }
}