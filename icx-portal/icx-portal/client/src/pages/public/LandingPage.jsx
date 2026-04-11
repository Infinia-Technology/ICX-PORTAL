import { Link } from 'react-router-dom';
import { Building2, Server, Shield, ArrowRight, Globe, Zap, Lock, Users, BarChart3, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative py-24 sm:py-36 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 opacity-60" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-green-50 to-emerald-100 opacity-40" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[var(--color-primary)] text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            Global Infrastructure Exchange
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight">
            <span className="text-[var(--color-text)]">The Private Marketplace for</span>
            <br />
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-indigo-500 bg-clip-text text-transparent">
              Data Center & GPU Infrastructure
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
            ICX connects verified infrastructure providers with enterprise buyers.
            List capacity, discover supply, and match demand — all in one secure, admin-verified platform.
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

          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            No credit card required. Get started in under 2 minutes.
          </p>
        </div>
      </section>

      {/* Trusted strip */}
      <section className="py-6 border-y border-[var(--color-border)] bg-gray-50/50">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-8 text-sm text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> End-to-End Encrypted</span>
          <span className="hidden sm:flex items-center gap-1.5"><Shield className="w-4 h-4" /> Admin-Verified Suppliers</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> OTP Authentication</span>
          <span className="hidden sm:flex items-center gap-1.5"><Users className="w-4 h-4" /> Role-Based Access</span>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-14 max-w-2xl mx-auto">
            Whether you're listing infrastructure or looking for capacity, ICX makes it simple.
          </p>

          <div className="grid sm:grid-cols-2 gap-10">
            {/* Supplier Path */}
            <div className="rounded-2xl border border-[var(--color-border)] p-8 bg-[var(--color-surface)] hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-xl font-bold mb-1">I Have Infrastructure</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-5">For DC operators, GPU providers & brokers</p>
              <ol className="space-y-3">
                {[
                  'Register & complete KYC verification',
                  'List your DC sites or GPU clusters with 100+ specs',
                  'Admin reviews & approves your listings',
                  'Get matched with qualified enterprise buyers',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-[var(--color-text-secondary)]">{step}</span>
                  </li>
                ))}
              </ol>
              <Link to="/register/supplier" className="inline-block mt-6">
                <Button>Get Started <ArrowRight className="w-4 h-4" /></Button>
              </Link>
            </div>

            {/* Customer Path */}
            <div className="rounded-2xl border border-[var(--color-border)] p-8 bg-[var(--color-surface)] hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-1">I Want Infrastructure</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-5">For enterprises, cloud providers & MSPs</p>
              <ol className="space-y-3">
                {[
                  'Register & verify your organization',
                  'Browse verified DC and GPU listings',
                  'Submit capacity requests with your requirements',
                  'Admin matches you with the right suppliers',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-[var(--color-text-secondary)]">{step}</span>
                  </li>
                ))}
              </ol>
              <Link to="/register/customer" className="inline-block mt-6">
                <Button variant="secondary">Get Started <ArrowRight className="w-4 h-4" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Platform Capabilities</h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-14 max-w-2xl mx-auto">
            Enterprise-grade infrastructure marketplace with comprehensive tooling.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: 'Data Center Listings', desc: '119+ detailed specifications per DC site including power, connectivity, cooling, and commercial terms.', color: 'text-blue-600 bg-blue-50' },
              { icon: Server, title: 'GPU Compute Listings', desc: 'Full GPU cluster inventory — compute nodes, network topology, storage, and facility specs.', color: 'text-green-600 bg-green-50' },
              { icon: Shield, title: 'Admin-Verified', desc: 'Every supplier and listing goes through KYC review and field-level admin approval.', color: 'text-purple-600 bg-purple-50' },
              { icon: Zap, title: 'Demand Matching', desc: 'Customers submit GPU and DC requirements. Admins match demand to verified supply.', color: 'text-orange-600 bg-orange-50' },
              { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time KPIs, queue metrics, and portfolio insights for admin and executive roles.', color: 'text-indigo-600 bg-indigo-50' },
              { icon: Lock, title: 'Secure by Design', desc: 'OTP authentication, role-based access, field-level permissions, and encrypted storage.', color: 'text-red-600 bg-red-50' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-[var(--color-border)] p-6 bg-white hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { label: 'DC Fields Tracked', value: '119+' },
              { label: 'GPU Specs Captured', value: '49+' },
              { label: 'User Roles', value: '8' },
              { label: 'Authentication', value: 'OTP' },
            ].map((s) => (
              <div key={s.label} className="py-4">
                <p className="text-4xl font-extrabold bg-gradient-to-r from-[var(--color-primary)] to-indigo-500 bg-clip-text text-transparent">{s.value}</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">{s.label}</p>
              </div>
            ))}
          </div>
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
              <Button className="bg-white text-[var(--color-primary)] hover:bg-gray-100 h-12 px-8 text-base">
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
          <p className="font-semibold text-[var(--color-text)]">ICX Portal</p>
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
