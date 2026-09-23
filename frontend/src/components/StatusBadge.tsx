import type { OrderStatus } from '../api/contracts';

const statusMeta: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: 'Новый', className: 'status-new' },
  approval: { label: 'На согласовании', className: 'status-approval' },
  in_progress: { label: 'В работе', className: 'status-progress' },
  done: { label: 'Завершён', className: 'status-done' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = statusMeta[status];
  return <span className={`status-badge ${meta.className}`}>{meta.label}</span>;
}
