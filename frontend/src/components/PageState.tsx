import type { ReactNode } from 'react';

type PageStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

/** Shared, intentionally unstyled baseline for loading/empty/error views. */
export function PageState({ title, description, action }: PageStateProps) {
  return (
    <section className="page-state" aria-live="polite">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
