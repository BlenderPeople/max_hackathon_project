import { Button, Textarea } from '@maxhub/max-ui';
import { useEffect, useState } from 'react';

import { Dialog } from './Dialog';

type EditOrderDialogProps = {
  open: boolean;
  description: string;
  dueAt: string | null;
  price: string | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (description: string, dueAt: string | null, price: string | null) => void;
};

export function EditOrderDialog({ open, description: initialDescription, dueAt: initialDueAt, price: initialPrice, loading, onClose, onSubmit }: EditOrderDialogProps) {
  const [description, setDescription] = useState(initialDescription);
  const [dueAt, setDueAt] = useState(initialDueAt?.slice(0, 10) ?? '');
  const [price, setPrice] = useState(initialPrice ?? '');
  useEffect(() => {
    if (open) {
      setDescription(initialDescription);
      setDueAt(initialDueAt?.slice(0, 10) ?? '');
      setPrice(initialPrice ?? '');
    }
  }, [initialDescription, initialDueAt, initialPrice, open]);
  return (
    <Dialog open={open} title="Детали заказа" description="Изменения сохранятся в истории" onClose={onClose}>
      <form className="dialog-form" onSubmit={(event) => {
        event.preventDefault();
        onSubmit(description.trim(), dueAt ? new Date(`${dueAt}T18:00:00+07:00`).toISOString() : null, price !== '' && price !== null ? String(price).replace(',', '.') : null);
      }}>
        <label><span>Описание</span><Textarea value={description} rows={4}  onChange={(event) => setDescription(event.target.value)} /></label>
        <label><span>Итоговая цена, ₽</span><input className="plain-input" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value.replace(',', '.'))} /></label>
        <label><span>Желаемый срок</span><input className="plain-input" type="date" min={new Date().toLocaleDateString('en-CA')} value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
        <Button type="submit" size="medium" stretched loading={loading} disabled={(price !== '' && (!Number.isFinite(Number(price)) || Number(price) < 0))}>Сохранить</Button>
      </form>
    </Dialog>
  );
}
