export default function Input({
  label,
  error,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
      )}
      <input
        className={`
          h-10 px-3 rounded-[var(--radius-md)] border text-sm
          bg-white transition-colors outline-none
          ${error
            ? 'border-[var(--color-error)] focus:ring-2 focus:ring-red-100'
            : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100'
          }
        `}
        {...props}
      />
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
