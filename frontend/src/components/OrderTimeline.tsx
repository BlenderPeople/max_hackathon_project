import { Check, Circle } from 'lucide-react';

import type { OrderEvent, OrderStage } from '../api/contracts';
import { formatDateTime } from '../lib/format';
import { SectionHeader } from './SectionHeader';

export function OrderStages({ stages }: { stages: OrderStage[] }) {
  const activeIndex = stages.findIndex((stage) => !stage.completed_at);
  return (
    <section className="detail-section">
      <SectionHeader title="Этапы работы" trailing={<span className="section-count">{stages.filter((stage) => stage.completed_at).length}/{stages.length}</span>} />
      <ol className="stage-list">
        {stages.map((stage, index) => {
          const completed = Boolean(stage.completed_at);
          const active = index === activeIndex;
          return (
            <li key={stage.id} className={completed ? 'is-completed' : active ? 'is-current' : ''}>
              <span className="stage-marker">{completed ? <Check size={15} /> : <Circle size={11} fill={active ? 'currentColor' : 'none'} />}</span>
              <div><strong>{stage.title}</strong><span>{completed ? 'Готово' : active ? 'Текущий этап' : 'Впереди'}</span></div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <section className="detail-section">
      <SectionHeader title="История" />
      <ol className="timeline-list">
        {events.map((event) => (
          <li key={event.id}>
            <span className="timeline-dot" />
            <div><strong>{event.title}</strong><time dateTime={event.created_at}>{formatDateTime(event.created_at)}</time></div>
          </li>
        ))}
      </ol>
    </section>
  );
}
