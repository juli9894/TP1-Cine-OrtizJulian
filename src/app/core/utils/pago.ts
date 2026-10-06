// Nota corta para pegarle a cualquier línea de "Total" cuando la compra se
// cubrió, total o parcialmente, con cupón/crédito interno (el crédito puede
// venir de canjear puntos, o de una cancelación anterior) -- sin esto, un
// "Total: $0" se ve como un error del sistema en vez de una compra normal.
// Es una función suelta (no un método de ningún componente en particular)
// porque la misma lógica la necesitan varias pantallas distintas: Mis
// reservas, las dos confirmaciones de compra, y el PDF del ticket.
export function notaTotalPagado(descuento: number, creditoAplicado: number, total: number): string {
    if (descuento === 0 && creditoAplicado === 0) {
        return '';
    }
    return total === 0 ? ' (canjeado con cupón/crédito)' : ' (incluye cupón/crédito aplicado)';
}
