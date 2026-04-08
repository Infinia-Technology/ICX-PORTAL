import { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import { useApi } from '../../hooks/useApi';

export default function OtpVerifyForm({ email, onVerified, onBack }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const { loading, post } = useApi();
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    try {
      const data = await post('/auth/otp/verify', { email, code: fullCode });
      onVerified(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Enter the 6-digit code sent to <strong>{email}</strong>
      </p>

      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`
              w-12 h-14 text-center text-xl font-semibold
              rounded-[var(--radius-md)] border outline-none transition-colors
              ${error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'}
            `}
          />
        ))}
      </div>

      {error && <p className="text-sm text-[var(--color-error)] text-center">{error}</p>}

      <Button type="submit" loading={loading} className="w-full">
        Verify Code
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-center"
      >
        Use a different email
      </button>
    </form>
  );
}
