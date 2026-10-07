// Nota corta para pegarle a cualquier línea de "Total" cuando la compra se
// cubrió, total o parcialmente, con cupón/crédito interno.
export function notaTotalPagado(descuento: number, creditoAplicado: number, total: number): string {
    if (descuento === 0 && creditoAplicado === 0) {
        return '';
    }
    return total === 0 ? ' (canjeado con cupón/crédito)' : ' (incluye cupón/crédito aplicado)';
}
