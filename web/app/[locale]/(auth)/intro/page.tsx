import Link from 'next/link'

export default async function IntroPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  
  let messages: any = {}
  try {
    messages = require(`../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../messages/en.json')
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
    <div className="auth-intro-container">
      {/* Top Graphic / Illustration */}
      <div className="auth-intro-graphic">
        <svg viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="intro-illustration-svg">
          {/* Subtle background glow */}
          <circle cx="170" cy="140" r="120" fill="#E8F5E9" opacity="0.6"/>
          
          {/* Phone Device Mockup */}
          <rect x="140" y="30" width="130" height="220" rx="18" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="3"/>
          <rect x="185" y="38" width="40" height="5" rx="2.5" fill="#E0E0E0"/>
          
          {/* Phone Screen Grid Items */}
          <rect x="152" y="55" width="50" height="55" rx="8" fill="#F4F4F4"/>
          <circle cx="177" cy="78" r="14" fill="#2E5B28" opacity="0.8"/>
          <path d="M172 82C172 75 182 75 182 82" stroke="#FFF" strokeWidth="2"/>
          
          <rect x="210" y="55" width="50" height="55" rx="8" fill="#F4F4F4"/>
          <path d="M225 72Q235 60 245 72Q235 90 225 72Z" fill="#388E3C"/>
          
          <rect x="152" y="120" width="50" height="55" rx="8" fill="#F4F4F4"/>
          <circle cx="177" cy="145" r="12" fill="#4CAF50"/>
          
          <rect x="210" y="120" width="50" height="55" rx="8" fill="#F4F4F4"/>
          <rect x="227" y="132" width="16" height="26" rx="4" fill="#81C784"/>

          {/* Pay Button on Phone */}
          <rect x="152" y="190" width="108" height="26" rx="13" fill="#2E5B28"/>
          <text x="206" y="207" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle">PAY</text>

          {/* Delivery Person Illustration */}
          {/* Leaves/Plant Background accent */}
          <path d="M40 80C30 110 50 140 30 170C60 170 80 130 70 80Z" fill="#C8E6C9"/>
          
          {/* Body / Shirt */}
          <path d="M45 180 C45 150, 135 150, 135 180 L145 270 L35 270 Z" fill="#2E5B28"/>
          <path d="M78 150 L92 150 L95 190 L75 190 Z" fill="#1B4315"/>

          {/* Grocery Paper Bag held */}
          <path d="M25 180 L105 180 L95 260 L35 260 Z" fill="#1F3A1B"/>
          {/* Grocery items sticking out */}
          <circle cx="50" cy="165" r="10" fill="#4CAF50"/>
          <rect x="65" y="150" width="12" height="25" rx="3" fill="#E0E0E0"/>
          <path d="M85 160 Q95 150 100 165 Z" fill="#66BB6A"/>

          {/* Face & Head */}
          <circle cx="90" cy="115" r="24" fill="#FFCC80"/>
          {/* Ear */}
          <circle cx="68" cy="115" r="5" fill="#FFA726"/>
          {/* Hair */}
          <path d="M70 100 C75 90, 105 90, 110 100 Z" fill="#37474F"/>
          {/* Green Cap */}
          <path d="M64 105 C64 90, 116 90, 116 105 Z" fill="#2E5B28"/>
          <path d="M60 105 L124 105 Q128 105 120 112 L64 112 Z" fill="#1B4315"/>
          
          {/* Eyes & Smile */}
          <circle cx="98" cy="112" r="2.5" fill="#37474F"/>
          <path d="M94 122 Q100 128 104 122" stroke="#37474F" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Content Text */}
      <div className="auth-intro-content">
        <h1 className="auth-intro-title">
          {t('auth.join_us_or_sign_in') || 'Join Us Or Sign In'}
        </h1>
        <p className="auth-intro-subtitle">
          {t('auth.intro_subtitle') || 'Discover fresh groceries, local shops, and fast delivery right at your doorstep.'}
        </p>
      </div>

      {/* Bottom Action Buttons */}
      <div className="auth-intro-actions">
        <Link href={`/${locale}/signup`} className="auth-btn-primary">
          {t('auth.sign_up') || 'Sign Up'}
        </Link>
        <Link href={`/${locale}/login`} className="auth-btn-secondary">
          {t('auth.sign_in') || 'Sign In'}
        </Link>
      </div>

      <style>{`
        .auth-intro-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          min-height: 100%;
          padding: 1.5rem 1.25rem 2rem;
          box-sizing: border-box;
          text-align: center;
        }
        .auth-intro-graphic {
          width: 100%;
          max-width: 320px;
          margin: 1rem auto;
          display: flex;
          justify-content: center;
        }
        .intro-illustration-svg {
          width: 100%;
          height: auto;
          max-height: 260px;
        }
        .auth-intro-content {
          margin: 1rem 0 2rem;
        }
        .auth-intro-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }
        [data-theme="dark"] .auth-intro-title {
          color: #ffffff;
        }
        .auth-intro-subtitle {
          font-size: 0.92rem;
          color: #71717a;
          line-height: 1.5;
          max-width: 300px;
          margin: 0 auto;
        }
        .auth-intro-actions {
          width: 100%;
          display: flex;
          gap: 1rem;
          margin-top: auto;
        }
        .auth-btn-primary {
          flex: 1;
          background: #2e5b28;
          color: #ffffff;
          padding: 0.95rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 1rem;
          text-decoration: none;
          text-align: center;
          box-shadow: 0 4px 14px rgba(46, 91, 40, 0.25);
          transition: all 0.2s ease;
        }
        .auth-btn-primary:hover {
          background: #234e1b;
          transform: translateY(-1px);
        }
        .auth-btn-secondary {
          flex: 1;
          background: #f1f5f9;
          color: #1a1a1a;
          padding: 0.95rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 1rem;
          text-decoration: none;
          text-align: center;
          transition: all 0.2s ease;
        }
        [data-theme="dark"] .auth-btn-secondary {
          background: #27272a;
          color: #ffffff;
        }
        .auth-btn-secondary:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  )
}
