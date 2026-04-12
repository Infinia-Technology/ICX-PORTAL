import { Check } from 'lucide-react';

export default function Stepper({ steps = [], currentStep = 0, className = '' }) {
  return (
    <nav className={`flex items-center gap-2 overflow-x-auto pb-2 ${className}`}>
      {steps.map((step, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
                ${isComplete
                  ? 'bg-[var(--color-success)] text-white'
                  : isCurrent
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {isComplete ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                isCurrent ? 'font-medium text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${isComplete ? 'bg-[var(--color-success)]' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
