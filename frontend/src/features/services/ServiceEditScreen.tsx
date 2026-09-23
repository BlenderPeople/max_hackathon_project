import { Button } from '@maxhub/max-ui';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useCreateService, useService, useUpdateService } from '../../api/hooks';
import { ServiceForm } from '../../components/ServiceForm';
import { PageState } from '../../components/PageState';

export function ServiceEditScreen() {
  const { publicToken } = useParams();
  const editing = Boolean(publicToken);
  const service = useService(publicToken ?? '');
  const create = useCreateService();
  const update = useUpdateService(publicToken ?? '');
  const navigate = useNavigate();
  if (editing && service.isPending) return <PageState variant="loading" title="Открываем услугу" description="Загружаем данные для редактирования." />;
  if (editing && service.isError) return <PageState variant="error" title="Услуга не найдена" description="Вернитесь к списку услуг." action={<Button asChild size="small"><Link to="/services">К услугам</Link></Button>} />;
  const mutation = editing ? update : create;
  return <div className="screen editor-screen"><header className="screen-heading"><div><p className="overline">Каталог мастера</p><h1>{editing ? 'Изменить услугу' : 'Новая услуга'}</h1></div></header><ServiceForm initial={service.data} loading={mutation.isPending} onSubmit={(input) => mutation.mutate(input, { onSuccess: () => navigate('/services') })} />{mutation.isError && <p className="action-error" role="alert">Не удалось сохранить услугу: {mutation.error.message}</p>}</div>;
}
