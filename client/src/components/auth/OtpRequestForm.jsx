import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useApi } from '../../hooks/useApi';
import { isValidEmail } from '../../lib/validators';

const ERROR_MESSAGES = {
  'Too many OTP requests': 'Too many attempts. Please try again in 15 minutes.',
  'Email delivery failed': 'Could not send email. Please try again or use a different email address.',
};

function mapError(msg) {
  for (const [key, mapped] of Object.entries(ERROR_MESSAGES)) {
    if (msg?.includes(key)) return mapped;
  }
  return msg || 'Failed to send verification code. Please try again.';
}

export default function OtpRequestForm({ onOtpSent }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { loading, post } = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await post('/auth/otp/request', { email });
      onOtpSent(email);
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      setError(mapError(serverMsg));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email Address"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError(''); }}
        error={error}
        required
        autoFocus
      />
      <Button type="submit" loading={loading} className="w-full">
        {loading ? 'Sending...' : 'Send Verification Code'}
      </Button>
    </form>
  );
}
