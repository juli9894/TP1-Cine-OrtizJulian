export interface Perfil {
    id: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    tipo_sangre: string | null;
    color_ojos: string | null;
    dias_vacaciones: number | null;
    created_at: string;
}

export interface DatosRegistro {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    fechaNacimiento: string;
    tipoSangre: string;
    colorOjos: string;
    diasVacaciones: number;
}