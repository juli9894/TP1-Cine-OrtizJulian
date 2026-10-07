import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CuponesService } from '../../../core/services/cupones';
import { ConfiguracionPuntosService } from '../../../core/services/configuracion-puntos';

@Component({
    imports: [ReactiveFormsModule, RouterLink],
    selector: 'app-cupones',
    styleUrl: './cupones.css',
    templateUrl: './cupones.html',
})
export class Cupones implements OnInit {
    private readonly cuponesService = inject(CuponesService);
    private readonly puntosService = inject(ConfiguracionPuntosService);
    private readonly formBuilder = inject(FormBuilder);

    errorMensaje = signal('');
    mensajeExito = signal('');

    // Los dos tipos de cupon son fijos (los pide el enunciado: bienvenida y
    // mayor50) -- no es una lista dinamica como productos/combos, asi que un
    // grupo anidado por tipo alcanza, mismo criterio que precios-butacas con
    // los 3 tipos de butaca y los 4 formatos.
    formularioCupones = this.formBuilder.group({
        bienvenida: this.formBuilder.nonNullable.group({
            porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            activo: [true],
        }),
        mayor50: this.formBuilder.nonNullable.group({
            porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            activo: [true],
        }),
    });

    formularioPuntos = this.formBuilder.nonNullable.group({
        valorPorPunto: [1, [Validators.required, Validators.min(0)]],
    });

    async ngOnInit(): Promise<void> {
        const cupones = await this.cuponesService.obtenerTodos();
        for (const cupon of cupones) {
            if (cupon.tipo === 'bienvenida' || cupon.tipo === 'mayor50') {
                this.formularioCupones.controls[cupon.tipo].setValue({
                    porcentaje: cupon.porcentajeDescuento,
                    activo: cupon.activo,
                });
            }
        }

        const configuracion = await this.puntosService.obtener();
        this.formularioPuntos.controls.valorPorPunto.setValue(configuracion.valorPorPunto);
    }

    async guardarCupones(): Promise<void> {
        if (this.formularioCupones.invalid) return;

        const valores = this.formularioCupones.getRawValue();
        this.errorMensaje.set('');
        this.mensajeExito.set('');

        try {
            await this.cuponesService.actualizar('bienvenida', valores.bienvenida.porcentaje, valores.bienvenida.activo);
            await this.cuponesService.actualizar('mayor50', valores.mayor50.porcentaje, valores.mayor50.activo);
            this.mensajeExito.set('Cupones actualizados.');
        } catch {
            this.errorMensaje.set('No pudimos guardar los cupones. Probá de nuevo.');
        }
    }

    async guardarPuntos(): Promise<void> {
        if (this.formularioPuntos.invalid) return;

        const valores = this.formularioPuntos.getRawValue();
        this.errorMensaje.set('');
        this.mensajeExito.set('');

        try {
            await this.puntosService.actualizar(valores.valorPorPunto);
            this.mensajeExito.set('Tasa de canje de puntos actualizada.');
        } catch {
            this.errorMensaje.set('No pudimos guardar la tasa de canje. Probá de nuevo.');
        }
    }
}
