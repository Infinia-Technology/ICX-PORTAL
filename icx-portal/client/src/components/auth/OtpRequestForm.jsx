import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useApi } from '../../hooks/useApi';
import { isValidEmail } from '../../lib/validators';

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
      setError(err.response?.data?.error || 'Failed to send OTP');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email Address"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        required
        autoFocus
      />
      <Button type="submit" loading={loading} className="w-full">
        Send Verification Code
      </Button>
    </form>
  );
}
