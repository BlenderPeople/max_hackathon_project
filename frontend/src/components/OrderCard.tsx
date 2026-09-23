import { ChevronRight, CircleAlert, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { OrderSummary } from '../api/contracts';
import { formatDate, formatMoney } from '../lib/format';
import { StatusBadge } from './StatusBadge';

export function OrderCard({ order }: { order: OrderSummary }) {
  const balance = order.price ? Math.max(0, Number(order.price) - Number(order.amount_paid)) : null;
  return (
    <Link className="order-card" to={`/orders/${order.public_token}`}>
      <div className="order-card-topline">
        <StatusBadge status={order.status} />
        {order.requires_attention && <span className="attention-label"><CircleAlert size={15} />Нужно действие</span>}
      </div>
      <div className="order-card-main">
        <div>
          <h2>{order.title}</h2>
          <p>{order.business_name} · {order.customer_name}</p>
        </div>
        <ChevronRight className="order-chevron" size={21} aria-hidden="true" />
      </div>
      <div className="order-card-footer">
        <span className={order.is_overdue ? 'is-overdue' : ''}><Clock3 size={15} />{formatDate(order.due_at)}</span>
        <strong>{balance === null ? formatMoney(null) : balance > 0 ? `Осталось ${formatMoney(String(balance))}` : 'Оплачено'}</strong>
      </div>
    </Link>
  );
}
