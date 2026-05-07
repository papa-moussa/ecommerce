interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4 pb-6 border-b border-brand-ink/[0.06]">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-ink leading-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-brand-ink/40 font-medium">{description}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
