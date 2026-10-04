import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { AuthError } from '@supabase/supabase-js'

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private readonly authService = inject(AuthService);

  errorMensaje = '';

  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaNacimiento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoSangre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    colorOjos: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    diasVacaciones: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
  });

  async onSubmit(): Promise<void> {
    this.errorMensaje = '';
    if (this.form.invalid) return;

    try {
      await this.authService.registrarse(this.form.getRawValue());
      } catch (err) {
        if (err instanceof AuthError && err.code === 'user_already_exists') {
          this.errorMensaje = 'Ese email ya está registrado. Iniciá sesión en su lugar.';
        } else {
          this.errorMensaje = 'No se pudo completar el registro. Probá de nuevo.';
        }
      }
  }
}