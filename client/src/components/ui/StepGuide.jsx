import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

/**
 * StepGuide — contextual guidance banner shown at the top of each form step.
 * Includes a title, description, and collapsible tips.
 */
export default function StepGuide({ title, description, tips = [], color = 'blue' }) {
  const [open, setOpen] = useState(false);

  const palette = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',  title: 'text-blue-900',  text: 'text-blue-700',  icon: 'text-blue-500',  tip: 'text-blue-600',  dot: 'bg-blue-400',  btn: 'text-blue-500 hover:text-blue-700' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', title: 'text-indigo-900', text: 'text-indigo-700', icon: 'text-indigo-500', tip: 'text-indigo-600', dot: 'bg-indigo-400', btn: 'text-indigo-500 hover:text-indigo-700' },
    teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',  title: 'text-teal-900',  text: 'text-teal-700',  icon: 'text-teal-500',  tip: 'text-teal-600',  dot: 'bg-teal-400',  btn: 'text-teal-500 hover:text-teal-700' },
  };
  const c = palette[color] || palette.blue;

  return (
    <div className={`${c.bg} border ${c.border} rounded-[var(--radius-md)] p-4 mb-5`}>
      <div className="flex items-start gap-3">
        <Lightbulb className={`w-4 h-4 mt-0.5 shrink-0 ${c.icon}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${c.title} mb-0.5`}>{title}</p>
          <p className={`text-xs leading-relaxed ${c.text}`}>{description}</p>

          {tips.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={`mt-2 flex items-center gap-1 text-xs font-medium ${c.btn} transition-colors`}
              >
                {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {open ? 'Hide tips' : `${tips.length} tip${tips.length > 1 ? 's' : ''} for this step`}
              </button>

              {open && (
                <ul className="mt-2 space-y-1.5">
                  {tips.map((tip, i) => (
                    <li key={i} className={`flex items-start gap-2 text-xs ${c.tip}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1 shrink-0`} />
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
