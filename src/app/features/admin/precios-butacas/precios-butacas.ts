import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PreciosButacaService } from '../../../core/services/precios-butaca';
import { RecargosFormatoService } from '../../../core/services/recargos-formatos';

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-precios-butacas',
    styleUrl: './precios-butacas.css',
    templateUrl: './precios-butacas.html',
})
export class PreciosButacas implements OnInit {
    private readonly preciosService = inject(PreciosButacaService);
    private readonly recargosService = inject(RecargosFormatoService);
    private readonly formBuilder = inject(FormBuilder);

    errorMensaje = signal('');
    mensajeExito = signal('');

    formularioPrecios = this.formBuilder.nonNullable.group({
        normal: [0, [Validators.required, Validators.min(0)]],
        accesible: [0, [Validators.required, Validators.min(0)]],
        vip: [0, [Validators.required, Validators.min(0)]],
    });

    formularioRecargos = this.formBuilder.nonNullable.group({
        '2D': [0, [Validators.required, Validators.min(0)]],
        '3D': [0, [Validators.required, Validators.min(0)]],
        '4D': [0, [Validators.required, Validators.min(0)]],
        '5D': [0, [Validators.required, Validators.min(0)]],
    });

    async ngOnInit(): Promise<void> {
        const precios = await this.preciosService.obtenerTodos();
        for (const precio of precios) {
            this.formularioPrecios.controls[precio.tipo].setValue(precio.precio);
        }

        const recargos = await this.recargosService.obtenerTodos();
        for (const recargo of recargos) {
            this.formularioRecargos.controls[recargo.formato].setValue(recargo.recargo);
        }
    }

    async guardarPrecios(): Promise<void> {
        if (this.formularioPrecios.invalid) return;

        const valores = this.formularioPrecios.getRawValue();
        this.errorMensaje.set('');
        this.mensajeExito.set('');

        try {
            await this.preciosService.actualizar('normal', valores.normal);
            await this.preciosService.actualizar('accesible', valores.accesible);
            await this.preciosService.actualizar('vip', valores.vip);
            this.mensajeExito.set('Precios de butacas actualizados.');
        } catch (err) {
            this.errorMensaje.set('No pudimos guardar los precios. Probá de nuevo.');
        }
    }

    async guardarRecargos(): Promise<void> {
        if (this.formularioRecargos.invalid) return;

        const valores = this.formularioRecargos.getRawValue();
        this.errorMensaje.set('');
        this.mensajeExito.set('');

        try {
            await this.recargosService.actualizar('2D', valores['2D']);
            await this.recargosService.actualizar('3D', valores['3D']);
            await this.recargosService.actualizar('4D', valores['4D']);
            await this.recargosService.actualizar('5D', valores['5D']);
            this.mensajeExito.set('Recargos por formato actualizados.');
        } catch (err) {
            this.errorMensaje.set('No pudimos guardar los recargos. Probá de nuevo.');
        }
    }
}