import { Avatar, Switch } from '@maxhub/max-ui';
import { BadgeCheck, BriefcaseBusiness, CalendarClock, ChevronRight, Moon, Pencil, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useBusiness, useMe } from '../../api/hooks';
import { useTheme } from '../../components/AppShell';
import { PageState } from '../../components/PageState';

export function ProfileScreen() {
  const query = useBusiness();
  const me = useMe();
  const { theme, toggleTheme } = useTheme();
  if (query.isPending) return <PageState variant="loading" title="Открываем профиль" description="Загружаем данные мастера." />;
  if (query.isError) return <PageState variant="error" title="Профиль недоступен" description="Не удалось загрузить данные." />;
  const stickers = ['🐶', '🐱', '🐼', '🦊', '🐻', '🐨', '🐸', '🐢', '🦖', '🐙'];
  const gradients = ['green', 'blue', 'orange', 'purple', 'red'] as const;
  const seed = query.data.public_token ? query.data.public_token.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const sticker = stickers[seed % stickers.length];
  const gradient = gradients[seed % gradients.length];

  return (
    <div className="screen profile-screen">
      <header className="profile-hero">
        <Avatar.Container size={72}>{query.data.avatar_url ? <Avatar.Image src={query.data.avatar_url} alt="" /> : <Avatar.Text gradient={gradient} style={{ fontSize: '32px' }}>{sticker}</Avatar.Text>}</Avatar.Container>
        <div><h1>{query.data.owner_name}<BadgeCheck size={20} /></h1><span>{query.data.name}</span></div>
      </header>
      <div className="profile-metrics"><div><strong>{query.data.rating.toFixed(1)}</strong><span>рейтинг</span></div><div><strong>{query.data.completed_orders}</strong><span>заказов</span></div><div><strong>20 мин</strong><span>ответ</span></div></div>
      <section className="profile-about"><h2>{query.data.specialization}</h2><p>{query.data.description}</p><dl><div><dt>Опыт</dt><dd>{query.data.experience}</dd></div><div><dt>Как работаю</dt><dd>{query.data.work_features}</dd></div></dl></section>
      {me.data && <section className="profile-about"><h2>Код для заказа</h2><p>Передайте этот код мастеру, если он создаёт заказ для вас.</p><code>{me.data.id}</code></section>}
      <section className="settings-list">
        <Link to="/profile/edit"><span className="setting-icon"><Pencil size={20} /></span><div><strong>Редактировать профиль</strong><span>Аватар и информация о мастере</span></div><ChevronRight size={20} /></Link>
        <Link to="/services"><span className="setting-icon"><BriefcaseBusiness size={20} /></span><div><strong>Мои услуги</strong><span>{query.data.services.length} активная услуга</span></div><ChevronRight size={20} /></Link>
        <Link to="/schedule"><span className="setting-icon"><CalendarClock size={20} /></span><div><strong>Расписание</strong><span>Рабочие часы и записи</span></div><ChevronRight size={20} /></Link>
        <div><span className="setting-icon"><Moon size={20} /></span><div><strong>Тёмная тема</strong><span>Оформление приложения</span></div><Switch checked={theme === 'dark'} onChange={toggleTheme} /></div>
        <div><span className="setting-icon"><ShieldCheck size={20} /></span><div><strong>Профиль подтверждён</strong><span>Данные получены из MAX</span></div><BadgeCheck size={20} className="positive-icon" /></div>
      </section>
    </div>
  );
}
