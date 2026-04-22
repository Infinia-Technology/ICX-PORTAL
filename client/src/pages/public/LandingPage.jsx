import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Shield, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative py-24 sm:py-36 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 opacity-60" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-green-50 to-emerald-100 opacity-40" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight">
            <span className="text-[var(--color-text)]">Infrastructure Capacity Registry</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
            Submit available capacity or sourcing requirements. Our team handles the rest.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register/supplier">
              <Button className="h-12 px-8 text-base">
                I Have Infrastructure <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/register/customer">
              <Button variant="secondary" className="h-12 px-8 text-base">
                I Want Infrastructure <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-6 border-y border-[var(--color-border)] bg-gray-50/50">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-8 text-sm text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> End-to-End Encrypted</span>
          <span className="hidden sm:flex items-center gap-1.5"><Shield className="w-4 h-4" /> Admin-Verified Suppliers</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> OTP Authentication</span>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[var(--color-primary)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join the verified infrastructure exchange. List your capacity or find the right supply.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register/supplier">
              <Button className="!bg-transparent border-2 border-white !text-white hover:!bg-white/10 h-12 px-8 text-base">
                I Have Infrastructure
              </Button>
            </Link>
            <Link to="/register/customer">
              <Button className="bg-transparent border-2 border-white text-white hover:bg-white/10 h-12 px-8 text-base">
                I Want Infrastructure
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <div className="flex flex-col items-start gap-0.5">
            <img src="/logo.svg" alt="Infinia" className="h-5 w-auto" />
            <span className="text-[11px] font-medium tracking-wide text-[var(--color-text-secondary)] leading-none">Compute Exchange</span>
          </div>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-[var(--color-text)]">Terms</Link>
            <Link to="/privacy" className="hover:text-[var(--color-text)]">Privacy</Link>
            <Link to="/login" className="hover:text-[var(--color-text)]">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
