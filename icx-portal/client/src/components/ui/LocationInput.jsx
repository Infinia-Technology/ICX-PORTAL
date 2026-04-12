import { ExternalLink } from 'lucide-react';

/**
 * Reusable LocationInput component — accepts a Google Maps URL.
 *
 * Props:
 *   label, error, required, className — same as Input
 *   value    — the URL string
 *   onChange — standard onChange handler
 *   name     — field name
 */
export default function LocationInput({
  label,
  error,
  required = false,
  className = '',
  value = '',
  onChange,
  name,
  placeholder = 'https://maps.google.com/...',
  ...props
}) {
  const isValidUrl = value && /^https?:\/\/.+/i.test(value);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
      )}
      <div className="flex gap-0">
        <input
          type="url"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            flex-1 h-10 px-3 text-sm bg-white transition-colors outline-none min-w-0
            ${isValidUrl ? 'rounded-l-[var(--radius-md)]' : 'rounded-[var(--radius-md)]'}
            border
            ${error
              ? 'border-[var(--color-error)] focus:ring-2 focus:ring-red-100'
              : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100'
            }
          `}
          {...props}
        />
        {isValidUrl && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center gap-1.5 h-10 px-3
              rounded-r-[var(--radius-md)] border border-l-0
              border-[var(--color-border)] bg-gray-50
              text-sm text-[var(--color-primary)] hover:bg-gray-100
              transition-colors whitespace-nowrap
            "
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Map
          </a>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

/**
 * Display-only component for showing a location link (used in detail/review pages).
 */
export function LocationLink({ value, className = '' }) {
  if (!value) return <span className="text-gray-400">—</span>;

  const isUrl = /^https?:\/\/.+/i.test(value);
  if (!isUrl) return <span className={className}>{value}</span>;

  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline ${className}`}
    >
      <ExternalLink className="w-3.5 h-3.5" />
      Open in Google Maps
    </a>
  );
}
