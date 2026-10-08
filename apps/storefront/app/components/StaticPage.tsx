import type { ReactNode } from 'react';
import { PageShell } from './PageShell';
import { Breadcrumb } from './Breadcrumb';

export function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageShell>
      <Breadcrumb current={title} />
      <div className="flex justify-center px-6 pb-24">
        <div className="w-full max-w-[820px] flex flex-col gap-6">
          <h1 className="font-heading text-4xl font-bold text-[#2f2f2f]">{title}</h1>
          <div className="flex flex-col gap-4 text-sm leading-relaxed text-[#373737]">{children}</div>
        </div>
      </div>
    </PageShell>
  );
}
