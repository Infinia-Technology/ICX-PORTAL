import { useState, useRef, useEffect, useCallback } from 'react';
import Button from '../ui/Button';
import { useApi } from '../../hooks/useApi';

const INITIAL_COOLDOWN = 60;

export default function OtpVerifyForm({ email, onVerified, onBack }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [cooldown, setCooldown] = useState(INITIAL_COOLDOWN);
  const { loading, post } = useApi();
  const [resending, setResending] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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
      const data = await post('/auth/otp/verify', { email, code: fullCode, rememberMe });
      if (rememberMe) {
        localStorage.setItem('icx_remember_me', 'true');
      }
      onVerified(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed';
      setError(msg);
    }
  };

  const handleResend = useCallback(async () => {
    setResending(true);
    setError('');
    setResendMsg('');

    try {
      const data = await post('/auth/otp/resend', { email });
      setCooldown(data.cooldown || INITIAL_COOLDOWN);
      setResendMsg('New code sent to your email');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.retryAfter) {
        setCooldown(resp.retryAfter);
        setError(`Please wait ${resp.retryAfter}s before resending`);
      } else {
        setError(resp?.error || 'Failed to resend code');
      }
    } finally {
      setResending(false);
    }
  }, [email, post]);

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
      {resendMsg && <p className="text-sm text-green-600 text-center">{resendMsg}</p>}

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 rounded border-[var(--color-border)]"
        />
        <span className="text-sm text-[var(--color-text-secondary)]">Remember me on this device</span>
      </label>

      <Button type="submit" loading={loading} className="w-full">
        Verify Code
      </Button>

      <div className="text-center">
        {cooldown > 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Resend code in <span className="font-semibold">{cooldown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-medium text-[var(--color-primary)] hover:underline disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        )}
      </div>

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
