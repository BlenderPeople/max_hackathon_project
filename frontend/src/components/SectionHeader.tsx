import type { ReactNode } from 'react';

export function SectionHeader({ title, trailing }: { title: string; trailing?: ReactNode }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {trailing}
    </div>
  );
}
