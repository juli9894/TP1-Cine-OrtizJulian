import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { PrecioButaca } from '../models/precio-butaca';
import { TipoButaca } from '../models/butaca';
import { LogAuditoriaService } from './log-auditoria';

@Service()
export class PreciosButacaService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly logAuditoria = inject(LogAuditoriaService);

    async obtenerTodos(): Promise<PrecioButaca[]> {
        const { data, error } = await this.supabase
            .from('precios_butaca')
            .select('*')
            .order('tipo')
            .overrideTypes<PrecioButaca[], { merge: false }>();
        if (error) throw error;
        return data ?? [];
    }

    async actualizar(tipo: TipoButaca, precio: number): Promise<void> {
        const { error } = await this.supabase
            .from('precios_butaca')
            .update({ precio })
            .eq('tipo', tipo);
        if (error) throw error;

        await this.logAuditoria.registrar('Cambio de precio', `Butaca ${tipo} -> $${precio}`);
    }
}