import { inject, Service } from '@angular/core';
import { SupabaseClientService } from './supabase-client';
import { AuthService } from './auth';
import { LogAuditoria, FilaLogAuditoria, mapearLogAuditoria } from '../models/log-auditoria';

// Servicio chico, a proposito sin el patron Fila/mapear() para escribir
// (solo hace falta para leer) -- igual que SalasService, porque lo que se
// inserta ya es snake_case a mano.
@Service()
export class LogAuditoriaService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly authService = inject(AuthService);

    // Registra una accion critica. A proposito NO relanza el error si el
    // insert falla: un log que no se pudo escribir no tiene que frenar la
    // accion real (crear una funcion, cambiar un precio, validar un QR)
    // que si le importa al usuario -- se loguea el problema en consola
    // nomas, para notarlo en desarrollo sin romper nada en produccion.
    async registrar(accion: string, detalle: string): Promise<void> {
        const usuario = this.authService.usuarioActual();

        try {
            const { error } = await this.supabase.from('log_auditoria').insert({
                usuario_id: usuario?.id ?? null,
                usuario_email: usuario?.email ?? null,
                accion,
                detalle,
            });
            if (error) throw error;
        } catch (err) {
            console.error('No se pudo registrar el log de auditoria', err);
        }
    }

    async obtenerTodos(): Promise<LogAuditoria[]> {
        const { data, error } = await this.supabase
            .from('log_auditoria')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200)
            .overrideTypes<FilaLogAuditoria[], { merge: false }>();
        if (error) throw error;
        return (data ?? []).map(mapearLogAuditoria);
    }
}
