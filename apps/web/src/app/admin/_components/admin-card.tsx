import { cn } from '@ecommerce/ui';

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  /** Optional title rendered inside the card header */
  title?: string;
  /** Optional right-aligned header slot */
  headerAction?: React.ReactNode;
  /** Remove default padding */
  noPadding?: boolean;
}

export function AdminCard({ children, className, title, headerAction, noPadding }: AdminCardProps) {
  return (
    <div className={cn('admin-card', className)}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/[0.06]">
          {title && <p className="admin-section-title">{title}</p>}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {noPadding ? children : <div className="p-6">{children}</div>}
    </div>
  );
}
