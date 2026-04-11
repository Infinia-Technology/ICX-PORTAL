import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function ErrorPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--color-error)]">500</h1>
        <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
          Something went wrong
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          An unexpected error occurred. Please try again later.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
