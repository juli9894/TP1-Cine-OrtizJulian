import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { RecargoFormato } from '../models/recargo-formato';
import { FormatoFuncion } from '../models/funcion';
import { LogAuditoriaService } from './log-auditoria';

@Service()
export class RecargosFormatoService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly logAuditoria = inject(LogAuditoriaService);

    async obtenerTodos(): Promise<RecargoFormato[]> {
        const { data, error } = await this.supabase
            .from('recargos_formato')
            .select('*')
            .order('formato')
            .overrideTypes<RecargoFormato[], { merge: false }>();
        if (error) throw error;
        return data ?? [];
    }

    async actualizar(formato: FormatoFuncion, recargo: number): Promise<void> {
        const { error } = await this.supabase
            .from('recargos_formato')
            .update({ recargo })
            .eq('formato', formato);
        if (error) throw error;

        await this.logAuditoria.registrar('Cambio de precio', `Recargo formato ${formato} -> $${recargo}`);
    }
}