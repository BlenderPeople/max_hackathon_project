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
  CurrentUser,
} from './contracts';
import { request, requestBlob } from './http';
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
  mockRequestApproval,
  mockUpdateOrder,
  mockUploadFile,
} from './mockData';

const isRealApi = import.meta.env.VITE_API_MODE === 'real';

export const api = {
  getMe(): Promise<CurrentUser> {
    return isRealApi ? request('/me') : Promise.resolve({ id: 'demo_customer', first_name: 'Демо', last_name: 'Клиент', max_user_id: '900000002' });
  },
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
  requestApproval(publicToken: string): Promise<void> {
    return isRealApi
      ? request(`/orders/${encodeURIComponent(publicToken)}/approvals`, {
          method: 'POST', body: JSON.stringify({ title: 'Согласование стоимости' }),
        })
      : mockRequestApproval(publicToken);
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
  uploadFile(orderToken: string, file: File): Promise<void> {
    if (!isRealApi) return mockUploadFile(orderToken, file);
    const body = new FormData();
    body.append('file', file);
    return request(`/orders/${encodeURIComponent(orderToken)}/files`, { method: 'POST', body });
  },
  async downloadFile(fileId: string, filename: string): Promise<void> {
    if (!isRealApi) return mockDownloadFile(fileId);
    const blob = await requestBlob(`/files/${encodeURIComponent(fileId)}/download`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
