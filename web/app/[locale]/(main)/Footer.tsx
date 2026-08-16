'use client'

import Link from 'next/link'
import { 
  Truck, Store, ShieldCheck, MessageSquare, 
  MapPin, Heart, Sparkles, PhoneCall 
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function Footer() {
  const { locale, t } = useTranslation()

  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      marginTop: 'auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .footer-trust-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
          padding: 32px 24px;
          border-bottom: 1px solid var(--border);
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (min-width: 640px) {
          .footer-trust-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .footer-trust-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .footer-main-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 40px;
          padding: 48px 24px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (min-width: 640px) {
          .footer-main-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .footer-main-grid {
            grid-template-columns: 2fr 1fr 1fr 1.2fr;
          }
        }
        .footer-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s ease;
          display: inline-block;
          margin-bottom: 10px;
        }
        .footer-link:hover {
          color: var(--wa-green-dark);
        }
        .footer-heading {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-base);
          margin: 0 0 18px 0;
          letter-spacing: -0.2px;
        }
      `}} />

      {/* Trust Badges Bar */}
      <div style={{ background: 'var(--bg-muted)' }}>
        <div className="footer-trust-grid">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--wa-green-light)', color: 'var(--wa-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-base)' }}>Fast Local Delivery</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Direct from village shops</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--wa-green-light)', color: 'var(--wa-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Store size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-base)' }}>Verified Shops</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trusted local merchants</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--wa-green-light)', color: 'var(--wa-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-base)' }}>Quality Guaranteed</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fresh produce & fair prices</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--wa-green-light)', color: 'var(--wa-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquare size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-base)' }}>WhatsApp Ordering</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Instant seller connectivity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Footer Grid */}
      <div className="footer-main-grid">
        {/* Col 1: Brand Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #4cd964, #32b84a)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(76,217,100,0.3)' }}>
              A
            </div>
            <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-base)', letterSpacing: '-0.5px' }}>
              Angadi Online
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '320px' }}>
            {t('footer.description') || "Your community's trusted marketplace. Fast delivery, fresh produce, and local support, brought directly to your doorstep."}
          </p>

          <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'var(--wa-green-light)', color: 'var(--wa-green-dark)', fontSize: '12px', fontWeight: 700 }}>
            <Sparkles size={14} /> Community First Marketplace
          </div>
        </div>

        {/* Col 2: Marketplace Links */}
        <div>
          <h4 className="footer-heading">Marketplace</h4>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href={`/${locale}/home`} className="footer-link">{t('nav.home')}</Link>
            <Link href={`/${locale}/pinned-shops`} className="footer-link">{t('nav.pinned_shops')}</Link>
            <Link href={`/${locale}/favorites`} className="footer-link">{t('nav.favorites')}</Link>
            <Link href={`/${locale}/search`} className="footer-link">{t('common.search') || 'Search Products'}</Link>
          </div>
        </div>

        {/* Col 3: Customer Care */}
        <div>
          <h4 className="footer-heading">My Account</h4>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href={`/${locale}/orders`} className="footer-link">{t('nav.orders')}</Link>
            <Link href={`/${locale}/cart`} className="footer-link">{t('nav.cart')}</Link>
            <Link href={`/${locale}/recent-purchases`} className="footer-link">{t('nav.recent_purchases')}</Link>
            <Link href={`/${locale}/profile`} className="footer-link">{t('nav.profile')}</Link>
          </div>
        </div>

        {/* Col 4: Preferences & Support */}
        <div>
          <h4 className="footer-heading">Preferences</h4>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href={`/${locale}/settings`} className="footer-link">{t('nav.settings')}</Link>
            <Link href={`/${locale}/privacy`} className="footer-link">Privacy Policy</Link>
            <Link href={`/${locale}/terms`} className="footer-link">Terms of Service</Link>
            <Link href={`/${locale}/delete-account`} className="footer-link">Delete Account</Link>
            <Link href={`/${locale}/notifications`} className="footer-link">{t('notifications.title') || 'Notifications'}</Link>
          </div>

          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-base)', marginBottom: '4px' }}>Need Help?</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contact your local shop vendor directly via WhatsApp checkout.</div>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Copyright Bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} Angadi Online. {t('footer.rights_reserved') || 'All rights reserved.'} • <Link href={`/${locale}/privacy`} style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy</Link> • <Link href={`/${locale}/terms`} style={{ color: 'inherit', textDecoration: 'underline' }}>Terms</Link> • <Link href={`/${locale}/delete-account`} style={{ color: 'inherit', textDecoration: 'underline' }}>Delete Account</Link>
          </p>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Made with <Heart size={12} color="#ef4444" fill="#ef4444" /> for local multi-shop communities
          </p>
        </div>
      </div>
    </footer>
  )
}
