import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import {
    ConfiguracionPuntos,
    FilaConfiguracionPuntos,
    mapearConfiguracionPuntos,
} from '../models/configuracion-puntos';

@Service()
export class ConfiguracionPuntosService {
    private readonly supabase = inject(SupabaseClientService).client;

    async obtener(): Promise<ConfiguracionPuntos> {
        const { data, error } = await this.supabase
            .from('configuracion_puntos')
            .select('valor_por_punto')
            .eq('id', 1)
            .single();

        if (error) throw error;

        return mapearConfiguracionPuntos(data as FilaConfiguracionPuntos);
    }

    async actualizar(valorPorPunto: number): Promise<void> {
        const { error } = await this.supabase
            .from('configuracion_puntos')
            .update({ valor_por_punto: valorPorPunto })
            .eq('id', 1);

        if (error) throw error;
    }
}
