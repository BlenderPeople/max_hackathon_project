import type {
  Approval,
  AvailabilitySchedule,
  AvailableSlot,
  BusinessProfile,
  CreateOrderInput,
  CreateServiceInput,
  OrderDetails,
  OrderFile,
  OrderFilter,
  OrderSummary,
  RecordPaymentInput,
  ScheduleView,
  Service,
  ServiceDetails,
  UpdateBusinessProfileInput,
  UpdateOrderInput,
} from './contracts';

const delay = (ms = 260) => new Promise((resolve) => window.setTimeout(resolve, ms));
const zone = '+07:00';

const schedule: AvailabilitySchedule = {
  timezone: 'Asia/Novosibirsk',
  slot_duration_minutes: 30,
  weekly: [
    { weekday: 1, enabled: true, intervals: [{ id: 'mon-1', start: '10:00', end: '18:00' }] },
    { weekday: 2, enabled: true, intervals: [{ id: 'tue-1', start: '10:00', end: '18:00' }] },
    { weekday: 3, enabled: true, intervals: [{ id: 'wed-1', start: '10:00', end: '18:00' }] },
    { weekday: 4, enabled: true, intervals: [{ id: 'thu-1', start: '10:00', end: '18:00' }] },
    { weekday: 5, enabled: true, intervals: [{ id: 'fri-1', start: '10:00', end: '18:00' }] },
    { weekday: 6, enabled: true, intervals: [{ id: 'sat-1', start: '11:00', end: '15:00' }] },
    { weekday: 7, enabled: false, intervals: [] },
  ],
  overrides: [{ date: '2026-09-26', mode: 'closed', intervals: [] }],
};

let business: BusinessProfile = {
  name: 'Зелёный двор',
  description: 'Уход за деревьями и садом в Новосибирске и области.',
  specialization: 'Арбористика и уход за садом',
  experience: '8 лет практики',
  work_features: 'Работаю аккуратно, заранее согласую объём и убираю за собой.',
  owner_name: 'Алексей Воронцов',
  avatar_url: null,
  rating: 4.9,
  completed_orders: 86,
  response_time: 'Отвечает за 20 минут',
  services: [],
  schedule,
};

function businessView(): Omit<BusinessProfile, 'services' | 'schedule'> {
  const { services: _services, schedule: _schedule, ...view } = business;
  return view;
}

let services: ServiceDetails[] = [
  {
    public_token: 'svc_7Qm2pL8kVx4N',
    title: 'Обрезка деревьев',
    description: 'Санитарная и формирующая обрезка плодовых и декоративных деревьев. Уберу сухие ветви, разгружу крону и подготовлю дерево к сезону.',
    price_from: '5000.00', image_url: '/assets/tree-pruning.jpg', business_name: business.name, duration: '2 часа', duration_minutes: 120, business: businessView(),
  },
  {
    public_token: 'svc_garden_02', title: 'Диагностика дерева', description: 'Осмотр дерева, оценка рисков и понятные рекомендации по уходу или удалению.',
    price_from: '2500.00', image_url: '/assets/tree-pruning.jpg', business_name: business.name, duration: '1 час', duration_minutes: 60, business: businessView(),
  },
];

const files: OrderFile[] = [
  { id: 'file_result_01', filename: 'акт-выполненных-работ.pdf', content_type: 'application/pdf', size: 248_320, created_at: '2026-09-21T12:10:00+07:00' },
  { id: 'file_photo_02', filename: 'результат.jpg', content_type: 'image/jpeg', size: 1_482_000, created_at: '2026-09-21T12:06:00+07:00' },
];
const approval: Approval = { id: 'approval_price_01', title: 'Согласование стоимости', description: 'Обрезка трёх яблонь и вывоз веток после работ.', amount: '12000.00', status: 'pending' };

function seedOrder(input: Partial<OrderDetails> & Pick<OrderDetails, 'public_token' | 'title' | 'description' | 'status' | 'price' | 'due_at' | 'customer_name' | 'created_at' | 'amount_paid' | 'available_actions' | 'pending_approval' | 'scheduled_start_at' | 'scheduled_end_at' | 'stages' | 'timeline'>): OrderDetails {
  return { business_name: business.name, files: [], ...input };
}

let orders: OrderDetails[] = [
  seedOrder({
    public_token: 'ord_B9kP2xR7mQ4L', title: 'Обрезка трёх яблонь', description: 'Нужно убрать сухие ветки и снизить высоту крон. Доступ на участок свободный после 10:00.', status: 'approval', price: '12000.00', due_at: '2026-09-24T18:00:00+07:00', customer_name: 'Мария К.', created_at: '2026-09-20T11:15:00+07:00', amount_paid: '0.00', available_actions: ['decide_approval'], pending_approval: approval, scheduled_start_at: '2026-09-25T10:00:00+07:00', scheduled_end_at: '2026-09-25T12:00:00+07:00',
    stages: [{ id: 'stage_inspection', position: 1, title: 'Осмотр участка', completed_at: '2026-09-20T15:40:00+07:00' }, { id: 'stage_pruning', position: 2, title: 'Обрезка деревьев', completed_at: null }, { id: 'stage_cleanup', position: 3, title: 'Уборка и вывоз', completed_at: null }], timeline: [{ id: 'event_approval', type: 'approval.requested', title: 'Стоимость отправлена на согласование', created_at: '2026-09-21T09:20:00+07:00' }],
  }),
  seedOrder({
    public_token: 'ord_M4sT8vN1cZ6A', title: 'Удаление сухих веток', description: 'Две берёзы у забора, ветки нависают над парковкой.', status: 'in_progress', price: '18000.00', due_at: '2026-09-23T17:00:00+07:00', customer_name: 'Иван С.', created_at: '2026-09-18T14:30:00+07:00', amount_paid: '7000.00', available_actions: ['update', 'activate_stage', 'record_payment', 'complete'], pending_approval: null, scheduled_start_at: '2026-09-24T13:00:00+07:00', scheduled_end_at: '2026-09-24T15:00:00+07:00', stages: [{ id: 'stage_setup', position: 1, title: 'Подготовка и страховка', completed_at: '2026-09-21T09:00:00+07:00' }, { id: 'stage_cut', position: 2, title: 'Удаление веток', completed_at: null }], timeline: [{ id: 'event_payment', type: 'payment.recorded', title: 'Получена предоплата 7 000 ₽', created_at: '2026-09-21T10:10:00+07:00' }],
  }),
  seedOrder({
    public_token: 'ord_C8dJ3wF5hS2E', title: 'Формирование кроны клёна', description: 'Работы завершены, результат принят.', status: 'done', price: '8500.00', due_at: '2026-09-18T16:00:00+07:00', customer_name: 'Ольга Р.', created_at: '2026-09-13T10:00:00+07:00', amount_paid: '8500.00', available_actions: [], pending_approval: null, scheduled_start_at: null, scheduled_end_at: null, files, stages: [{ id: 'stage_assess_done', position: 1, title: 'Оценка дерева', completed_at: '2026-09-14T10:00:00+07:00' }, { id: 'stage_shape_done', position: 2, title: 'Формирование кроны', completed_at: '2026-09-17T15:20:00+07:00' }], timeline: [{ id: 'event_done', type: 'order.completed', title: 'Заказ завершён', created_at: '2026-09-17T16:00:00+07:00' }],
  }),
  seedOrder({
    public_token: 'ord_X2fL9aV7qW3K', title: 'Осмотр старой ели', description: 'Нужно оценить безопасность дерева после сильного ветра.', status: 'new', price: null, due_at: '2026-09-21T18:00:00+07:00', customer_name: 'Антон П.', created_at: '2026-09-19T12:45:00+07:00', amount_paid: '0.00', available_actions: ['update'], pending_approval: null, scheduled_start_at: null, scheduled_end_at: null, stages: [{ id: 'stage_assess', position: 1, title: 'Осмотр дерева', completed_at: null }], timeline: [{ id: 'event_created_4', type: 'order.created', title: 'Заказ создан', created_at: '2026-09-19T12:45:00+07:00' }],
  }),
];

function serviceView(item: ServiceDetails): ServiceDetails { return { ...item, business: businessView() }; }
function dateWithTime(date: string, time: string) { return new Date(`${date}T${time}:00${zone}`); }
function weekday(date: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 { const value = new Date(`${date}T12:00:00${zone}`).getDay(); return (value === 0 ? 7 : value) as 1 | 2 | 3 | 4 | 5 | 6 | 7; }
function minutes(time: string) { const [hours, mins] = time.split(':').map(Number); return hours * 60 + mins; }
function timeString(value: number) { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
function scheduleIntervals(date: string) { const override = business.schedule.overrides.find((item) => item.date === date); if (override?.mode === 'closed') return []; if (override?.mode === 'custom') return override.intervals; return business.schedule.weekly.find((item) => item.weekday === weekday(date) && item.enabled)?.intervals ?? []; }
function overlaps(start: number, end: number, otherStart: number, otherEnd: number) { return start < otherEnd && end > otherStart; }

function toSummary(order: OrderDetails): OrderSummary {
  const due = order.due_at ? new Date(order.due_at).getTime() : Infinity;
  return { public_token: order.public_token, title: order.title, description: order.description, status: order.status, price: order.price, due_at: order.due_at, business_name: order.business_name, customer_name: order.customer_name, amount_paid: order.amount_paid, available_actions: order.available_actions, requires_attention: order.available_actions.includes('decide_approval'), is_overdue: order.status !== 'done' && due < Date.now() };
}

export async function mockGetService(publicToken: string): Promise<ServiceDetails> { await delay(); if (publicToken === 'error') throw new Error('Не удалось загрузить услугу'); const item = services.find((service) => service.public_token === publicToken); if (!item) throw new Error('Услуга не найдена'); return structuredClone(serviceView(item)); }
export async function mockGetBusiness(): Promise<BusinessProfile> { await delay(280); business.services = services; return structuredClone(business); }
export async function mockGetOrders(filter: OrderFilter): Promise<OrderSummary[]> { await delay(); const summaries = orders.map(toSummary); if (filter === 'attention') return summaries.filter((item) => item.requires_attention); if (filter === 'active') return summaries.filter((item) => ['new', 'approval', 'in_progress'].includes(item.status)); if (filter === 'overdue') return summaries.filter((item) => item.is_overdue); if (filter === 'completed') return summaries.filter((item) => item.status === 'done'); return summaries; }
export async function mockGetOrder(publicToken: string): Promise<OrderDetails> { await delay(); const order = orders.find((item) => item.public_token === publicToken); if (!order) throw new Error('Заказ не найден'); return structuredClone(order); }

export async function mockGetSlots(serviceToken: string, date: string): Promise<AvailableSlot[]> {
  await delay(180); const item = services.find((service) => service.public_token === serviceToken); if (!item) throw new Error('Услуга не найдена'); const result: AvailableSlot[] = []; const duration = item.duration_minutes; const step = business.schedule.slot_duration_minutes;
  for (const interval of scheduleIntervals(date)) for (let start = minutes(interval.start); start + duration <= minutes(interval.end); start += step) { const startAt = dateWithTime(date, timeString(start)); const endAt = new Date(startAt.getTime() + duration * 60_000); const occupied = orders.some((order) => order.scheduled_start_at && order.scheduled_end_at && overlaps(startAt.getTime(), endAt.getTime(), new Date(order.scheduled_start_at).getTime(), new Date(order.scheduled_end_at).getTime())); if (startAt.getTime() > Date.now() && !occupied) result.push({ start_at: startAt.toISOString(), end_at: endAt.toISOString() }); }
  return result;
}

export async function mockGetSchedule(): Promise<ScheduleView> { await delay(280); return structuredClone({ ...business.schedule, bookings: orders.filter((item) => item.scheduled_start_at && item.scheduled_end_at && item.status !== 'done').map((item) => ({ order_public_token: item.public_token, service_title: item.title, customer_name: item.customer_name, start_at: item.scheduled_start_at!, end_at: item.scheduled_end_at! })) }); }
export async function mockUpdateBusiness(input: UpdateBusinessProfileInput): Promise<BusinessProfile> { await delay(420); business = { ...business, ...input, avatar_url: input.avatar_data_url }; business.services = services; return structuredClone(business); }
export async function mockCreateService(input: CreateServiceInput): Promise<ServiceDetails> { await delay(520); const item: ServiceDetails = { public_token: `svc_${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`, title: input.title, description: input.description, price_from: input.price_from, image_url: input.image_data_url, business_name: business.name, duration: `${input.duration_minutes} минут`, duration_minutes: input.duration_minutes, business: businessView() }; services = [item, ...services]; business.services = services; return structuredClone(item); }
export async function mockUpdateService(publicToken: string, input: CreateServiceInput): Promise<ServiceDetails> { await delay(420); services = services.map((item) => item.public_token === publicToken ? { ...item, title: input.title, description: input.description, price_from: input.price_from, image_url: input.image_data_url, duration: `${input.duration_minutes} минут`, duration_minutes: input.duration_minutes } : item); business.services = services; const updated = services.find((item) => item.public_token === publicToken); if (!updated) throw new Error('Услуга не найдена'); return structuredClone(serviceView(updated)); }
export async function mockUpdateSchedule(input: AvailabilitySchedule): Promise<ScheduleView> { await delay(420); business.schedule = structuredClone(input); return mockGetSchedule(); }

export async function mockCreateOrder(input: CreateOrderInput): Promise<OrderDetails> {
  await delay(620); const item = services.find((service) => service.public_token === input.service_public_token); if (!item) throw new Error('Услуга не найдена'); const collision = orders.some((order) => order.scheduled_start_at && order.scheduled_end_at && overlaps(new Date(input.scheduled_start_at).getTime(), new Date(input.scheduled_end_at).getTime(), new Date(order.scheduled_start_at).getTime(), new Date(order.scheduled_end_at).getTime())); if (collision) throw new Error('Этот слот уже занят'); const timestamp = new Date().toISOString();
  const order = seedOrder({ public_token: `ord_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`, title: item.title, description: input.description, status: 'new', price: null, due_at: input.due_at, customer_name: 'Вы', created_at: timestamp, amount_paid: '0.00', available_actions: ['update'], pending_approval: null, scheduled_start_at: input.scheduled_start_at, scheduled_end_at: input.scheduled_end_at, stages: [{ id: 'stage_inspection_new', position: 1, title: 'Осмотр и оценка', completed_at: null }, { id: 'stage_work_new', position: 2, title: 'Выполнение работ', completed_at: null }, { id: 'stage_acceptance_new', position: 3, title: 'Приёмка', completed_at: null }], timeline: [{ id: `event_created_${Date.now()}`, type: 'order.created', title: 'Заказ создан', created_at: timestamp }] }); orders = [order, ...orders]; return structuredClone(order);
}

export async function mockDecideApproval(publicToken: string, approved: boolean) { await delay(380); orders = orders.map((order) => order.public_token === publicToken ? { ...order, status: approved ? 'in_progress' : 'new', available_actions: [], pending_approval: order.pending_approval ? { ...order.pending_approval, status: approved ? 'approved' : 'rejected' } : null, timeline: [{ id: `event_decision_${Date.now()}`, type: 'approval.decided', title: approved ? 'Стоимость подтверждена' : 'Согласование отклонено', created_at: new Date().toISOString() }, ...order.timeline] } : order); }
export async function mockRecordPayment(input: RecordPaymentInput) { await delay(380); orders = orders.map((order) => order.public_token === input.order_public_token ? { ...order, amount_paid: (Number(order.amount_paid) + Number(input.amount)).toFixed(2), timeline: [{ id: `event_payment_${Date.now()}`, type: 'payment.recorded', title: `Оплата ${Math.round(Number(input.amount)).toLocaleString('ru-RU')} ₽ зафиксирована`, created_at: new Date().toISOString() }, ...order.timeline] } : order); }
export async function mockActivateStage(publicToken: string) { await delay(320); orders = orders.map((order) => { if (order.public_token !== publicToken) return order; const current = order.stages.find((stage) => !stage.completed_at); return current ? { ...order, stages: order.stages.map((stage) => stage.id === current.id ? { ...stage, completed_at: new Date().toISOString() } : stage) } : order; }); }
export async function mockCompleteOrder(publicToken: string) { await delay(380); orders = orders.map((order) => order.public_token === publicToken ? { ...order, status: 'done', available_actions: [], stages: order.stages.map((stage) => ({ ...stage, completed_at: stage.completed_at ?? new Date().toISOString() })) } : order); }
export async function mockUpdateOrder(publicToken: string, input: UpdateOrderInput) { await delay(320); orders = orders.map((order) => order.public_token === publicToken ? { ...order, ...input } : order); }
export async function mockDownloadFile(fileId: string) { await delay(120); const file = files.find((item) => item.id === fileId); const blob = new Blob([`Демонстрационный файл: ${file?.filename ?? fileId}`], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = file?.filename.replace(/\.[^.]+$/, '.txt') ?? 'file.txt'; anchor.click(); URL.revokeObjectURL(url); }
