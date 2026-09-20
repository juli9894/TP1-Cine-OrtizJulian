import { Service, inject, signal } from '@angular/core';
import type { User } from '@supabase/supabase-js';
import { SupabaseClientService } from './supabase-client';
import type { DatosRegistro } from '../models/perfil';

@Service()
export class AuthService {
    private readonly supabase = inject(SupabaseClientService).client;

    readonly usuarioActual = signal<User | null>(null);

    constructor() {
        this.supabase.auth.getSession().then(({ data }) => {
        this.usuarioActual.set(data.session?.user ?? null);
        });

        this.supabase.auth.onAuthStateChange((_evento, session) => {
        this.usuarioActual.set(session?.user ?? null);
        });
    }

    async registrarse(datos: DatosRegistro): Promise<void> {
        const { data, error } = await this.supabase.auth.signUp({
            email: datos.email,
            password: datos.password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('No se pudo crear el usuario');

        const { error: errorPerfil } = await this.supabase
            .from('perfiles')
            .insert({
                id: data.user.id,
                nombre: datos.nombre,
                apellido: datos.apellido,
                fecha_nacimiento: datos.fechaNacimiento,
                tipo_sangre: datos.tipoSangre,
                color_ojos: datos.colorOjos,
                dias_vacaciones: datos.diasVacaciones,
            });

        if (errorPerfil) throw errorPerfil;
    }

    async iniciarSesion(email: string, password: string): Promise<void> {
        const { error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    }
}
