import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

export default function InfoIcon({ text, placement = 'top', className = '' }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const placements = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {showTooltip && (
        <div
          className={`absolute z-50 ${placements[placement]} bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none`}
        >
          {text}
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${
              placement === 'top' ? 'top-full border-t-gray-900' :
              placement === 'bottom' ? 'bottom-full border-b-gray-900' :
              placement === 'left' ? 'left-full border-l-gray-900' :
              'right-full border-r-gray-900'
            }`}
          />
        </div>
      )}
    </div>
  );
}
