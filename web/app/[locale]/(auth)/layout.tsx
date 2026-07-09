import type { Metadata } from 'next'
import { Store, Leaf, Zap, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: { default: 'Account', template: '%s | Angadi Online' },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      {/* Left hero panel */}
      <div className="auth-hero">
        <div className="auth-hero-inner">
          <div className="auth-hero-logo">
            <Store size={56} strokeWidth={1.5} />
          </div>
          <h1 className="auth-hero-title">Angadi Online</h1>
          <p className="auth-hero-subtitle">
            Your community&apos;s local marketplace — fresh items, trusted shops, fast delivery.
          </p>
          <ul className="auth-features">
            {[
              { icon: Store,  text: 'Browse local shops near you' },
              { icon: Leaf,   text: 'Order fresh farm produce daily' },
              { icon: Zap,    text: 'Fast delivery to your doorstep' },
              { icon: MapPin, text: 'Real-time order tracking' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="auth-feature-item">
                <span className="auth-feature-icon"><Icon size={18} /></span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner fade-up">
          {children}
        </div>
      </div>

      <style>{`
        .auth-shell {
          min-height: 100dvh;
          display: flex;
        }

        /* ── Left Hero ─────────────────────────────── */
        .auth-hero {
          flex: 1;
          background: var(--wa-teal);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.5rem;
          position: relative;
          overflow: hidden;
        }
        .auth-hero-inner {
          position: relative;
          z-index: 2;
          color: #fff;
          max-width: 400px;
        }
        .auth-hero-logo {
          font-size: 3.5rem;
          margin-bottom: 1rem;
          filter: drop-shadow(0 4px 16px rgba(0,0,0,.25));
          animation: floatLogo 3s ease-in-out infinite;
        }
        @keyframes floatLogo {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .auth-hero-title {
          font-size: 2.4rem; font-weight: 800;
          line-height: 1.1; margin-bottom: .75rem;
          letter-spacing: -.03em;
        }
        .auth-hero-subtitle {
          font-size: .97rem; opacity: .82;
          line-height: 1.65; margin-bottom: 2.25rem;
        }
        .auth-features { list-style: none; display: flex; flex-direction: column; gap: 1rem; }
        .auth-feature-item {
          display: flex; align-items: center; gap: .85rem;
          font-size: .93rem; opacity: .9;
        }
        .auth-feature-icon {
          font-size: 1.2rem; width: 2.25rem;
          height: 2.25rem; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.15);
          border-radius: 50%;
        }

        /* Blobs */
        .auth-blob {
          position: absolute; border-radius: 50%; opacity: .1; z-index: 1;
        }
        .auth-blob-1 { width: 360px; height: 360px; background: var(--wa-green); top: -100px; right: -100px; }
        .auth-blob-2 { width: 240px; height: 240px; background: #fff; bottom: -70px; left: 5%; }
        .auth-blob-3 { width: 160px; height: 160px; background: var(--wa-green); top: 40%; left: -60px; }

        /* ── Right Form Panel ──────────────────────── */
        .auth-form-panel {
          width: 480px; flex-shrink: 0;
          background: var(--wa-bg);
          display: flex; align-items: center; justify-content: center;
          padding: 2.5rem 2rem;
          overflow-y: auto;
        }
        .auth-form-inner { width: 100%; max-width: 400px; }

        /* ── Auth page shared ──────────────────────── */
        .auth-page-header { margin-bottom: 2rem; }
        .auth-page-title {
          font-size: 1.7rem; font-weight: 800;
          color: var(--wa-teal); line-height: 1.2;
          margin-bottom: .4rem; letter-spacing: -.02em;
        }
        .auth-page-sub { font-size: .88rem; color: var(--text-muted); }

        .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }

        .input-icon-wrap { position: relative; display: flex; align-items: center; }
        .input-icon {
          position: absolute; left: .9rem; font-size: .95rem;
          pointer-events: none; z-index: 1;
        }
        .input-with-icon { padding-left: 2.6rem !important; }
        .input-eye {
          position: absolute; right: .75rem;
          background: none; border: none; cursor: pointer;
          font-size: .9rem; line-height: 1; padding: .25rem;
          color: var(--text-muted);
        }
        .input-eye:hover { color: var(--text-base); }

        .pw-strength { display: flex; align-items: center; gap: .5rem; margin-top: .4rem; }
        .pw-bar-row  { display: flex; gap: .25rem; flex: 1; }
        .pw-bar      { height: 4px; flex: 1; border-radius: 99px; transition: background .2s; }
        .pw-label    { font-size: .72rem; font-weight: 700; white-space: nowrap; }

        .field-error { font-size: .8rem; color: var(--danger); margin-top: .25rem; font-weight: 500; }

        .auth-alert {
          padding: .75rem 1rem;
          border-radius: var(--radius-md);
          font-size: .875rem; font-weight: 500; line-height: 1.5;
        }
        .auth-alert-error   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .auth-alert-info    { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }
        .auth-alert-success { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }

        .auth-submit-btn {
          margin-top: .25rem;
          background: var(--wa-green-dark);
          padding: .85rem; font-size: 1rem;
          border-radius: var(--radius-md);
          color: #fff; font-weight: 700;
          transition: background .15s ease, transform .15s ease, box-shadow .15s ease;
          letter-spacing: .01em;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: var(--wa-teal);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(7,94,84,.3);
        }

        .auth-footer-text {
          margin-top: 1.5rem; text-align: center;
          font-size: .875rem; color: var(--text-muted);
        }
        .auth-link {
          color: var(--wa-green-dark); font-weight: 700;
          text-decoration: underline; text-underline-offset: 2px;
        }
        .auth-link:hover { color: var(--wa-teal); }
        .auth-link-btn {
          background: none; border: none; padding: 0;
          color: var(--wa-green-dark); font-weight: 700;
          text-decoration: underline; cursor: pointer; font-size: inherit;
        }



        /* ── Mobile ───────────────────────────────── */
        @media (max-width: 768px) {
          .auth-shell { flex-direction: column; }
          .auth-hero { padding: 2rem 1.5rem; min-height: 0; }
          .auth-hero-title { font-size: 1.75rem; }
          .auth-hero-subtitle { display: none; }
          .auth-features { display: none; }
          .auth-blob-1 { width: 200px; height: 200px; }
          .auth-blob-2 { width: 130px; height: 130px; }
          .auth-form-panel { width: 100%; padding: 2rem 1.25rem 3rem; }
        }
      `}</style>
    </div>
  )
}
