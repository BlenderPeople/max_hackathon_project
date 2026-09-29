import { Button, Textarea } from '@maxhub/max-ui';
import { CalendarDays, Check, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { CreateOrderInput, ServiceDetails } from '../api/contracts';
import { useAvailableSlots } from '../api/hooks';
import { formatMoney } from '../lib/format';

type CreateOrderFormProps = {
  service: ServiceDetails;
  isMaster: boolean;
  loading: boolean;
  onSubmit: (input: CreateOrderInput) => void;
};

export function CreateOrderForm({ service, isMaster, loading, onSubmit }: CreateOrderFormProps) {
  const [description, setDescription] = useState('');
  const [customerToken, setCustomerToken] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ start_at: string; end_at: string } | null>(null);
  const slots = useAvailableSlots(service.public_token, selectedDate);
  const valid = description.trim().length >= 1 && Boolean(selectedSlot) && (!isMaster || Boolean(customerToken.trim()));
  useEffect(() => { setSelectedSlot(slots.data?.[0] ?? null); }, [selectedDate, slots.data]);
  const today = new Date().toISOString().slice(0, 10);
  const formatSlot = (value: string) => new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
  return (
    <form className="create-order-form" onSubmit={(event) => {
      event.preventDefault();
      if (valid && selectedSlot) onSubmit({ service_public_token: service.public_token, ...(isMaster ? { customer_public_token: customerToken.trim() } : {}), description: description.trim(), due_at: selectedSlot.end_at, scheduled_start_at: selectedSlot.start_at, scheduled_end_at: selectedSlot.end_at });
    }}>
      <div className="form-progress" aria-label="Шаг 2 из 2"><span /><span className="is-active" /></div>
      <header className="form-intro">
        <p className="overline">Шаг 2 из 2</p>
        <h1>Расскажите о задаче</h1>
        <p>Мастеру хватит пары деталей, чтобы оценить объём работы.</p>
      </header>
      <div className="selected-service">
        <img src={service.image_url ?? '/assets/tree-pruning.jpg'} alt="" />
        <div><strong>{service.title}</strong><span>от {formatMoney(service.price_from)}</span></div>
        <Check size={19} aria-hidden="true" />
      </div>
      {isMaster && <label className="form-field"><span>Код клиента</span><input type="text" value={customerToken} onChange={(event) => setCustomerToken(event.target.value)} placeholder="Публичный код из профиля клиента" required /><small>Клиент должен хотя бы раз открыть приложение в MAX и передать вам свой код.</small></label>}
      <label className="form-field">
        <span>Что нужно сделать</span>
        <Textarea
          value={description}
          rows={5}
          placeholder="Например, обрезать три яблони и вывезти ветки"
          aria-describedby="description-hint"
          onChange={(event) => setDescription(event.target.value)}
        />
        <small id="description-hint">Минимум 1 символ · {description.length} символов</small>
      </label>
      <label className="form-field">
        <span>Дата визита</span>
        <div className="date-field"><CalendarDays size={19} /><input type="date" min={today} value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setSelectedSlot(null); }} /></div>
        <small>Выберите день из рабочего графика мастера.</small>
      </label>
      {selectedDate && <div className="slot-picker"><span className="slot-picker-label">Свободное время</span>{slots.isPending ? <p className="muted-copy">Проверяем доступность…</p> : slots.data?.length ? <div className="slot-grid">{slots.data.map((slot) => <button key={slot.start_at} type="button" className={selectedSlot?.start_at === slot.start_at ? 'slot-button is-selected' : 'slot-button'} onClick={() => setSelectedSlot(slot)}>{formatSlot(slot.start_at)}</button>)}</div> : <p className="muted-copy">На этот день свободных интервалов нет.</p>}</div>}
      <div className="trust-note"><ShieldCheck size={20} /><p><strong>Без оплаты сейчас</strong><span>Итоговую стоимость мастер отправит на согласование.</span></p></div>
      <Button type="submit" size="large" stretched disabled={!valid} loading={loading}>Создать заказ</Button>
    </form>
  );
}
