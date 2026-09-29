import { Button } from '@maxhub/max-ui';
import { Check, CheckCircle2, CircleAlert, MessageCircle, Pencil, Play, RussianRuble } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  useActivateStage,
  useCompleteOrder,
  useDecideApproval,
  useOrder,
  useRecordPayment,
  useRequestApproval,
  useUpdateOrder,
  useUploadFile,
} from '../../api/hooks';
import { ApprovalDialog } from '../../components/ApprovalDialog';
import { EditOrderDialog } from '../../components/EditOrderDialog';
import { FileList } from '../../components/FileList';
import { OrderStages, OrderTimeline } from '../../components/OrderTimeline';
import { PageState } from '../../components/PageState';
import { PaymentDialog } from '../../components/PaymentDialog';
import { SectionHeader } from '../../components/SectionHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate, formatMoney } from '../../lib/format';

export function OrderScreen() {
  const { publicToken = '' } = useParams();
  const query = useOrder(publicToken);
  const decideApproval = useDecideApproval(publicToken);
  const requestApproval = useRequestApproval(publicToken);
  const payment = useRecordPayment(publicToken);
  const activateStage = useActivateStage(publicToken);
  const completeOrder = useCompleteOrder(publicToken);
  const updateOrder = useUpdateOrder(publicToken);
  const uploadFile = useUploadFile(publicToken);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (query.isPending) return <PageState variant="loading" title="Открываем заказ" description="Получаем статус, оплаты и историю." />;
  if (query.isError) return <PageState variant="error" title="Заказ не открылся" description="Проверьте ссылку или попробуйте снова." action={<Button asChild size="small" variant="secondary"><Link to="/orders">К заказам</Link></Button>} />;

  const order = query.data;
  const balance = order.price ? Math.max(0, Number(order.price) - Number(order.amount_paid)) : null;
  const currentStage = order.stages.find((stage) => !stage.completed_at);
  const actionError = decideApproval.error || requestApproval.error || payment.error || activateStage.error || completeOrder.error || updateOrder.error;
  const scheduledLabel = order.scheduled_start_at ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(order.scheduled_start_at)) : null;

  return (
    <div className="order-page">
      <header className="order-hero">
        <StatusBadge status={order.status} />
        <h1>{order.title}</h1>
        <p>
          <Link to={`/master/${order.business_public_token}`} className="master-profile-link" style={{ color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
            {order.business_name}
          </Link>
          {' · заказчик '}{order.customer_name}
        </p>
      </header>

      {order.pending_approval?.status === 'pending' && order.available_actions.includes('decide_approval') && (
        <button className="attention-banner" type="button" onClick={() => setApprovalOpen(true)}>
          <span><CircleAlert size={21} /></span>
          <div><strong>Нужно ваше подтверждение</strong><p>Мастер согласовал стоимость {formatMoney(order.pending_approval.amount)}</p></div>
          <Check size={19} />
        </button>
      )}

      <section className="order-finance detail-section">
        <SectionHeader title="Стоимость" />
        <div className="finance-grid">
          <div><span>Всего</span><strong>{formatMoney(order.price)}</strong></div>
          <div><span>Оплачено</span><strong>{formatMoney(order.amount_paid)}</strong></div>
          <div className="finance-balance"><span>Осталось</span><strong>{balance === null ? '—' : formatMoney(String(balance))}</strong></div>
        </div>
      </section>

      <section className="detail-section order-description">
        <SectionHeader title="Задача" />
        <p>{order.description}</p>
        <dl>{scheduledLabel && <div><dt>Запись</dt><dd>{scheduledLabel}</dd></div>}<div><dt>Срок</dt><dd>{formatDate(order.due_at)}</dd></div><div><dt>Номер заказа</dt><dd>{order.public_token.slice(-8).toUpperCase()}</dd></div></dl>
      </section>

      {order.available_actions.length > 0 && (
        <section className="detail-section order-actions-section">
          <SectionHeader title="Доступные действия" />
          <div className="order-actions">
            {order.available_actions.includes('decide_approval') && <Button size="medium" variant="primary" iconBefore={<CheckCircle2 size={19} />} onClick={() => setApprovalOpen(true)}>Согласовать</Button>}
            {order.available_actions.includes('request_approval') && <Button size="medium" variant="primary" iconBefore={<CheckCircle2 size={19} />} loading={requestApproval.isPending} onClick={() => requestApproval.mutate()}>Отправить на согласование</Button>}
            {order.available_actions.includes('record_payment') && <Button size="medium" variant="primary" iconBefore={<RussianRuble size={19} />} onClick={() => setPaymentOpen(true)}>Добавить оплату</Button>}
            {order.available_actions.includes('activate_stage') && currentStage && <Button size="medium" variant="secondary" iconBefore={<Play size={19} />} loading={activateStage.isPending} onClick={() => activateStage.mutate(currentStage.id)}>Завершить этап</Button>}
            {order.available_actions.includes('update') && <Button size="medium" variant="secondary" iconBefore={<Pencil size={19} />} onClick={() => setEditOpen(true)}>Изменить</Button>}
            {order.available_actions.includes('complete') && <Button size="medium" variant="secondary" iconBefore={<Check size={19} />} loading={completeOrder.isPending} onClick={() => completeOrder.mutate()}>Завершить заказ</Button>}
          </div>
          {actionError && <p className="action-error" role="alert">Не удалось выполнить действие. Попробуйте ещё раз.</p>}
        </section>
      )}

      <OrderStages stages={order.stages} />
      <FileList files={order.files} uploading={uploadFile.isPending} uploadError={uploadFile.isError} onUpload={(file) => uploadFile.mutate(file)} />
      <OrderTimeline events={order.timeline} />

      <div className="order-discuss">
        <Button asChild variant="secondary" size="medium" stretched iconBefore={<MessageCircle size={19} />}>
          <a href="https://max.ru/t216_hakaton_bot" target="_blank" rel="noreferrer">Обсудить в MAX</a>
        </Button>
      </div>

      {order.pending_approval && (
        <ApprovalDialog
          approval={order.pending_approval}
          open={approvalOpen}
          loading={decideApproval.isPending}
          onClose={() => setApprovalOpen(false)}
          onDecision={(approved) => decideApproval.mutate({ approvalId: order.pending_approval!.id, approved }, { onSuccess: () => setApprovalOpen(false) })}
        />
      )}
      <PaymentDialog
        key={`${paymentOpen}-${balance}`}
        open={paymentOpen}
        loading={payment.isPending}
        balance={balance ?? 0}
        onClose={() => setPaymentOpen(false)}
        onSubmit={(amount, comment) => payment.mutate({ amount, comment }, { onSuccess: () => setPaymentOpen(false) })}
      />
      <EditOrderDialog
        open={editOpen}
        description={order.description}
        dueAt={order.due_at}
        price={order.price}
        loading={updateOrder.isPending}
        onClose={() => setEditOpen(false)}
        onSubmit={(description, due_at, price) => updateOrder.mutate({ description, due_at, ...(price ? { price } : {}) }, { onSuccess: () => setEditOpen(false) })}
      />
    </div>
  );
}
