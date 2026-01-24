export type OrderStatus = 
  | 'pending'
  | 'orden_enviada' 
  | 'orden_recibida' 
  | 'en_preparacion' 
  | 'lista_para_entregar' 
  | 'en_entrega' 
  | 'entregada' 
  | 'con_incidencias' 
  | 'orden_cerrada' 
  | 'cancelada';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  notes: string;
  quantity: number;
}

export interface Order {
  orderId: string;
  orderNumber: number; // 1 para orden principal, 2, 3, etc. para complementarias
  items: OrderItem[];
  status: OrderStatus;
  timestamp: string;
}

export const ORDERS_STORAGE_KEY = 'orders_list';
export const ORDER_HISTORY_STORAGE_KEY = 'order_history';

export interface HistoricalOrderItem {
  id: number;
  name: string;
  price: string; // Precio como string para mostrar (ej: "$18.00")
  notes: string;
  quantity: number;
}

export interface HistoricalOrder {
  id: string;
  restaurantName: string;
  date: string;
  time: string;
  total: number;
  status: 'completada' | 'cancelada';
  items: HistoricalOrderItem[];
  logo: string;
  transactionId?: number;
  timestamp: string; // Fecha completa de cuando se pagó
}