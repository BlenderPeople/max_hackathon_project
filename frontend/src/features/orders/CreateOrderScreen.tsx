import { Button } from '@maxhub/max-ui';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useBusiness, useCreateOrder, useService } from '../../api/hooks';
import { CreateOrderForm } from '../../components/CreateOrderForm';
import { PageState } from '../../components/PageState';

export function CreateOrderScreen() {
  const { publicToken = '' } = useParams();
  const navigate = useNavigate();
  const service = useService(publicToken);
  const business = useBusiness();
  const createOrder = useCreateOrder();
  if (service.isPending) return <PageState variant="loading" title="Готовим форму" description="Подставляем выбранную услугу." />;
  if (service.isError) return <PageState variant="error" title="Форма недоступна" description="Не удалось получить данные услуги." action={<Button asChild size="small" variant="secondary"><Link to="/services">К услугам</Link></Button>} />;
  if (import.meta.env.VITE_API_MODE === 'real' && business.isPending) return <PageState variant="loading" title="Готовим форму" description="Проверяем профиль мастера." />;
  if (import.meta.env.VITE_API_MODE === 'real' && business.isError) return <PageState variant="error" title="Форма недоступна" description="Не удалось проверить профиль мастера." />;
  return (
    <CreateOrderForm
      service={service.data}
      isMaster={import.meta.env.VITE_API_MODE === 'real' && business.data?.public_token === service.data.business.public_token}
      loading={createOrder.isPending}
      onSubmit={(input) => createOrder.mutate(input, { onSuccess: (order) => navigate(`/orders/${order.public_token}`, { replace: true }) })}
    />
  );
}
