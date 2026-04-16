export default function TextArea({
  label,
  error,
  required = false,
  maxLength,
  value = '',
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
      <textarea
        className={`
          px-3 py-2 rounded-[var(--radius-md)] border text-sm
          bg-white resize-y min-h-[80px] outline-none transition-colors
          ${error
            ? 'border-[var(--color-error)] focus:ring-2 focus:ring-red-100'
            : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100'
          }
        `}
        value={value}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex justify-between">
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        {maxLength && (
          <p className="text-xs text-[var(--color-text-muted)] ml-auto">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
