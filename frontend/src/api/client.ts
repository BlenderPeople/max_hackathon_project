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
  Conversation,
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

const mockConversations: Conversation[] = [];

const isRealApi = import.meta.env.VITE_API_MODE === 'real';

export const api = {
  getMe(): Promise<CurrentUser> {
    return isRealApi ? request('/me') : Promise.resolve({ id: 'demo_customer', first_name: 'Демо', last_name: 'Клиент', max_user_id: '900000002', username: 'demo_customer' });
  },
  getService(publicToken: string): Promise<ServiceDetails> {
    return isRealApi ? request(`/services/${encodeURIComponent(publicToken)}`) : mockGetService(publicToken);
  },
  searchBusinesses(query: string): Promise<BusinessProfile[]> {
    return isRealApi ? request(`/businesses/search?q=${encodeURIComponent(query)}`) : mockGetBusiness().then(b => [b]);
  },
  getBusiness(): Promise<BusinessProfile> {
    return isRealApi ? request('/businesses/me') : mockGetBusiness();
  },
  getBusinessProfile(publicToken: string): Promise<BusinessProfile> {
    return isRealApi ? request(`/businesses/${encodeURIComponent(publicToken)}`) : mockGetBusiness();
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
  getConversations(): Promise<Conversation[]> {
    return isRealApi ? request('/conversations') : Promise.resolve(structuredClone(mockConversations));
  },
  getConversation(publicToken: string): Promise<Conversation> {
    if (isRealApi) return request(`/conversations/${encodeURIComponent(publicToken)}`);
    const chat = mockConversations.find((item) => item.public_token === publicToken);
    return chat ? Promise.resolve(structuredClone(chat)) : Promise.reject(new Error('Чат не найден'));
  },
  async createConversation(servicePublicToken: string): Promise<Conversation> {
    if (isRealApi) return request('/conversations', { method: 'POST', body: JSON.stringify({ service_public_token: servicePublicToken }) });
    const existing = mockConversations.find((item) => item.service_public_token === servicePublicToken);
    if (existing) return structuredClone(existing);
    const service = await mockGetService(servicePublicToken);
    const now = new Date().toISOString();
    const chat: Conversation = { public_token: `chat_${crypto.randomUUID()}`, service_public_token: servicePublicToken, service_title: service.title, business_name: service.business_name, customer_name: 'Демо Клиент', peer_name: service.business.owner_name, role: 'customer', created_at: now, updated_at: now, messages: [] };
    mockConversations.unshift(chat);
    return structuredClone(chat);
  },
  async createOrderConversation(orderPublicToken: string): Promise<Conversation> {
    if (isRealApi) return request(`/orders/${encodeURIComponent(orderPublicToken)}/conversation`, { method: 'POST' });
    const order = await mockGetOrder(orderPublicToken);
    return this.createConversation(order.service_public_token);
  },
  async sendMessage(publicToken: string, text: string): Promise<Conversation> {
    if (isRealApi) return request(`/conversations/${encodeURIComponent(publicToken)}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
    const chat = mockConversations.find((item) => item.public_token === publicToken);
    if (!chat) throw new Error('Чат не найден');
    const now = new Date().toISOString();
    chat.messages.push({ public_token: `msg_${crypto.randomUUID()}`, author_id: 'demo_customer', author_name: 'Демо Клиент', is_mine: true, text: text.trim(), created_at: now });
    chat.updated_at = now;
    return structuredClone(chat);
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
