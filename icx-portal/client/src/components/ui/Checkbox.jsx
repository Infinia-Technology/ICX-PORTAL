export default function Checkbox({
  label,
  options = [],
  value = [],
  onChange,
  error,
  required = false,
  className = '',
  // Single boolean checkbox props
  name,
  checked,
}) {
  // Single boolean checkbox mode (no options)
  if (options.length === 0) {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name={name}
            checked={!!checked}
            onChange={onChange}
            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <span className="font-medium text-[var(--color-text)]">
            {label}
            {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
          </span>
        </label>
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }

  // Multi-select checkbox group mode
  const handleToggle = (opt) => {
    const next = value.includes(opt)
      ? value.filter((v) => v !== opt)
      : [...value, opt];
    onChange(next);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <label key={opt} className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(opt)}
              onChange={() => handleToggle(opt)}
              className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            {opt}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
