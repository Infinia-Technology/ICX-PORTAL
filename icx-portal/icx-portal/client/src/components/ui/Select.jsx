import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  error,
  required = false,
  placeholder = 'Select...',
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
      <div className="relative">
        <select
          className={`
            w-full h-10 px-3 pr-8 rounded-[var(--radius-md)] border text-sm
            bg-white appearance-none outline-none transition-colors
            ${error
              ? 'border-[var(--color-error)] focus:ring-2 focus:ring-red-100'
              : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100'
            }
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? opt : opt.label;
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
      </div>
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
