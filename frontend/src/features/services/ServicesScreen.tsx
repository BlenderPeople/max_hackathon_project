import { useBusiness } from '../../api/hooks';
import { PageState } from '../../components/PageState';
import { ServiceCard } from '../../components/ServiceCard';

export function ServicesScreen() {
  const query = useBusiness();
  return (
    <div className="screen">
      <header className="screen-heading"><div><p className="overline">Каталог мастера</p><h1>Услуги</h1></div><Button asChild size="small" iconBefore={<Plus size={18} />}><Link to="/services/new">Добавить</Link></Button></header>
      {query.isPending ? <PageState variant="loading" title="Загружаем услуги" description="Это займёт несколько секунд." /> : query.isError ? <PageState variant="error" title="Не удалось открыть услуги" description="Попробуйте ещё раз позднее." /> : <div className="service-list">{query.data.services.map((item) => <div className="owned-service" key={item.public_token}><ServiceCard service={{ ...item, business: { ...query.data } }} /><Button asChild size="small" variant="secondary" iconBefore={<Pencil size={16} />}><Link to={`/services/${item.public_token}/edit`}>Редактировать</Link></Button></div>)}</div>}
    </div>
  );
}
import { Button } from '@maxhub/max-ui';
import { Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
