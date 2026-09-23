import { Button } from '@maxhub/max-ui';
import { useState } from 'react';

import { Dialog } from './Dialog';

type PaymentDialogProps = {
  open: boolean;
  loading: boolean;
  balance: number;
  onClose: () => void;
  onSubmit: (amount: string, comment: string) => void;
};

export function PaymentDialog({ open, loading, balance, onClose, onSubmit }: PaymentDialogProps) {
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : '');
  const [comment, setComment] = useState('');
  const valid = Number(amount) > 0;
  return (
    <Dialog open={open} title="Зафиксировать оплату" description="Запись появится в истории заказа" onClose={onClose}>
      <form className="dialog-form" onSubmit={(event) => { event.preventDefault(); if (valid) onSubmit(amount, comment); }}>
        <label><span>Сумма</span><span className="money-input"><input value={amount} inputMode="decimal" aria-label="Сумма оплаты" onChange={(event) => setAmount(event.target.value.replace(',', '.'))} /><span>₽</span></span></label>
        <label><span>Комментарий</span><input className="plain-input" value={comment} placeholder="Например, предоплата" onChange={(event) => setComment(event.target.value)} /></label>
        <Button type="submit" size="medium" stretched disabled={!valid} loading={loading}>Сохранить оплату</Button>
      </form>
    </Dialog>
  );
}
