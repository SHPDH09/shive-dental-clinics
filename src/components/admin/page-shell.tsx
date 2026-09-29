export function AdminPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
