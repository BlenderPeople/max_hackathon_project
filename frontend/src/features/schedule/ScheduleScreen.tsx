import { Button, Switch } from '@maxhub/max-ui';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { AvailabilitySchedule, ScheduleOverride, TimeInterval, Weekday, WeeklyAvailability } from '../../api/contracts';
import { useSchedule, useUpdateSchedule } from '../../api/hooks';
import { PageState } from '../../components/PageState';

const days: Array<{ value: Weekday; label: string }> = [{ value: 1, label: 'Понедельник' }, { value: 2, label: 'Вторник' }, { value: 3, label: 'Среда' }, { value: 4, label: 'Четверг' }, { value: 5, label: 'Пятница' }, { value: 6, label: 'Суббота' }, { value: 7, label: 'Воскресенье' }];
const nextDate = () => { const value = new Date(); value.setDate(value.getDate() + 1); return value.toISOString().slice(0, 10); };

export function ScheduleScreen() {
  const query = useSchedule();
  const update = useUpdateSchedule();
  const [draft, setDraft] = useState<AvailabilitySchedule | null>(null);
  const [exceptionDate, setExceptionDate] = useState(nextDate());
  const [closed, setClosed] = useState(true);
  useEffect(() => { if (query.data) setDraft({ timezone: query.data.timezone, slot_duration_minutes: query.data.slot_duration_minutes, weekly: structuredClone(query.data.weekly), overrides: structuredClone(query.data.overrides) }); }, [query.data]);
  if (query.isPending || !draft) return <PageState variant="loading" title="Открываем расписание" description="Загружаем рабочие часы и записи." />;
  if (query.isError) return <PageState variant="error" title="Расписание недоступно" description="Попробуйте ещё раз позднее." />;
  const replaceDay = (weekday: Weekday, change: (current: WeeklyAvailability) => WeeklyAvailability) => setDraft((current) => current ? { ...current, weekly: current.weekly.map((item) => item.weekday === weekday ? change(item) : item) } : current);
  const updateInterval = (weekday: Weekday, id: string, key: 'start' | 'end', value: string) => replaceDay(weekday, (day) => ({ ...day, intervals: day.intervals.map((item) => item.id === id ? { ...item, [key]: value } : item) }));
  const addOverride = () => { const interval: TimeInterval = { id: `override-${Date.now()}`, start: '10:00', end: '14:00' }; const item: ScheduleOverride = { date: exceptionDate, mode: closed ? 'closed' : 'custom', intervals: closed ? [] : [interval] }; setDraft((current) => current ? { ...current, overrides: [...current.overrides.filter((entry) => entry.date !== exceptionDate), item].sort((a, b) => a.date.localeCompare(b.date)) } : current); };
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  return <div className="screen schedule-screen"><header className="screen-heading"><div><p className="overline">Рабочее время</p><h1>Расписание</h1></div></header>
    <section className="schedule-section"><div className="section-heading"><div><h2>Недельный график</h2><p>Начало слотов каждые {draft.slot_duration_minutes} минут.</p></div></div><div className="week-list">{days.map(({ value, label }) => { const day = draft.weekly.find((item) => item.weekday === value)!; return <div className="week-row" key={value}><div className="week-title"><Switch checked={day.enabled} onChange={() => replaceDay(value, (item) => ({ ...item, enabled: !item.enabled, intervals: item.intervals.length ? item.intervals : [{ id: `${value}-${Date.now()}`, start: '10:00', end: '18:00' }] }))} /><strong>{label}</strong></div>{day.enabled ? <div className="interval-list">{day.intervals.map((interval) => <div className="interval-row" key={interval.id}><input aria-label={`${label}, начало`} type="time" value={interval.start} onChange={(event) => updateInterval(value, interval.id, 'start', event.target.value)} /><span>—</span><input aria-label={`${label}, конец`} type="time" value={interval.end} onChange={(event) => updateInterval(value, interval.id, 'end', event.target.value)} /><button type="button" aria-label={`Удалить интервал, ${label}`} onClick={() => replaceDay(value, (item) => ({ ...item, intervals: item.intervals.filter((entry) => entry.id !== interval.id) }))}><Trash2 size={17} /></button></div>)}<button className="text-command" type="button" onClick={() => replaceDay(value, (item) => ({ ...item, intervals: [...item.intervals, { id: `${value}-${Date.now()}`, start: '10:00', end: '18:00' }] }))}><Plus size={16} />Интервал</button></div> : <span className="day-off">Выходной</span>}</div>; })}</div></section>
    <section className="schedule-section"><div className="section-heading"><div><h2>Исключения</h2><p>Закройте день или замените обычные часы.</p></div></div><div className="override-editor"><input className="plain-input" type="date" min={new Date().toISOString().slice(0, 10)} value={exceptionDate} onChange={(event) => setExceptionDate(event.target.value)} /><label><input type="checkbox" checked={closed} onChange={(event) => setClosed(event.target.checked)} />Закрыть весь день</label><Button type="button" size="small" variant="secondary" onClick={addOverride}>Добавить</Button></div><div className="override-list">{draft.overrides.length ? draft.overrides.map((item) => <div key={item.date}><CalendarClock size={18} /><div><strong>{dateFormat.format(new Date(`${item.date}T12:00:00`))}</strong><span>{item.mode === 'closed' ? 'День закрыт' : item.intervals.map((interval) => `${interval.start}–${interval.end}`).join(', ')}</span></div><button type="button" aria-label="Удалить исключение" onClick={() => setDraft((current) => current ? { ...current, overrides: current.overrides.filter((entry) => entry.date !== item.date) } : current)}><Trash2 size={17} /></button></div>) : <p className="muted-copy">Исключений пока нет.</p>}</div></section>
    <Button size="large" stretched loading={update.isPending} onClick={() => update.mutate(draft)}>Сохранить расписание</Button>
  </div>;
}
