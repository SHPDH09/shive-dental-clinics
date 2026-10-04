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
    <div className="mx-auto max-w-[1600px] space-y-6 animate-fade-up">
      <div className="admin-page-card flex flex-wrap items-end justify-between gap-4 px-5 py-5 md:px-6 md:py-6">
        <div>
          <h1 className="admin-page-title text-2xl font-bold md:text-3xl">{title}</h1>
          {description && <p className="admin-help-text mt-2 max-w-2xl">{description}</p>}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
