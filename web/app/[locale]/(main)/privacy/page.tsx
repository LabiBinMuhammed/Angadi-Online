import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, MapPin, Phone, Database, Trash2, Mail, CheckCircle, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Angadi Online',
  description: 'Privacy Policy for Angadi Online multi-shop neighborhood marketplace application.',
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Back to Home / Settings */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          href={`/${locale}/home`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Back to App
        </Link>
      </div>

      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '32px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-base)' }}>
              Privacy Policy
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Angadi Online — Multi-Shop Local Commerce Platform
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', fontWeight: 600 }}>
            Effective Date: August 16, 2026
          </span>
          <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0284c7', fontWeight: 600 }}>
            Google Play Compliant
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, color: 'var(--text-base)', fontSize: '15px' }}>
        
        {/* Section 1: Introduction */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>1.</span> Introduction
          </h2>
          <p style={{ margin: 0 }}>
            Welcome to <strong>Angadi Online</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;). We are committed to protecting your privacy and ensuring transparency about how your personal information is collected, used, and safeguarded when you use our mobile application and website.
          </p>
          <p style={{ margin: '12px 0 0' }}>
            By downloading, installing, or accessing Angadi Online, you agree to the collection and use of information in accordance with this Privacy Policy.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>2.</span> Information We Collect
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Phone size={20} style={{ color: '#0ea5e9', marginTop: '3px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '15px' }}>A. Account & Contact Information:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                  When you register or sign in, we collect your <strong>full name</strong>, <strong>phone number</strong>, and optional <strong>email address</strong>. Your phone number is used as your unique identifier for authentication and order delivery communication.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <MapPin size={20} style={{ color: '#22c55e', marginTop: '3px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '15px' }}>B. Location & Delivery Address Data:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                  We collect your saved delivery addresses (including house name/number, street, landmark, and optional GPS coordinates). Location data is collected <strong>only</strong> to discover nearby neighborhood shops offering delivery to your area and to ensure accurate doorstep delivery by shop delivery personnel.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Database size={20} style={{ color: '#f59e0b', marginTop: '3px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '15px' }}>C. Order & Transaction Data:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                  We record order details including items purchased, product quantities/weights, chosen delivery slots (Morning/Evening), payment preference (Cash on Delivery / Shop Credit), and status progressions.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Lock size={20} style={{ color: '#8b5cf6', marginTop: '3px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '15px' }}>D. Camera & Storage Permissions (Optional):</strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                  If you submit a product replacement or damage claim, you may choose to take a photo or upload an image of the damaged item. The app only accesses your camera or gallery when you explicitly trigger photo upload.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How We Use Your Information */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>3.</span> How We Use Your Information
          </h2>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Fulfill Orders:</strong> Sharing your delivery address, contact name, and phone number with the specific shop you ordered from so they can pack and deliver your order.</li>
            <li><strong>Authentication & Security:</strong> Verifying your identity and securing your sessions via encrypted tokens.</li>
            <li><strong>Customer Support:</strong> Resolving delivery queries, dispute resolutions, and replacement requests.</li>
            <li><strong>Platform Optimization:</strong> Improving app performance, offline reliability, and multilingual features.</li>
          </ul>
        </section>

        {/* Section 4: Data Sharing & Third Parties */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>4.</span> Third-Party Services & Data Sharing
          </h2>
          <p style={{ margin: 0 }}>
            <strong>We do not sell, rent, or trade your personal data to advertisers or third-party brokers.</strong> Data is shared only with:
          </p>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '14px' }}>
              <strong>Local Shop Vendors:</strong> Only the vendor fulfillling your order receives your delivery address and phone number for delivery purposes.
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '14px' }}>
              <strong>Backend Infrastructure (Supabase / PostgreSQL):</strong> Secure, encrypted cloud database hosting with Row-Level Security (RLS) enforcement.
            </div>
          </div>
        </section>

        {/* Section 5: Security Measures */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>5.</span> Data Security
          </h2>
          <p style={{ margin: 0 }}>
            We implement industry-standard technical measures to protect your information:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '14px' }}>
            <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>HTTPS / TLS Encryption</span>
            </div>
            <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Row Level Security (RLS)</span>
            </div>
            <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Secure JWT Authentication</span>
            </div>
          </div>
        </section>

        {/* Section 6: Data Retention & Account Deletion (Play Store Requirement) */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={20} style={{ color: '#ef4444' }} />
            <span>6. Account Deletion & Data Retention</span>
          </h2>
          <p style={{ margin: 0 }}>
            In compliance with Google Play Developer Policies, you have the right to request deletion of your account and associated personal data at any time.
          </p>
          <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px' }}>
            <strong style={{ color: '#dc2626', fontSize: '14px' }}>How to delete your account:</strong>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-base)' }}>
              1. In the mobile app, go to <strong>Profile → Settings → Security</strong> and click <strong>Delete Account</strong>, OR<br />
              2. Send an email to our support team at <a href="mailto:support@angadionline.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>support@angadionline.com</a> with your registered phone number.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Upon confirmation, your personal profile, contact information, and saved addresses will be permanently purged from our database within 30 days.
            </p>
          </div>
        </section>

        {/* Section 7: Children's Privacy */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>7.</span> Children&apos;s Privacy
          </h2>
          <p style={{ margin: 0 }}>
            Angadi Online does not knowingly collect or solicit personal information from children under the age of 13. If you believe a child has provided us with personal data, please contact us immediately so we can remove the information.
          </p>
        </section>

        {/* Section 8: Contact Us */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={20} style={{ color: 'var(--primary)' }} />
            <span>8. Contact Information</span>
          </h2>
          <p style={{ margin: 0 }}>
            If you have any questions, feedback, or privacy-related requests regarding this Privacy Policy, please contact us:
          </p>
          <div style={{ marginTop: '12px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>Application:</strong> Angadi Online</div>
            <div><strong>Email:</strong> <a href="mailto:support@angadionline.com" style={{ color: 'var(--primary)' }}>support@angadionline.com</a></div>
            <div><strong>Developer:</strong> Angadi Commerce Solutions</div>
          </div>
        </section>

      </div>
    </div>
  )
}
