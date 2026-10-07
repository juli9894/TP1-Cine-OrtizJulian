import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import jsPDF from 'jspdf';
import { ReportesService, ReporteFacturacion, ReporteSemanal } from '../../../core/services/reportes';
import { SelectorFecha } from '../../../shared/selector-fecha/selector-fecha';

type TipoReporte = 'diario' | 'semanal';

@Component({
    selector: 'app-reportes',
    imports: [RouterLink, SelectorFecha],
    styleUrl: './reportes.css',
    templateUrl: './reportes.html',
})
export class Reportes {
    private readonly reportesService = inject(ReportesService);

    tipo = signal<TipoReporte>('diario');
    fecha = signal(new Date().toISOString().slice(0, 10));
    reporteDiario = signal<ReporteFacturacion | null>(null);
    reporteSemanal = signal<ReporteSemanal | null>(null);
    cargando = signal(false);
    errorMensaje = signal('');

    onFechaChange(valor: string): void {
        this.fecha.set(valor);
    }

    // Cambiar de pestaña Diario/Semanal limpia el reporte que estaba
    // mostrado -- evita confundir un resultado viejo (de un dia) con el
    // tipo de reporte que se acaba de elegir, antes de generar el nuevo.
    elegirTipo(tipo: TipoReporte): void {
        this.tipo.set(tipo);
        this.reporteDiario.set(null);
        this.reporteSemanal.set(null);
    }

    async generar(): Promise<void> {
        this.cargando.set(true);
        this.errorMensaje.set('');
        try {
            if (this.tipo() === 'diario') {
                this.reporteDiario.set(await this.reportesService.facturacionDiaria(this.fecha()));
            } else {
                this.reporteSemanal.set(await this.reportesService.facturacionSemanal(this.fecha()));
            }
        } catch (err) {
            this.errorMensaje.set('No pudimos generar el reporte.');
        } finally {
            this.cargando.set(false);
        }
    }

    descargarPdf(): void {
        const doc = new jsPDF();
        doc.setFontSize(16);

        const diario = this.reporteDiario();
        const semanal = this.reporteSemanal();

        if (diario) {
            doc.text('Reporte de facturación diaria — TP Cine', 15, 20);
            doc.setFontSize(12);
            doc.text(`Fecha: ${diario.fecha}`, 15, 35);
            doc.text(`Total facturado: $${diario.totalFacturado.toLocaleString('es-AR')}`, 15, 45);
            doc.text(`Entradas vendidas: ${diario.entradasVendidas}`, 15, 55);
            doc.save(`reporte-facturacion-${diario.fecha}.pdf`);
        } else if (semanal) {
            doc.text('Reporte de facturación semanal — TP Cine', 15, 20);
            doc.setFontSize(12);
            doc.text(`Semana: ${semanal.desde} al ${semanal.hasta}`, 15, 35);
            doc.text(`Total facturado: $${semanal.totalFacturado.toLocaleString('es-AR')}`, 15, 45);
            doc.text(`Entradas vendidas: ${semanal.entradasVendidas}`, 15, 55);

            let y = 70;
            doc.text('Detalle por día:', 15, y);
            for (const dia of semanal.dias) {
                y += 10;
                doc.text(`${dia.fecha}: $${dia.totalFacturado.toLocaleString('es-AR')} — ${dia.entradasVendidas} entradas`, 20, y);
            }

            doc.save(`reporte-facturacion-semana-${semanal.desde}.pdf`);
        }
    }

    descargarExcel(): void {
        // CSV, no un .xlsx binario: Excel lo abre nativo sin necesitar una
        // libreria nueva instalada a las apuradas -- mismo criterio de "no
        // forzar una dependencia" que ya se uso con jsPDF/qrcode para lo
        // que Angular no resuelve solo.
        const diario = this.reporteDiario();
        const semanal = this.reporteSemanal();

        let filas: string[][];
        let nombreArchivo: string;

        if (diario) {
            filas = [
                ['Fecha', 'Total facturado', 'Entradas vendidas'],
                [diario.fecha, String(diario.totalFacturado), String(diario.entradasVendidas)],
            ];
            nombreArchivo = `reporte-facturacion-${diario.fecha}.csv`;
        } else if (semanal) {
            filas = [
                ['Fecha', 'Total facturado', 'Entradas vendidas'],
                ...semanal.dias.map((d) => [d.fecha, String(d.totalFacturado), String(d.entradasVendidas)]),
                ['TOTAL', String(semanal.totalFacturado), String(semanal.entradasVendidas)],
            ];
            nombreArchivo = `reporte-facturacion-semana-${semanal.desde}.csv`;
        } else {
            return;
        }

        const csv = filas.map((fila) => fila.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreArchivo;
        enlace.click();
        URL.revokeObjectURL(url);
    }
}
