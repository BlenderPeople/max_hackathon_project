import { Button, Textarea } from '@maxhub/max-ui';
import { useEffect, useState } from 'react';

import { Dialog } from './Dialog';

type EditOrderDialogProps = {
  open: boolean;
  description: string;
  dueAt: string | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (description: string, dueAt: string | null) => void;
};

export function EditOrderDialog({ open, description: initialDescription, dueAt: initialDueAt, loading, onClose, onSubmit }: EditOrderDialogProps) {
  const [description, setDescription] = useState(initialDescription);
  const [dueAt, setDueAt] = useState(initialDueAt?.slice(0, 10) ?? '');
  useEffect(() => {
    if (open) {
      setDescription(initialDescription);
      setDueAt(initialDueAt?.slice(0, 10) ?? '');
    }
  }, [initialDescription, initialDueAt, open]);
  return (
    <Dialog open={open} title="Детали заказа" description="Изменения сохранятся в истории" onClose={onClose}>
      <form className="dialog-form" onSubmit={(event) => {
        event.preventDefault();
        onSubmit(description.trim(), dueAt ? new Date(`${dueAt}T18:00:00+07:00`).toISOString() : null);
      }}>
        <label><span>Описание</span><Textarea value={description} rows={4} maxLength={500} onChange={(event) => setDescription(event.target.value)} /></label>
        <label><span>Желаемый срок</span><input className="plain-input" type="date" min="2026-09-22" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
        <Button type="submit" size="medium" stretched loading={loading} disabled={description.trim().length < 12}>Сохранить</Button>
      </form>
    </Dialog>
  );
}
