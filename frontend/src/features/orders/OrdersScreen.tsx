import { Button } from '@maxhub/max-ui';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

import type { OrderFilter } from '../../api/contracts';
import { useOrders } from '../../api/hooks';
import { OrderCard } from '../../components/OrderCard';
import { PageState } from '../../components/PageState';

const filters: Array<{ value: OrderFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'attention', label: 'Требуют внимания' },
  { value: 'active', label: 'В работе' },
  { value: 'overdue', label: 'Просрочены' },
  { value: 'completed', label: 'Завершены' },
];

export function OrdersScreen() {
  const [filter, setFilter] = useState<OrderFilter>('all');
  const query = useOrders(filter);
  const today = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date());
  return (
    <div className="screen orders-screen">
      <header className="screen-heading">
        <div><p className="overline">Сегодня, {today}</p><h1>Ваши заказы</h1></div>
        <Button asChild size="small" variant="primary" iconBefore={<Plus size={18} />}><Link to="/services">Новый</Link></Button>
      </header>
      <div className="filter-tabs" role="tablist" aria-label="Фильтр заказов">
        {filters.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} className={filter === item.value ? 'is-active' : ''} onClick={() => setFilter(item.value)}>{item.label}</button>
        ))}
      </div>
      {query.isPending ? (
        <PageState variant="loading" title="Загружаем заказы" description="Собираем актуальные статусы и действия." />
      ) : query.isError ? (
        <PageState variant="error" title="Заказы не загрузились" description="Проверьте соединение и попробуйте ещё раз." action={<Button variant="secondary" size="small" onClick={() => void query.refetch()}>Повторить</Button>} />
      ) : query.data.length === 0 ? (
        <PageState title="Здесь пока пусто" description="Подходящую услугу можно выбрать в каталоге." action={<Button asChild variant="primary" size="small"><Link to="/services">Выбрать услугу</Link></Button>} />
      ) : (
        <div className="order-list">{query.data.map((order) => <OrderCard key={order.public_token} order={order} />)}</div>
      )}
    </div>
  );
}
