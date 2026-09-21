import { request } from './http';
import type { Order } from './contracts';

export function getOrder(publicToken: string): Promise<Order> {
  return request<Order>(`/orders/${encodeURIComponent(publicToken)}`);
}
