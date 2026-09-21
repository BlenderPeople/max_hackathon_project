/**
 * Draft client contract for the first vertical slice.
 * Sergey owns its final API/OpenAPI form; update this file in the same PR as
 * a contract change so Roma does not have to infer server state from a role.
 */
export type OrderStatus = 'new' | 'approval' | 'in_progress' | 'done';

export type OrderAction =
  | 'update'
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
  title: string;
  description: string;
  status: OrderStatus;
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
};
