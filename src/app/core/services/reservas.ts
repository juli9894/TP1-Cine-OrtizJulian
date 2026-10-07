import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseClientService } from './supabase-client';
import { PreciosButacaService } from './precios-butaca';
import { RecargosFormatoService } from './recargos-formatos';
import { PrecioButaca } from '../models/precio-butaca';
import { RecargoFormato } from '../models/recargo-formato';
import { Funcion } from '../models/funcion';
import { Butaca } from '../models/butaca';
import { Producto } from '../models/producto';
import { Combo } from '../models/combo';
import { ReservaCreada, ReservaDetalle, FilaReservaDetalle, mapearReservaDetalle } from '../models/reserva';
import { Cupon } from '../models/cupon';

export interface ProductoSeleccionado {
    productoId: number;
    cantidad: number;
}

export interface ComboSeleccionado {
    comboId: number;
    cantidad: number;
}

@Service()
export class ReservasService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly preciosService = inject(PreciosButacaService);
    private readonly recargosService = inject(RecargosFormatoService);

    async obtenerTarifas(): Promise<{ precios: PrecioButaca[]; recargos: RecargoFormato[] }> {
        const [precios, recargos] = await Promise.all([
            this.preciosService.obtenerTodos(),
            this.recargosService.obtenerTodos(),
        ]);
        return { precios, recargos };
    }

    calcularTotal(
        funcion: Funcion,
        butacasSeleccionadas: Butaca[],
        precios: PrecioButaca[],
        recargos: RecargoFormato[],
    ): number {
        const recargo = recargos.find((r) => r.formato === funcion.formato)?.recargo ?? 0;
        return butacasSeleccionadas.reduce((total, butaca) => {
            const precio = precios.find((p) => p.tipo === butaca.tipo)?.precio ?? 0;
            return total + precio + recargo;
        }, 0);
    }

    // Igual que calcularTotal(), precioPreventa reemplaza
    // el precio de la butaca 'normal' (el tipo base), pero NO borra la
    // diferencia entre tipos de butaca: VIP sigue costando mas que
    // normal/accesible
    calcularTotalPreventa(
        funcion: Funcion,
        butacasSeleccionadas: Butaca[],
        precioPreventa: number,
        precios: PrecioButaca[],
        recargos: RecargoFormato[],
    ): number {
        const recargoFormato = recargos.find((r) => r.formato === funcion.formato)?.recargo ?? 0;
        const precioNormal = precios.find((p) => p.tipo === 'normal')?.precio ?? 0;

        return butacasSeleccionadas.reduce((total, butaca) => {
            const precioTipo = precios.find((p) => p.tipo === butaca.tipo)?.precio ?? 0;
            const diferencialTipo = precioTipo - precioNormal;
            return total + precioPreventa + diferencialTipo + recargoFormato;
        }, 0);
    }

    calcularTotalCandy(
        productosSeleccionados: ProductoSeleccionado[],
        combosSeleccionados: ComboSeleccionado[],
        productos: Producto[],
        combos: Combo[],
    ): number {
        const totalProductos = productosSeleccionados.reduce((total, sel) => {
            const precio = productos.find((p) => p.id === sel.productoId)?.precio ?? 0;
            return total + precio * sel.cantidad;
        }, 0);

        const totalCombos = combosSeleccionados.reduce((total, sel) => {
            const precio = combos.find((c) => c.id === sel.comboId)?.precio ?? 0;
            return total + precio * sel.cantidad;
        }, 0);

        return totalProductos + totalCombos;
    }

    calcularDescuento(subtotal: number, cupon: Cupon | null): number {
        if (!cupon) return 0;
        return Math.round((subtotal * cupon.porcentajeDescuento) / 100);
    }

    async contarReservasDe(usuarioId: string): Promise<number> {
        const { count, error } = await this.supabase
            .from('reservas')
            .select('id', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId);

        if (error) throw error;

        return count ?? 0;
    }

    async crear(
        funcion: Funcion | null,
        butacasSeleccionadas: Butaca[],
        usuarioId: string | null,
        total: number,
        productosSeleccionados: ProductoSeleccionado[],
        combosSeleccionados: ComboSeleccionado[],
        cuponId: number | null,
        montoCreditoAplicado: number,
        subtotal: number,
        descuento: number,
    ): Promise<ReservaCreada> {
        // Orden importante: el crédito se descuenta ANTES de crear la
        // reserva.
        if (usuarioId) {
            if (montoCreditoAplicado > 0) {
                const { error: errorCredito } = await this.supabase.rpc('aplicar_credito', {
                    p_usuario_id: usuarioId,
                    p_monto: montoCreditoAplicado,
                });
                if (errorCredito) throw errorCredito;
            }

            const { error: errorPuntos } = await this.supabase.rpc('sumar_puntos', {
                p_usuario_id: usuarioId,
                p_puntos: total,
            });
            if (errorPuntos) throw errorPuntos;
        }

        const { data, error } = await this.supabase
            .from('reservas')
            .insert({
                usuario_id: usuarioId,
                funcion_id: funcion?.id ?? null,
                total,
                cupon_id: cuponId,
                subtotal,
                descuento,
                credito_aplicado: montoCreditoAplicado,
            })
            .select('id, qr_code')
            .single();
        if (error) throw error;

        // Una compra de solo candy bar (sin función ni butacas) no inserta nada
        // en reserva_butacas — mandar un insert vacío ahí rompe contra Supabase.
        if (butacasSeleccionadas.length > 0) {
            const filasButacas = butacasSeleccionadas.map((butaca) => ({
                reserva_id: data.id,
                butaca_id: butaca.id,
            }));
            const { error: errorButacas } = await this.supabase.from('reserva_butacas').insert(filasButacas);
            if (errorButacas) throw errorButacas;
        }

        if (productosSeleccionados.length > 0) {
            const filasProductos = productosSeleccionados.map((p) => ({
                reserva_id: data.id,
                producto_id: p.productoId,
                cantidad: p.cantidad,
            }));
            const { error: errorProductos } = await this.supabase.from('reserva_productos').insert(filasProductos);
            if (errorProductos) throw errorProductos;
        }

        if (combosSeleccionados.length > 0) {
            const filasCombos = combosSeleccionados.map((c) => ({
                reserva_id: data.id,
                combo_id: c.comboId,
                cantidad: c.cantidad,
            }));
            const { error: errorCombos } = await this.supabase.from('reserva_combos').insert(filasCombos);
            if (errorCombos) throw errorCombos;
        }

        return { id: data.id, qrCode: data.qr_code, total };
    }

    async obtenerDeUsuario(usuarioId: string): Promise<ReservaDetalle[]> {
        const { data, error } = await this.supabase
            .from('reservas')
            .select(
                `id, total, qr_code, cancelada, qr_validado, subtotal, descuento, credito_aplicado,
                funciones ( horario, formato, idioma, peliculas ( id, titulo, imagen_url, clasificacion ), salas ( nombre ) ),
                reserva_butacas ( butacas ( fila, columna ) ),
                reserva_productos ( cantidad, productos ( nombre ) ),
                reserva_combos ( cantidad, combos ( nombre ) )`,
            )
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false })
            .overrideTypes<FilaReservaDetalle[], { merge: false }>();

        if (error) throw error;

        return (data ?? []).map(mapearReservaDetalle);
    }

    async cancelar(reservaId: number, usuarioId: string): Promise<void> {
        const { error } = await this.supabase.rpc('cancelar_reserva', {
            p_reserva_id: reservaId,
            p_usuario_id: usuarioId,
        });
        if (error) throw error;
    }

    // Rol Empleado: marca el QR como usado. Si el
    // codigo no existe, la reserva esta cancelada, o ya fue validado antes,
    // la funcion de Postgres tira una excepcion con un mensaje legible --
    // ese mensaje llega tal cual en error.message, listo para mostrar en
    // pantalla sin tener que distinguir casos acá.
    async validarReserva(qrCode: string): Promise<void> {
        const { error } = await this.supabase.rpc('validar_reserva', { p_qr_code: qrCode });
        if (error) throw error;
    }

    // Trae los datos de UNA reserva por su codigo QR-- la pantalla de Empleado
    // muestra que corresponde entregar despues de validar un codigo.
    async obtenerPorQrCode(qrCode: string): Promise<ReservaDetalle> {
        const { data, error } = await this.supabase
            .from('reservas')
            .select(
                `id, total, qr_code, cancelada, qr_validado, subtotal, descuento, credito_aplicado,
                funciones ( horario, formato, idioma, peliculas ( id, titulo, imagen_url, clasificacion ), salas ( nombre ) ),
                reserva_butacas ( butacas ( fila, columna ) ),
                reserva_productos ( cantidad, productos ( nombre ) ),
                reserva_combos ( cantidad, combos ( nombre ) )`,
            )
            .eq('qr_code', qrCode)
            .single()
            .overrideTypes<FilaReservaDetalle, { merge: false }>();

        if (error) throw error;

        return mapearReservaDetalle(data);
    }

    // Mis reservas necesita enterarse de cambios aunque no haya ninguna
    // acción del propio usuario de por medio en esa pantalla.
    suscribirseACambios(usuarioId: string): Observable<void> {
        return new Observable<void>((observador) => {
            const canal = this.supabase
                .channel(`reservas-usuario-${usuarioId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'reservas', filter: `usuario_id=eq.${usuarioId}` },
                    () => observador.next(),
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'reservas', filter: `usuario_id=eq.${usuarioId}` },
                    () => observador.next(),
                )
                .subscribe();

            return () => {
                canal.unsubscribe();
            };
        });
    }
}