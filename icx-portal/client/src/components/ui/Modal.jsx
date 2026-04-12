import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`
          relative bg-[var(--color-surface)] rounded-[var(--radius-lg)]
          shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto
          ${className}
        `}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-[var(--radius-md)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
