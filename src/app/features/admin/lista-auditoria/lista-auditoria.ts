import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { LogAuditoriaService } from '../../../core/services/log-auditoria';
import { LogAuditoria } from '../../../core/models/log-auditoria';

@Component({
    selector: 'app-lista-auditoria',
    imports: [RouterLink, DatePipe],
    styleUrl: './lista-auditoria.css',
    templateUrl: './lista-auditoria.html',
})
export class ListaAuditoria implements OnInit {
    private readonly logService = inject(LogAuditoriaService);

    logs = signal<LogAuditoria[]>([]);
    errorMensaje = signal('');

    async ngOnInit(): Promise<void> {
        try {
            this.logs.set(await this.logService.obtenerTodos());
        } catch (err) {
            this.errorMensaje.set('No pudimos cargar el log de auditoría.');
        }
    }
}
