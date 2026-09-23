import { Button } from '@maxhub/max-ui';

import type { Approval } from '../api/contracts';
import { formatMoney } from '../lib/format';
import { Dialog } from './Dialog';

type ApprovalDialogProps = {
  approval: Approval;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onDecision: (approved: boolean) => void;
};

export function ApprovalDialog({ approval, open, loading, onClose, onDecision }: ApprovalDialogProps) {
  return (
    <Dialog open={open} title={approval.title} description="Проверьте условия перед подтверждением" onClose={onClose}>
      <div className="approval-summary">
        <p>{approval.description}</p>
        {approval.amount && <strong>{formatMoney(approval.amount)}</strong>}
      </div>
      <div className="dialog-actions">
        <Button variant="secondary" size="medium" stretched disabled={loading} onClick={() => onDecision(false)}>Отклонить</Button>
        <Button variant="primary" size="medium" stretched loading={loading} onClick={() => onDecision(true)}>Подтвердить</Button>
      </div>
    </Dialog>
  );
}
