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
        <div className="flex items-center justify-between px-5 py-3 border-b border-notion-border">
          {title && <p className="admin-section-title !mb-0 text-sm">{title}</p>}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {noPadding ? children : <div className="p-5">{children}</div>}
    </div>
  );
}
