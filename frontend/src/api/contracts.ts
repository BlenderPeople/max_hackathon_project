/**
 * Draft client contract for the first vertical slice.
 * Sergey owns its final API/OpenAPI form; update this file in the same PR as
 * a contract change so Roma does not have to infer server state from a role.
 */
export type OrderStatus = 'new' | 'approval' | 'in_progress' | 'done';

export type CurrentUser = {
  id: string;
  first_name: string;
  last_name: string | null;
  max_user_id: string;
  username: string | null;
};

export type OrderAction =
  | 'update'
  | 'request_approval'
  | 'activate_stage'
  | 'decide_approval'
  | 'record_payment'
  | 'complete';

export type OrderStage = {
  id: string;
  position: number;
  title: string;
  completed_at: string | null;
};

export type OrderEvent = {
  id: string;
  type: string;
  title: string;
  created_at: string;
};

export type Order = {
  public_token: string;
  service_public_token: string;
  title: string;
  description: string;
  status: OrderStatus;
  role: 'master' | 'customer';
  price: string | null;
  due_at: string | null;
  stages: OrderStage[];
  available_actions: OrderAction[];
  timeline: OrderEvent[];
};

export type Service = {
  public_token: string;
  title: string;
  description: string;
  price_from: string | null;
  image_url: string | null;
  business_name: string;
  duration: string;
  duration_minutes: number;
};

/**
 * UI adapter models. They deliberately live next to the transport contract:
 * Vasily can map the final OpenAPI responses here without changing screens.
 */
export type OrderFilter = 'all' | 'attention' | 'active' | 'overdue' | 'completed';

export type OrderSummary = Pick<
  Order,
  'public_token' | 'title' | 'description' | 'status' | 'role' | 'price' | 'due_at' | 'available_actions'
> & {
  business_name: string;
  business_owner_username: string | null;
  customer_name: string;
  amount_paid: string;
  requires_attention: boolean;
  is_overdue: boolean;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
};

export type ChatMessage = {
  public_token: string;
  author_id: string;
  author_name: string;
  is_mine: boolean;
  text: string;
  created_at: string;
};

export type Conversation = {
  public_token: string;
  service_public_token: string;
  service_title: string;
  business_name: string;
  customer_name: string;
  peer_name: string;
  role: 'master' | 'customer';
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
};

export type OrderFile = {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
};

export type Approval = {
  id: string;
  title: string;
  description: string;
  amount: string | null;
  status: 'pending' | 'approved' | 'rejected';
};

export type OrderDetails = Order & {
  business_name: string;
  business_public_token: string;
  business_owner_username: string | null;
  customer_name: string;
  created_at: string;
  amount_paid: string;
  files: OrderFile[];
  pending_approval: Approval | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
};

export type BusinessProfile = {
  public_token: string;
  handle: string;
  name: string;
  description: string;
  specialization: string;
  experience: string;
  work_features: string;
  owner_name: string;
  owner_username: string | null;
  avatar_url: string | null;
  rating: number;
  completed_orders: number;
  response_time: string;
  services: Service[];
  schedule: AvailabilitySchedule;
};

export type ServiceDetails = Service & {
  business: Omit<BusinessProfile, 'services' | 'schedule'>;
};

export type CreateOrderInput = {
  service_public_token: string;
  customer_public_token?: string;
  description: string;
  due_at: string | null;
  scheduled_start_at: string;
  scheduled_end_at: string;
};

export type RecordPaymentInput = {
  order_public_token: string;
  amount: string;
  comment: string;
};

export type UpdateOrderInput = {
  description: string;
  due_at: string | null;
  price?: string;
};

export type UpdateBusinessProfileInput = {
  name: string;
  specialization: string;
  experience: string;
  work_features: string;
  description: string;
  avatar_data_url: string | null;
};

export type CreateServiceInput = {
  title: string;
  description: string;
  price_from: string;
  duration_minutes: number;
  image_data_url: string | null;
};

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type TimeInterval = {
  id: string;
  start: string;
  end: string;
};

export type WeeklyAvailability = {
  weekday: Weekday;
  enabled: boolean;
  intervals: TimeInterval[];
};

export type ScheduleOverride = {
  date: string;
  mode: 'closed' | 'custom';
  intervals: TimeInterval[];
};

export type AvailabilitySchedule = {
  timezone: string;
  slot_duration_minutes: number;
  weekly: WeeklyAvailability[];
  overrides: ScheduleOverride[];
};

export type AvailableSlot = {
  start_at: string;
  end_at: string;
};

export type ScheduleView = AvailabilitySchedule & {
  bookings: Array<{
    order_public_token: string;
    service_title: string;
    customer_name: string;
    start_at: string;
    end_at: string;
  }>;
};
