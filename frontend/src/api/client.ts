import type {
  BusinessProfile,
  CreateOrderInput,
  CreateServiceInput,
  AvailabilitySchedule,
  OrderDetails,
  OrderFilter,
  OrderSummary,
  RecordPaymentInput,
  ServiceDetails,
  ScheduleView,
  AvailableSlot,
  UpdateBusinessProfileInput,
  UpdateOrderInput,
} from './contracts';
import { request } from './http';
import {
  mockActivateStage,
  mockCompleteOrder,
  mockCreateOrder,
  mockDecideApproval,
  mockDownloadFile,
  mockGetBusiness,
  mockGetOrder,
  mockGetOrders,
  mockGetService,
  mockGetSchedule,
  mockGetSlots,
  mockCreateService,
  mockUpdateService,
  mockUpdateBusiness,
  mockUpdateSchedule,
  mockRecordPayment,
  mockUpdateOrder,
} from './mockData';

const isRealApi = import.meta.env.VITE_API_MODE === 'real';

export const api = {
  getService(publicToken: string): Promise<ServiceDetails> {
    return isRealApi ? request(`/services/${encodeURIComponent(publicToken)}`) : mockGetService(publicToken);
  },
  getBusiness(): Promise<BusinessProfile> {
    return isRealApi ? request('/businesses/me') : mockGetBusiness();
  },
  updateBusiness(input: UpdateBusinessProfileInput): Promise<BusinessProfile> {
    return isRealApi ? request('/businesses/me', { method: 'PATCH', body: JSON.stringify(input) }) : mockUpdateBusiness(input);
  },
  getSchedule(): Promise<ScheduleView> {
    return isRealApi ? request('/businesses/me/schedule') : mockGetSchedule();
  },
  updateSchedule(input: AvailabilitySchedule): Promise<ScheduleView> {
    return isRealApi ? request('/businesses/me/schedule', { method: 'PUT', body: JSON.stringify(input) }) : mockUpdateSchedule(input);
  },
  getAvailableSlots(serviceToken: string, date: string): Promise<AvailableSlot[]> {
    return isRealApi ? request(`/services/${encodeURIComponent(serviceToken)}/availability?date=${encodeURIComponent(date)}`) : mockGetSlots(serviceToken, date);
  },
  createService(input: CreateServiceInput): Promise<ServiceDetails> {
    return isRealApi ? request('/services', { method: 'POST', body: JSON.stringify(input) }) : mockCreateService(input);
  },
  updateService(publicToken: string, input: CreateServiceInput): Promise<ServiceDetails> {
    return isRealApi ? request(`/services/${encodeURIComponent(publicToken)}`, { method: 'PATCH', body: JSON.stringify(input) }) : mockUpdateService(publicToken, input);
  },
  getOrders(filter: OrderFilter): Promise<OrderSummary[]> {
    const query = filter === 'all' ? '' : `?filter=${encodeURIComponent(filter)}`;
    return isRealApi ? request(`/orders${query}`) : mockGetOrders(filter);
  },
  getOrder(publicToken: string): Promise<OrderDetails> {
    return isRealApi ? request(`/orders/${encodeURIComponent(publicToken)}`) : mockGetOrder(publicToken);
  },
  createOrder(input: CreateOrderInput): Promise<OrderDetails> {
    return isRealApi
      ? request('/orders', { method: 'POST', body: JSON.stringify(input) })
      : mockCreateOrder(input);
  },
  decideApproval(publicToken: string, approvalId: string, approved: boolean): Promise<void> {
    return isRealApi
      ? request(`/approvals/${encodeURIComponent(approvalId)}/decision`, {
          method: 'POST',
          body: JSON.stringify({ approved }),
        })
      : mockDecideApproval(publicToken, approved);
  },
  recordPayment(input: RecordPaymentInput): Promise<void> {
    return isRealApi
      ? request(`/orders/${encodeURIComponent(input.order_public_token)}/payments`, {
          method: 'POST',
          body: JSON.stringify({ amount: input.amount, comment: input.comment }),
        })
      : mockRecordPayment(input);
  },
  activateStage(publicToken: string, stageId: string): Promise<void> {
    return isRealApi
      ? request(`/orders/${encodeURIComponent(publicToken)}/stages/${encodeURIComponent(stageId)}/activate`, { method: 'POST' })
      : mockActivateStage(publicToken);
  },
  completeOrder(publicToken: string): Promise<void> {
    return isRealApi
      ? request(`/orders/${encodeURIComponent(publicToken)}/complete`, { method: 'POST' })
      : mockCompleteOrder(publicToken);
  },
  updateOrder(publicToken: string, input: UpdateOrderInput): Promise<void> {
    return isRealApi
      ? request(`/orders/${encodeURIComponent(publicToken)}`, { method: 'PATCH', body: JSON.stringify(input) })
      : mockUpdateOrder(publicToken, input);
  },
  downloadFile(fileId: string): Promise<void> {
    if (!isRealApi) return mockDownloadFile(fileId);
    window.location.assign(`/api/files/${encodeURIComponent(fileId)}/download`);
    return Promise.resolve();
  },
};
