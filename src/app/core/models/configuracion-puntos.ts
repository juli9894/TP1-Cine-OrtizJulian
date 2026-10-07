export interface ConfiguracionPuntos {
    valorPorPunto: number;
}

export interface FilaConfiguracionPuntos {
    valor_por_punto: number;
}

export function mapearConfiguracionPuntos(fila: FilaConfiguracionPuntos): ConfiguracionPuntos {
    return {
        valorPorPunto: fila.valor_por_punto,
    };
}
