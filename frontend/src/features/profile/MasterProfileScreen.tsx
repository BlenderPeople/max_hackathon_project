import { Avatar } from '@maxhub/max-ui';
import { BadgeCheck, Clock3, Star } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { useBusinessProfile } from '../../api/hooks';
import { PageState } from '../../components/PageState';
import { ServiceCard } from '../../components/ServiceCard';

export function MasterProfileScreen() {
  const { publicToken = '' } = useParams();
  const query = useBusinessProfile(publicToken);

  if (query.isPending) return <PageState variant="loading" title="Открываем профиль" description="Загружаем данные мастера." />;
  if (query.isError) return <PageState variant="error" title="Профиль недоступен" description="Ссылка могла устареть." />;

  const business = query.data;

  const stickers = ['🐶', '🐱', '🐼', '🦊', '🐻', '🐨', '🐸', '🐢', '🦖', '🐙'];
  const gradients = ['linear-gradient(135deg, #a8e063, #56ab2f)', 'linear-gradient(135deg, #4facfe, #00f2fe)', 'linear-gradient(135deg, #f6d365, #fda085)', 'linear-gradient(135deg, #c471f5, #fa71cd)', 'linear-gradient(135deg, #ff0844, #ffb199)'];
  const seed = publicToken.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const sticker = stickers[seed % stickers.length];
  const gradient = gradients[seed % gradients.length];

  return (
    <div className="screen public-profile">
      <header className="public-profile-header">
        <Avatar.Container size={82}>
          {business.avatar_url ? <Avatar.Image src={business.avatar_url} alt="" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: gradient, fontSize: '40px', lineHeight: 1 }}>{sticker}</div>}
        </Avatar.Container>
        <div>
          <h1>{business.owner_name}<BadgeCheck size={20} /></h1>
          <span>{business.name}</span>
        </div>
      </header>
      
      <div className="profile-metrics">
        <div><strong>{business.rating.toFixed(1)}</strong><span><Star size={11} /> рейтинг</span></div>
        <div><strong>{business.completed_orders}</strong><span>заказов</span></div>
      </div>
      
      <section className="profile-about">
        <h2>О мастере</h2>
        <p>{business.description}</p>
        <dl>
          <div><dt>Опыт</dt><dd>{business.experience}</dd></div>
          <div><dt>Особенности работы</dt><dd>{business.work_features}</dd></div>
        </dl>
      </section>
      
      <section>
        <div className="section-heading">
          <div><h2>Услуги</h2><p>Выберите нужную услугу.</p></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {business.services?.length ? (
            business.services.map(service => (
              <a key={service.public_token} href={`/services/${service.public_token}/master`} style={{ display: 'block', padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text)' }}>
                <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>{service.title}</strong>
                <span style={{ display: 'block', color: 'var(--muted)', fontSize: '14px', marginBottom: '8px' }}>{service.duration}</span>
                <span style={{ fontWeight: 600 }}>от {service.price_from} ₽</span>
              </a>
            ))
          ) : (
            <p className="muted-copy">У этого мастера пока нет активных услуг.</p>
          )}
        </div>
      </section>
    </div>
  );
}
