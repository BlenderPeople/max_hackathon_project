import { request } from './http';
import type { Service } from './contracts';

export function getService(publicToken: string): Promise<Service> {
  return request<Service>(`/services/${encodeURIComponent(publicToken)}`);
}
