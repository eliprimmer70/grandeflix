interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className = "" }: EmptyStateProps) {
  return (
    <div className={`py-16 text-center ${className}`}>
      <p className="text-sm text-white/40">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-xs text-xs text-white/25">{description}</p>
      )}
    </div>
  );
}
