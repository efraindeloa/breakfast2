/**
 * Configuración del restaurante
 * 
 * Este archivo contiene las banderas de funcionalidades que pueden ser
 * activadas o desactivadas según las capacidades del restaurante.
 * 
 * En el futuro, estas configuraciones vendrán del backend o de un panel
 * de administración del restaurante.
 */

export interface RestaurantConfig {
  // Permite modificar la orden después de que ha sido enviada a cocina
  allowOrderModification: boolean;
  
  // Permite pagos con tarjeta de crédito/débito
  allowCardPayment: boolean;
  
  // Permite solicitar factura fiscal
  allowInvoice: boolean;
}

/**
 * Configuración actual del restaurante
 * 
 * Cambia estos valores para activar/desactivar funcionalidades durante las pruebas.
 */
export const restaurantConfig: RestaurantConfig = {
  // Cambiar a false para desactivar la modificación de órdenes
  allowOrderModification: true,
  
  // Cambiar a false para desactivar pagos con tarjeta
  allowCardPayment: true,
  
  // Cambiar a false para desactivar la funcionalidad de facturación
  allowInvoice: true,
};
