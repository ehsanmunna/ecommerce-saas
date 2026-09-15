import Link from 'next/link';

export function Breadcrumb({ current }: { current: string }) {
  return (
    <div className="flex justify-center px-6 pb-3">
      <div className="w-full max-w-[1592px] flex items-center gap-2 text-sm font-medium text-text-muted">
        <Link href="/" className="hover:text-link-hover">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#252b42] font-bold">{current}</span>
      </div>
    </div>
  );
}
