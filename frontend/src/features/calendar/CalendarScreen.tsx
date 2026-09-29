import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useOrders } from '../../api/hooks';
import { OrderCard } from '../../components/OrderCard';
import { PageState } from '../../components/PageState';

export function CalendarScreen() {
  const [roleMode, setRoleMode] = useState<'customer' | 'master'>('customer');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const query = useOrders('all');

  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector(`[data-date="${selectedDate}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
      }
    }
  }, []);
  
  const displayedOrders = query.data?.filter(order => order.role === roleMode && order.scheduled_start_at) ?? [];
  const ordersByDate = displayedOrders.reduce((acc, order) => {
    const dateStr = order.scheduled_start_at!.split('T')[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(order);
    return acc;
  }, {} as Record<string, typeof displayedOrders>);

  // Scrollable drum of 61 days (30 days back, 30 days forward)
  const today = new Date();
  const days = Array.from({ length: 61 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 30);
    return d;
  });

  const selectedOrders = ordersByDate[selectedDate] || [];

  return (
    <div className="screen calendar-screen">
      <header className="screen-heading">
        <div><p className="overline">Ваше расписание</p><h1>Календарь</h1></div>
      </header>
      
      <div className="filter-tabs role-tabs" role="tablist" aria-label="Режим">
        <button type="button" role="tab" aria-selected={roleMode === 'customer'} className={roleMode === 'customer' ? 'is-active' : ''} onClick={() => setRoleMode('customer')}>Я заказчик</button>
        <button type="button" role="tab" aria-selected={roleMode === 'master'} className={roleMode === 'master' ? 'is-active' : ''} onClick={() => setRoleMode('master')}>Моя работа</button>
      </div>

      <div ref={scrollRef} style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '16px 0', scrollbarWidth: 'none' }}>
        {days.map(d => {
          const iso = d.toISOString().split('T')[0];
          const hasOrders = !!ordersByDate[iso];
          const isSelected = iso === selectedDate;
          
          return (
            <button 
              key={iso}
              data-date={iso}
              onClick={() => setSelectedDate(iso)}
              style={{
                flexShrink: 0,
                width: '60px',
                height: '70px',
                borderRadius: '12px',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(d)}
              </span>
              <strong style={{ fontSize: '18px' }}>{d.getDate()}</strong>
              {hasOrders && (
                <div style={{ position: 'absolute', bottom: '6px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
              )}
            </button>
          );
        })}
      </div>

      {query.isPending ? (
        <PageState variant="loading" title="Загружаем" description="Проверяем расписание." />
      ) : selectedOrders.length > 0 ? (
        <div className="order-list" style={{ marginTop: '16px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>События на {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(selectedDate))}</h3>
          {selectedOrders.map(order => <OrderCard key={order.public_token} order={order} />)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <p>На этот день ничего не запланировано.</p>
        </div>
      )}
    </div>
  );
}
