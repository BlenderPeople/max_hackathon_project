import { CircleAlert, Inbox, LoaderCircle, LockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';

type PageStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'loading' | 'empty' | 'error' | 'unauthorized';
};

const icons = {
  loading: LoaderCircle,
  empty: Inbox,
  error: CircleAlert,
  unauthorized: LockKeyhole,
};

export function PageState({ title, description, action, variant = 'empty' }: PageStateProps) {
  const Icon = icons[variant];
  return (
    <section className={`page-state page-state-${variant}`} aria-live="polite" aria-busy={variant === 'loading'}>
      <span className="page-state-icon" aria-hidden="true"><Icon size={25} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="page-state-action">{action}</div>}
    </section>
  );
}
