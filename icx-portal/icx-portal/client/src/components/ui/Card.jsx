export default function Card({
  children,
  elevated = false,
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-6
        ${elevated
          ? 'shadow-md hover:shadow-lg transition-shadow'
          : 'border border-[var(--color-border)]'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
