import { Button } from '@maxhub/max-ui';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useCreateOrder, useService } from '../../api/hooks';
import { CreateOrderForm } from '../../components/CreateOrderForm';
import { PageState } from '../../components/PageState';

export function CreateOrderScreen() {
  const { publicToken = '' } = useParams();
  const navigate = useNavigate();
  const service = useService(publicToken);
  const createOrder = useCreateOrder();
  if (service.isPending) return <PageState variant="loading" title="Готовим форму" description="Подставляем выбранную услугу." />;
  if (service.isError) return <PageState variant="error" title="Форма недоступна" description="Не удалось получить данные услуги." action={<Button asChild size="small" variant="secondary"><Link to="/services">К услугам</Link></Button>} />;
  return (
    <CreateOrderForm
      service={service.data}
      loading={createOrder.isPending}
      onSubmit={(input) => createOrder.mutate(input, { onSuccess: (order) => navigate(`/orders/${order.public_token}`, { replace: true }) })}
    />
  );
}
