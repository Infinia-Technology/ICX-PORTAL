import { Link, Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex flex-col items-start gap-0.5">
            <img src="/logo.svg" alt="Infinia" className="h-6 w-auto" />
            <span className="text-[11px] font-medium tracking-wide text-[var(--color-text-secondary)] leading-none">Compute Exchange</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              &copy; {new Date().getFullYear()} Infinia Compute Exchange. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Terms</Link>
              <Link to="/privacy" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
