import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';

const config = {
  idle: { icon: Cloud, text: '', color: 'text-gray-300' },
  saving: { icon: Loader2, text: 'Saving...', color: 'text-blue-500', spin: true },
  saved: { icon: Check, text: 'Saved', color: 'text-green-500' },
  error: { icon: CloudOff, text: 'Save failed', color: 'text-red-500' },
};

export default function AutoSaveIndicator({ status }) {
  const { icon: Icon, text, color, spin } = config[status] || config.idle;
  if (status === 'idle') return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${color}`}>
      <Icon className={`w-3.5 h-3.5 ${spin ? 'animate-spin' : ''}`} />
      {text}
    </div>
  );
}
