export interface LogAuditoria {
    id: number;
    usuarioEmail: string | null;
    accion: string;
    detalle: string | null;
    createdAt: string;
}

export interface FilaLogAuditoria {
    id: number;
    usuario_email: string | null;
    accion: string;
    detalle: string | null;
    created_at: string;
}

export function mapearLogAuditoria(fila: FilaLogAuditoria): LogAuditoria {
    return {
        id: fila.id,
        usuarioEmail: fila.usuario_email,
        accion: fila.accion,
        detalle: fila.detalle,
        createdAt: fila.created_at,
    };
}
