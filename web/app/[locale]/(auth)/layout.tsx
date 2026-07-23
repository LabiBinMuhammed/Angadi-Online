import type { Metadata } from 'next'
import { Store, Leaf, Zap, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: { default: 'Account', template: '%s | Angadi Online' },
}

export default async function AuthLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  
  let messages: any = {}
  try {
    messages = require(`../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../messages/en.json')
  }

  const t = (key: string): string => {
    const parts = key.split('.')
    let current = messages
    for (const part of parts) {
      if (current == null) return key
      current = current[part]
    }
    return typeof current === 'string' ? current : key
  }

  return (
    <div className="auth-shell">
      {/* Left hero panel */}
      <div className="auth-hero">
        <div className="auth-hero-inner">
          <div className="auth-hero-logo">
            <Store size={36} strokeWidth={1.5} color="#fff" />
          </div>
          <h1 className="auth-hero-title">{t('auth_layout.hero_title')}</h1>
          <p className="auth-hero-subtitle">
            {t('auth_layout.hero_subtitle')}
          </p>
          <ul className="auth-features">
            {[
              { icon: Store,  text: t('auth_layout.bullet_1') },
              { icon: Leaf,   text: t('auth_layout.bullet_2') },
              { icon: Zap,    text: t('auth_layout.bullet_3') },
              { icon: MapPin, text: t('auth_layout.bullet_4') },
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
          background: radial-gradient(circle at top left, #0d7f72, #075e54, #033630);
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
          max-width: 440px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2.5rem;
          border-radius: 28px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        .auth-hero-logo {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #25d366, #128c7e);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 30px rgba(37,211,102,0.3);
          animation: floatLogo 4s ease-in-out infinite;
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .auth-hero-title {
          font-size: 2.4rem; font-weight: 800;
          line-height: 1.1; margin-bottom: .75rem;
          letter-spacing: -.03em;
        }
        .auth-hero-subtitle {
          font-size: .97rem; opacity: 0.85;
          line-height: 1.65; margin-bottom: 2.25rem;
        }
        .auth-features { list-style: none; display: flex; flex-direction: column; gap: 1rem; }
        .auth-feature-item {
          display: flex; align-items: center; gap: .85rem;
          font-size: .93rem; opacity: 0.95;
        }
        .auth-feature-icon {
          width: 2.25rem;
          height: 2.25rem; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.12);
          border-radius: 50%;
        }

        /* Blobs */
        .auth-blob {
          position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.25; z-index: 1;
          animation: floatBlob 10s ease-in-out infinite;
        }
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.1); }
        }
        .auth-blob-1 { width: 400px; height: 400px; background: #25d366; top: -100px; right: -50px; }
        .auth-blob-2 { width: 350px; height: 350px; background: #34d399; bottom: -100px; left: -50px; animation-delay: 2s; }
        .auth-blob-3 { width: 250px; height: 250px; background: #059669; top: 30%; left: -80px; animation-delay: 4s; }

        /* ── Right Form Panel ──────────────────────── */
        .auth-form-panel {
          width: 520px; flex-shrink: 0;
          background: #f8fafc;
          display: flex; align-items: center; justify-content: center;
          padding: 3rem 2.5rem;
          overflow-y: auto;
          border-left: 1px solid #e2e8f0;
        }
        [data-theme="dark"] .auth-form-panel {
          background: #0f172a;
          border-left: 1px solid #1e293b;
        }
        .auth-form-inner {
          width: 100%; max-width: 400px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 2.5rem 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }
        [data-theme="dark"] .auth-form-inner {
          background: #1e293b;
          border-color: #334155;
          box-shadow: 0 10px 35px rgba(0,0,0,0.2);
        }

        /* ── Auth page shared ──────────────────────── */
        .auth-page-header { margin-bottom: 2rem; }
        .auth-page-title {
          font-size: 1.7rem; font-weight: 800;
          color: var(--wa-green-dark); line-height: 1.2;
          margin-bottom: .4rem; letter-spacing: -.02em;
        }
        .auth-page-sub { font-size: .88rem; color: var(--text-muted); }

        .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-base);
        }
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s ease;
          color: var(--text-base);
        }
        [data-theme="dark"] .form-input {
          background: #0f172a;
          border-color: #334155;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--wa-green-dark);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(18,140,126,0.12);
        }
        [data-theme="dark"] .form-input:focus {
          background: #0f172a;
        }

        .input-icon-wrap { position: relative; display: flex; align-items: center; }
        .input-icon {
          position: absolute; left: .9rem;
          color: var(--text-light);
          pointer-events: none; z-index: 1;
        }
        .input-with-icon { padding-left: 2.6rem !important; }
        .input-eye {
          position: absolute; right: .9rem;
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: .25rem;
          color: var(--text-light);
        }
        .input-eye:hover { color: var(--text-base); }

        .auth-alert {
          padding: .75rem 1rem;
          border-radius: var(--radius-md);
          font-size: .875rem; font-weight: 500; line-height: 1.5;
        }
        .auth-alert-error   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .auth-alert-info    { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }
        .auth-alert-success { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }

        .auth-submit-btn {
          margin-top: .5rem;
          background: var(--wa-green-dark);
          padding: 0.85rem; font-size: 1rem;
          border-radius: 12px;
          color: #fff; font-weight: 700;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: var(--wa-teal);
          box-shadow: 0 8px 24px rgba(7,94,84,0.25);
        }
        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer-text {
          margin-top: 1.5rem; text-align: center;
          font-size: .875rem; color: var(--text-muted);
        }
        .auth-link {
          color: var(--wa-green-dark); font-weight: 700;
          text-decoration: none;
        }
        .auth-link:hover { text-decoration: underline; color: var(--wa-teal); }

        /* ── Mobile ───────────────────────────────── */
        @media (max-width: 768px) {
          .auth-shell { flex-direction: column; }
          .auth-hero { padding: 2.5rem 1.5rem; min-height: 0; }
          .auth-hero-inner { padding: 1.5rem; border-radius: 20px; }
          .auth-hero-title { font-size: 1.75rem; }
          .auth-hero-subtitle { display: none; }
          .auth-features { display: none; }
          .auth-blob-1 { width: 200px; height: 200px; }
          .auth-blob-2 { width: 130px; height: 130px; }
          .auth-form-panel { width: 100%; padding: 1.5rem 1rem 3rem; border-left: none; }
          .auth-form-inner { padding: 1.75rem 1.25rem; }
        }
      `}</style>
    </div>
  )
}
