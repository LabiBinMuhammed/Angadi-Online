import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, ArrowLeft, Store, ShieldCheck, RefreshCw, AlertTriangle, Scale, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | Angadi Online',
  description: 'Terms and Conditions of Use for Angadi Online multi-shop neighborhood marketplace.',
}

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Back to App */}
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
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#2563eb',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-base)' }}>
              Terms of Service
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Angadi Online Marketplace Agreement & User Guidelines
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', fontWeight: 600 }}>
            Effective Date: August 16, 2026
          </span>
          <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', fontWeight: 600 }}>
            Version 1.0
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, color: 'var(--text-base)', fontSize: '15px' }}>

        {/* Section 1: Agreement to Terms */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#2563eb' }}>1.</span> Agreement to Terms
          </h2>
          <p style={{ margin: 0 }}>
            By creating an account, downloading the mobile app, or accessing <strong>Angadi Online</strong> (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application or services.
          </p>
        </section>

        {/* Section 2: Marketplace Model & Shop Responsibility */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={20} style={{ color: '#16a34a' }} />
            <span>2. Neighborhood Marketplace Model</span>
          </h2>
          <p style={{ margin: 0 }}>
            Angadi Online connects customers with independent neighborhood grocery, supermarket, and convenience store vendors.
          </p>
          <ul style={{ margin: '12px 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Vendor Fulfillment:</strong> Each registered shop operates independently and is responsible for inventory pricing, item packing, freshness, and local doorstep delivery.</li>
            <li><strong>Order Placement:</strong> When you place an order, a direct commercial relationship is formed between you and the respective shop vendor.</li>
          </ul>
        </section>

        {/* Section 3: Pricing, Weight-based Items & Payment */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={20} style={{ color: '#f59e0b' }} />
            <span>3. Pricing, Estimation & Payments</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <strong>Estimated vs. Final Price:</strong> For weighted items (e.g., fresh vegetables, fruits, cuts of meat), the checkout price displayed is an accurate estimate. The final price is calculated by the vendor upon weighing and confirmed before delivery.
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <strong>Payment Methods:</strong> Orders can be settled via Cash on Delivery (COD), direct shop UPI upon delivery, or verified Shop-Managed Credit (where granted by the shop owner).
            </div>
          </div>
        </section>

        {/* Section 4: Delivery Shifts & Schedules */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#2563eb' }}>4.</span> Delivery Shifts & Cut-Off Windows
          </h2>
          <p style={{ margin: 0 }}>
            Deliveries are organized into scheduled shifts:
          </p>
          <ul style={{ margin: '10px 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Morning Shift:</strong> Delivery between 7:00 AM – 12:00 PM (Cut-off for same day: 8:00 AM).</li>
            <li><strong>Evening Shift:</strong> Delivery between 4:00 PM – 8:00 PM (Cut-off for same day: 2:00 PM).</li>
          </ul>
        </section>

        {/* Section 5: Cancellations & Replacement Policy */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={20} style={{ color: '#8b5cf6' }} />
            <span>5. Cancellations & Replacements</span>
          </h2>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Cancellation:</strong> You may cancel an order before the vendor begins packing or dispatching.</li>
            <li><strong>Replacement Request:</strong> If an item arrives damaged, expired, or incorrect, you can submit a replacement request with a photo within 24 hours of delivery.</li>
            <li><strong>Vendor Resolution:</strong> The vendor may approve delivery in the next shift, deliver immediately, or provide a refund/credit adjustment.</li>
          </ul>
        </section>

        {/* Section 6: User Conduct & Account Security */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: '#16a34a' }} />
            <span>6. User Conduct & Security</span>
          </h2>
          <p style={{ margin: 0 }}>
            You agree to provide accurate registration information (including real phone number and delivery address). Fraudulent orders, abusive behavior toward delivery staff, or misuse of shop credit will result in immediate account suspension.
          </p>
        </section>

        {/* Section 7: Limitation of Liability */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <span>7. Limitation of Liability</span>
          </h2>
          <p style={{ margin: 0 }}>
            Angadi Online provides the platform &quot;as is&quot;. While we enforce strict quality standards on participating vendors, the platform is not liable for indirect damages, temporary network interruptions, or food/product quality disputes beyond the replacement mechanism provided.
          </p>
        </section>

        {/* Section 8: Contact Information */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={20} style={{ color: '#2563eb' }} />
            <span>8. Contact & Legal Inquiries</span>
          </h2>
          <p style={{ margin: 0 }}>
            For legal inquiries, dispute escalations, or terms clarification, reach out to:
          </p>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <strong>Email:</strong> <a href="mailto:support@angadionline.com" style={{ color: '#2563eb' }}>support@angadionline.com</a>
          </div>
        </section>

      </div>
    </div>
  )
}
