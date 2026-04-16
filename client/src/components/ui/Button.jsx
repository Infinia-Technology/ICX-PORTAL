import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] h-11',
  secondary: 'bg-white text-[var(--color-primary)] border border-[var(--color-border)] hover:bg-gray-50 h-10',
  tertiary: 'bg-transparent text-[var(--color-primary)] hover:bg-gray-100 h-9',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-gray-100 hover:text-[var(--color-text)] h-9',
  danger: 'bg-[var(--color-error)] text-white hover:bg-red-700 h-11',
};

const sizes = {
  sm: 'px-3 text-xs',
  md: 'px-5',
  lg: 'px-6 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        rounded-[var(--radius-md)] transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || (size ? '' : 'px-5')}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
