import { Avatar, Button } from '@maxhub/max-ui';
import { ArrowRight, BadgeCheck, MessageCircle, Share2, Star } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useService } from '../../api/hooks';
import { PageState } from '../../components/PageState';
import { ServiceCard } from '../../components/ServiceCard';

export function ServiceScreen() {
  const { publicToken = '' } = useParams();
  const navigate = useNavigate();
  const query = useService(publicToken);
  if (query.isPending) return <PageState variant="loading" title="Открываем услугу" description="Загружаем описание и профиль мастера." />;
  if (query.isError) return <PageState variant="error" title="Услуга не открылась" description="Ссылка могла устареть. Вернитесь к списку услуг." action={<Button asChild size="small" variant="secondary"><Link to="/services">К услугам</Link></Button>} />;
  const service = query.data;
  const botName = import.meta.env.VITE_MAX_BOT_USERNAME || 't216_hakaton_bot';
  const shareUrl = `https://max.ru/${botName}?startapp=service_${service.public_token}`;
  const shareService = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: service.title, url: shareUrl }); } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          await navigator.clipboard?.writeText(shareUrl);
          alert('Ссылка скопирована!');
        }
      }
    } else {
      await navigator.clipboard?.writeText(shareUrl);
      alert('Ссылка скопирована!');
    }
  };
  const stickers = ['🐶', '🐱', '🐼', '🦊', '🐻', '🐨', '🐸', '🐢', '🦖', '🐙'];
  const gradients = ['green', 'blue', 'orange', 'purple', 'red'] as const;
  const seed = service.business.public_token ? service.business.public_token.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const sticker = stickers[seed % stickers.length];
  const gradient = gradients[seed % gradients.length];

  return (
    <div className="service-page">
      <ServiceCard service={service} detailed />
      <Link className="master-profile" to={`/services/${service.public_token}/master`} aria-label="Открыть профиль мастера">
        <Avatar.Container size={52}>{service.business.avatar_url ? <Avatar.Image src={service.business.avatar_url} alt="" /> : <Avatar.Text gradient={gradient} style={{ fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', lineHeight: 1, paddingBottom: '2px' }}>{sticker}</Avatar.Text>}</Avatar.Container>
        <div className="master-copy"><span>{service.business.specialization}</span><strong>{service.business.owner_name}<BadgeCheck size={17} /></strong><p>{service.business.experience} · {service.business.description}</p></div>
        <div className="master-rating"><Star size={15} fill="currentColor" />{service.business.rating.toFixed(1)}</div>
      </Link>
      <section className="facts-row">
        <div><strong>{service.business.completed_orders}</strong><span>заказов</span></div>
        <div><strong>{service.business.response_time.replace('Отвечает за ', '')}</strong><span>время ответа</span></div>
      </section>
      <div className="sticky-actions">
        <Button size="medium" variant="secondary" aria-label="Поделиться услугой" style={{ flex: '0 0 52px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => void shareService()}><Share2 size={21} /></Button>
        <Button asChild size="medium" variant="secondary" aria-label="Обсудить в MAX" style={{ flex: '0 0 52px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><a href="https://max.ru/t216_hakaton_bot" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><MessageCircle size={21} /></a></Button>
        <Button size="medium" variant="primary" stretched iconAfter={<ArrowRight size={19} />} onClick={() => navigate(`/services/${service.public_token}/create`)}>Заказать</Button>
      </div>
    </div>
  );
}
