import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, ArrowLeft, Store, RefreshCw, AlertTriangle, Scale, Mail } from 'lucide-react'

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
  const isMl = locale === 'ml'
  const isHi = locale === 'hi'
  const isAr = locale === 'ar'

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px 80px' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back to App */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <ArrowLeft size={16} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
          {isMl ? 'തിരികെ ആപ്പിലേക്ക്' : isHi ? 'वापस ऐप पर जाएं' : isAr ? 'العودة إلى التطبيق' : 'Back to App'}
        </Link>

        {/* Language Quick Switcher */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
          <Link href="/en/terms" style={{ fontWeight: locale === 'en' ? 800 : 500, color: locale === 'en' ? '#2563eb' : 'var(--text-muted)' }}>EN</Link>
          <span>•</span>
          <Link href="/ml/terms" style={{ fontWeight: locale === 'ml' ? 800 : 500, color: locale === 'ml' ? '#2563eb' : 'var(--text-muted)' }}>മലയാളം</Link>
          <span>•</span>
          <Link href="/hi/terms" style={{ fontWeight: locale === 'hi' ? 800 : 500, color: locale === 'hi' ? '#2563eb' : 'var(--text-muted)' }}>हिंदी</Link>
          <span>•</span>
          <Link href="/ar/terms" style={{ fontWeight: locale === 'ar' ? 800 : 500, color: locale === 'ar' ? '#2563eb' : 'var(--text-muted)' }}>العربية</Link>
        </div>
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
              {isMl ? 'ഉപയോഗ നിബന്ധനകൾ (Terms of Service)' : isHi ? 'सेवा की शर्तें (Terms of Service)' : isAr ? 'شروط الخدمة (Terms of Service)' : 'Terms of Service'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Angadi Online Marketplace Agreement & User Guidelines
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', fontWeight: 600 }}>
            {isMl ? 'പ്രാബല്യത്തിൽ: ആഗസ്റ്റ് 16, 2026' : isHi ? 'प्रभावी तिथि: 16 अगस्त, 2026' : isAr ? 'تاريخ السريان: 16 أغسطس 2026' : 'Effective Date: August 16, 2026'}
          </span>
          <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', fontWeight: 600 }}>
            Version 1.0
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, color: 'var(--text-base)', fontSize: '15px' }}>

        {/* Section 1: Agreement */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#2563eb' }}>1.</span> 
            {isMl ? 'നിബന്ധനകൾ അംഗീകരിക്കൽ' : isHi ? 'शर्तों की स्वीकृति' : isAr ? 'الموافقة على الشروط' : 'Agreement to Terms'}
          </h2>
          <p style={{ margin: 0 }}>
            {isMl
              ? 'അങ്ങാടി ഓൺലൈൻ ഉപയോഗിക്കുന്നതിലൂടെ നിങ്ങൾ ഈ നിബന്ധനകൾ പൂർണ്ണമായി അംഗീകരിക്കുന്നു.'
              : isHi
              ? 'अंगाडी ऑनलाइन का उपयोग करके आप इन सेवा शर्तों से पूरी तरह सहमत होते हैं।'
              : isAr
              ? 'باستخدام تطبيق أنجادي أونلاين، فإنك توافق على الالتزام بكافة هذه الشروط والأحكام.'
              : 'By creating an account, downloading the mobile app, or accessing Angadi Online, you agree to be bound by these Terms of Service.'}
          </p>
        </section>

        {/* Section 2: Marketplace Model */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={20} style={{ color: '#16a34a' }} />
            <span>{isMl ? 'മാർക്കറ്റ്പ്ലേസ് മാതൃക' : isHi ? 'मार्केटप्लेस मॉडल' : isAr ? 'نموذج السوق المحلي' : 'Neighborhood Marketplace Model'}</span>
          </h2>
          <p style={{ margin: 0 }}>
            {isMl
              ? 'അങ്ങാടി ഓൺലൈൻ നിങ്ങളുടെ അടുത്തുള്ള പ്രാദേശിക കടകളെ നിങ്ങളുമായി ബന്ധിപ്പിക്കുന്ന പ്ലാറ്റ്‌ഫോമാണ്. ഓരോ കടയുടമയും സ്വന്തം സാധനങ്ങൾ പാക്ക് ചെയ്യുന്നതിനും ഡെലിവറി നടത്തുന്നതിനും ഉത്തരവാദിയാണ്.'
              : isHi
              ? 'अंगाडी ऑनलाइन आपके पड़ोस की दुकानों को आपसे जोड़ता है। प्रत्येक विक्रेता उत्पादों की उपलब्धता, गुणवत्ता और डिलीवरी के लिए सीधे जिम्मेदार है।'
              : isAr
              ? 'أنجادي أونلاين منصة تربطك بالمتاجر المحلية في حيك. يتحمل كل متجر مسؤولية جودة المنتجات وتوصيلها مباشرة.'
              : 'Angadi Online connects customers with independent neighborhood grocery and store vendors. Each shop is responsible for its pricing, product packing, and doorstep delivery.'}
          </p>
        </section>

        {/* Section 3: Pricing & Weights */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={20} style={{ color: '#f59e0b' }} />
            <span>{isMl ? 'വിലനിർണ്ണയവും തൂക്കവും' : isHi ? 'मूल्य निर्धारण और वजन' : isAr ? 'الأسعار والوزن' : 'Pricing, Estimation & Payments'}</span>
          </h2>
          <p style={{ margin: 0 }}>
            {isMl
              ? 'പച്ചക്കറികൾ, പഴങ്ങൾ തുടങ്ങിയ തൂക്കം അനുസരിച്ചുള്ള സാധനങ്ങൾക്ക് കാർട്ടിൽ കാണിക്കുന്നത് ഏകദേശ വിലയാണ്. കടയിൽ വെച്ച് കൃത്യമായി തൂക്കിനോക്കിയ ശേഷമുള്ള അന്തിമ വിലയാണ് ഡെലിവറി സമയത്ത് നൽകേണ്ടത്.'
              : isHi
              ? 'सब्जियों और फलों जैसी वजन वाली वस्तुओं के लिए कार्ट में अनुमानित मूल्य दिखाया जाता है। दुकान द्वारा सटीक वजन के बाद अंतिम बिल तय होता है।'
              : isAr
              ? 'بالنسبة للمنتجات المباعة بالوزن (مثل الخضار واللحوم)، فإن السعر في السلة تقديري ويتم تأكيد السعر النهائي بعد الوزن الفعلي عند التجهيز.'
              : 'For weighted items (vegetables, meat), the checkout price is an accurate estimate. The final price is calculated by the shop upon physical weighing.'}
          </p>
        </section>

        {/* Section 4: Replacements */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={20} style={{ color: '#8b5cf6' }} />
            <span>{isMl ? 'റീപ്ലേസ്‌മെന്റ് പോളിസി' : isHi ? 'प्रतिस्थापन (Replacement) नीति' : isAr ? 'سياسة الاستبدال' : 'Cancellations & Replacements'}</span>
          </h2>
          <p style={{ margin: 0 }}>
            {isMl
              ? 'കേടുപാടുകൾ ഉള്ള സാധനങ്ങൾക്ക് ഡെലിവറി കഴിഞ്ഞ് 24 മണിക്കൂറിനുള്ളിൽ ആപ്പിലൂടെ ഫോട്ടോ സഹിതം റീപ്ലേസ്‌മെന്റ് റിക്വസ്റ്റ് സമർപ്പിക്കാവുന്നതാണ്. കടയുടമ അത് പരിശോധിച്ച് അടുത്ത ഷിഫ്റ്റിലോ ഉടനടിയോ പുതിയ സാധനം നൽകുന്നതാണ്.'
              : isHi
              ? 'क्षतिग्रस्त या गलत वस्तुओं के लिए डिलीवरी के 24 घंटों के भीतर फोटो के साथ रिप्लेसमेंट अनुरोध दर्ज करें। दुकानदार अगले स्लॉट में इसे बदल देंगे।'
              : isAr
              ? 'إذا وصلت سلعة تالفة، يمكنك تقديم طلب استبدال بصورة خلال 24 ساعة وسيقوم المتجر باستبدالها في الوردية القادمة أو فوراً.'
              : 'If an item arrives damaged or incorrect, submit a replacement request with a photo within 24 hours. The vendor can approve replacement in the next shift or dispatch immediately.'}
          </p>
        </section>

        {/* Section 5: Contact */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={20} style={{ color: '#2563eb' }} />
            <span>{isMl ? 'നിയമപരമായ അന്വേഷണങ്ങൾ' : isHi ? 'संपर्क' : isAr ? 'التواصل والاستفسار' : 'Contact & Legal Inquiries'}</span>
          </h2>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Email: <a href="mailto:support@angadionline.com" style={{ color: '#2563eb', fontWeight: 600 }}>support@angadionline.com</a>
          </p>
        </section>

      </div>
    </div>
  )
}
