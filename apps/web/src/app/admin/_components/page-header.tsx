interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4 pb-6 border-b border-notion-border">
      <div>
        <h1 className="text-2xl font-bold text-notion-text leading-tight tracking-tight">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-notion-textSecondary">{description}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
