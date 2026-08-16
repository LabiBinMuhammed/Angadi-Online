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
  const isMl = locale === 'ml'
  const isHi = locale === 'hi'
  const isAr = locale === 'ar'

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px 80px' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back to Home / Settings */}
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
          <Link href="/en/privacy" style={{ fontWeight: locale === 'en' ? 800 : 500, color: locale === 'en' ? 'var(--primary)' : 'var(--text-muted)' }}>EN</Link>
          <span>•</span>
          <Link href="/ml/privacy" style={{ fontWeight: locale === 'ml' ? 800 : 500, color: locale === 'ml' ? 'var(--primary)' : 'var(--text-muted)' }}>മലയാളം</Link>
          <span>•</span>
          <Link href="/hi/privacy" style={{ fontWeight: locale === 'hi' ? 800 : 500, color: locale === 'hi' ? 'var(--primary)' : 'var(--text-muted)' }}>हिंदी</Link>
          <span>•</span>
          <Link href="/ar/privacy" style={{ fontWeight: locale === 'ar' ? 800 : 500, color: locale === 'ar' ? 'var(--primary)' : 'var(--text-muted)' }}>العربية</Link>
        </div>
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
              {isMl ? 'സ്വകാര്യതാ നയം (Privacy Policy)' : isHi ? 'गोपनीयता नीति (Privacy Policy)' : isAr ? 'سياسة الخصوصية (Privacy Policy)' : 'Privacy Policy'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Angadi Online — Multi-Shop Local Commerce Platform
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', fontWeight: 600 }}>
            {isMl ? 'പ്രാബല്യത്തിൽ: ആഗസ്റ്റ് 16, 2026' : isHi ? 'प्रभावी तिथि: 16 अगस्त, 2026' : isAr ? 'تاريخ السريان: 16 أغسطس 2026' : 'Effective Date: August 16, 2026'}
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
            <span style={{ color: 'var(--primary)' }}>1.</span> 
            {isMl ? 'ആമുഖം (Introduction)' : isHi ? 'परिचय (Introduction)' : isAr ? 'مقدمة (Introduction)' : 'Introduction'}
          </h2>
          <p style={{ margin: 0 }}>
            {isMl 
              ? 'അങ്ങാടി ഓൺലൈനിലേക്ക് (Angadi Online) സ്വാഗതം. നിങ്ങളുടെ സ്വകാര്യത സംരക്ഷിക്കുന്നതിനും നിങ്ങളുടെ വിവരങ്ങൾ എങ്ങനെ ശേഖരിക്കുന്നു, ഉപയോഗിക്കുന്നു എന്ന് വ്യക്തമാക്കുന്നതിനും ഞങ്ങൾ പ്രതിജ്ഞാബദ്ധരാണ്.'
              : isHi
              ? 'अंगाडी ऑनलाइन (Angadi Online) में आपका स्वागत है। हम आपकी गोपनीयता की रक्षा करने और आपकी व्यक्तिगत जानकारी के सुरक्षित उपयोग के लिए प्रतिबद्ध हैं।'
              : isAr
              ? 'مرحبًا بك في أنجادي أونلاين (Angadi Online). نحن ملتزمون بحماية خصوصيتك وضمان الشفافية الكاملة بشأن كيفية جمع معلوماتك الشخصية واستخدامها.'
              : 'Welcome to Angadi Online ("we", "our", or "the Platform"). We are committed to protecting your privacy and ensuring transparency about how your personal information is collected, used, and safeguarded.'}
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>2.</span> 
            {isMl ? 'ഞങ്ങൾ ശേഖരിക്കുന്ന വിവരങ്ങൾ' : isHi ? 'हम क्या जानकारी एकत्र करते हैं' : isAr ? 'المعلومات التي نجمعها' : 'Information We Collect'}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Phone size={20} style={{ color: '#0ea5e9', marginTop: '3px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '15px' }}>
                  {isMl ? 'A. അക്കൗണ്ട് & ഫോൺ നമ്പർ വിവരങ്ങൾ:' : isHi ? 'A. खाता और फोन विवरण:' : isAr ? 'أ. معلومات الحساب ورقم الهاتف:' : 'A. Account & Contact Information:'}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                  {isMl
                    ? 'നിങ്ങൾ രജിസ്റ്റർ ചെയ്യുമ്പോൾ പേര്, ഫോൺ നമ്പർ എന്നിവ ശേഖരിക്കുന്നു. നിങ്ങളുടെ ഫോൺ നമ്പർ സുരക്ഷിതമായ ലോഗിനും ഓർഡർ ഡെലിവറി അറിയിപ്പുകൾക്കുമായി ഉപയോഗിക്കുന്നു.'
                    : isHi
                    ? 'पंजीकरण के समय पूरा नाम और फोन नंबर लिया जाता है। फोन नंबर का उपयोग सत्यापन और डिलीवरी संपर्क के लिए किया जाता है।'
                    : isAr
                    ? 'عند التسجيل، نجمع الاسم الكامل ورقم الهاتف. يُستخدم رقم هاتفك للمصادقة وتوصيل الطلبات.'
                    : 'When you register or sign in, we collect your full name, phone number, and optional email address for secure authentication and order communication.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <MapPin size={20} style={{ color: '#22c55e', marginTop: '3px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '15px' }}>
                  {isMl ? 'B. ലൊക്കേഷനും ഡെലിവറി വിലാസവും:' : isHi ? 'B. स्थान और वितरण पता:' : isAr ? 'ب. الموقع وعنوان التوصيل:' : 'B. Location & Delivery Address Data:'}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                  {isMl
                    ? 'നിങ്ങളുടെ പ്രദേശത്തെ അടുത്തുള്ള കടകൾ കണ്ടെത്തുന്നതിനും വീട്ടുപടിക്കൽ കൃത്യമായ ഡെലിവറി ഉറപ്പാക്കുന്നതിനും മാത്രമാണ് ലൊക്കേഷൻ ഉപയോഗിക്കുന്നത്.'
                    : isHi
                    ? 'आपके पड़ोस की दुकानों को खोजने और सटीक डोरस्टेप डिलीवरी के लिए ही लोकेशन डेटा का उपयोग किया जाता है।'
                    : isAr
                    ? 'يتم جمع بيانات الموقع الجغرافي فقط لاكتشاف المتاجر المجاورة وضمان دقة توصيل الطلبات إلى باب منزلك.'
                    : 'Location data is collected strictly to discover nearby neighborhood shops and ensure accurate doorstep delivery by shop delivery personnel.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Database size={20} style={{ color: '#f59e0b', marginTop: '3px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '15px' }}>
                  {isMl ? 'C. ഓർഡർ വിവരങ്ങൾ:' : isHi ? 'C. ऑर्डर विवरण:' : isAr ? 'ج. تفاصيل الطلبات:' : 'C. Order & Transaction Data:'}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                  {isMl
                    ? 'വാങ്ങിയ സാധനങ്ങൾ, തിരഞ്ഞെടുത്ത ഷിഫ്റ്റ് സമയം (രാവിലെ/വൈകുന്നേരം), പെയ്‌മെന്റ് രീതി എന്നിവ സുരക്ഷിതമായി സൂക്ഷിക്കുന്നു.'
                    : isHi
                    ? 'ऑर्डर की गई वस्तुएं, चुना गया डिलीवरी स्लॉट (सुबह/शाम), और भुगतान वरीयता रिकॉर्ड की जाती है।'
                    : isAr
                    ? 'تسجيل تفاصيل الطلبات والسلع وفترة التوصيل المختارة (صباحاً/مساءً).'
                    : 'Recorded items, chosen delivery slots (Morning/Evening), and payment methods (Cash on Delivery / Shop Credit).'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Lock size={20} style={{ color: '#8b5cf6', marginTop: '3px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '15px' }}>
                  {isMl ? 'D. ക്യാമറ & ഫോട്ടോ അനുമതി (ഓപ്ഷണൽ):' : isHi ? 'D. कैमरा और फोटो अनुमति (वैकल्पिक):' : isAr ? 'د. إذن الكاميرا والصور (اختياري):' : 'D. Camera & Storage Permissions (Optional):'}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                  {isMl
                    ? 'സാധനങ്ങൾ കേടുവന്നാൽ റീപ്ലേസ്‌മെന്റ് റിക്വസ്റ്റിനായി ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുമ്പോൾ മാത്രം ക്യാമറ ആക്സസ് ചെയ്യുന്നു.'
                    : isHi
                    ? 'क्षतिग्रस्त उत्पाद के बदले नए उत्पाद (Replacement) के अनुरोध के लिए फोटो अपलोड करते समय ही कैमरा का उपयोग किया जाता है।'
                    : isAr
                    ? 'يتم الوصول إلى الكاميرا فقط عند رغبتك في رفع صورة لإثبات تلف سلعة وطلب استبدالها.'
                    : 'Accessed only when you voluntarily upload photos for damaged items or product replacement claims.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Data Sharing */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>3.</span> 
            {isMl ? 'വിവരങ്ങൾ പങ്കിടൽ (Data Sharing)' : isHi ? 'डेटा साझाकरण (Data Sharing)' : isAr ? 'مشاركة البيانات (Data Sharing)' : 'Data Sharing & Third Parties'}
          </h2>
          <p style={{ margin: 0 }}>
            <strong>{isMl ? 'ഞങ്ങൾ നിങ്ങളുടെ വിവരങ്ങൾ പരസ്യ ബ്രോക്കർമാർക്ക് വിൽക്കുകയോ കൈമാറുകയോ ചെയ്യുന്നില്ല.' : isHi ? 'हम आपका व्यक्तिगत डेटा कभी भी विज्ञापनदाताओं को नहीं बेचते हैं।' : isAr ? 'نحن لا نبيع بياناتك الشخصية لأي جهات إعلانية إطلاقاً.' : 'We do not sell, rent, or trade your personal data to advertisers or third-party brokers.'}</strong>
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {isMl
              ? 'ഓർഡർ ഡെലിവറി ചെയ്യാനായി ബന്ധപ്പെട്ട കടയുടമയ്ക്ക് മാത്രമാണ് നിങ്ങളുടെ വിലാസവും ഫോൺ നമ്പറും നൽകുന്നത്.'
              : isHi
              ? 'केवल ऑर्डर पूरा करने वाली स्थानीय दुकान को ही आपका डिलीवरी पता और फोन नंबर प्रदान किया जाता है।'
              : isAr
              ? 'يتم تزويد المتجر المسؤول عن طلبك فقط بالعنوان ورقم الهاتف لغرض التوصيل.'
              : 'Data is shared only with the local shop fulfillment partner and encrypted cloud database infrastructure (Supabase RLS).'}
          </p>
        </section>

        {/* Section 4: Account Deletion (Google Play Mandatory) */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={20} style={{ color: '#ef4444' }} />
            <span>{isMl ? 'അക്കൗണ്ട് ഇല്ലാതാക്കൽ (Account & Data Deletion)' : isHi ? 'खाता हटाना (Account Deletion)' : isAr ? 'حذف الحساب والبيانات' : 'Account & Data Deletion'}</span>
          </h2>
          <p style={{ margin: 0 }}>
            {isMl
              ? 'ഗൂഗിൾ പ്ലേ പോളിസി പ്രകാരം ഏത് സമയത്തും നിങ്ങളുടെ അക്കൗണ്ടും വിവരങ്ങളും പൂർണ്ണമായി നീക്കം ചെയ്യാൻ സാധിക്കും.'
              : isHi
              ? 'गूगल प्ले नीतियों के अनुसार, आप किसी भी समय अपना खाता और व्यक्तिगत डेटा पूरी तरह से हटाने का अनुरोध कर सकते हैं।'
              : isAr
              ? 'وفقاً لسياسات Google Play، يحق لك طلب حذف حسابك وبياناتك بالكامل في أي وقت.'
              : 'In compliance with Google Play Developer Policies, you have the right to request deletion of your account and personal data at any time.'}
          </p>
          <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px' }}>
            <Link href={`/${locale}/delete-account`} style={{ color: '#dc2626', fontWeight: 700, fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={16} />
              {isMl ? '👉 ഇവിടെ ക്ലിക്ക് ചെയ്ത് അക്കൗണ്ട് ഡിലീറ്റ് ചെയ്യാം' : isHi ? '👉 खाता हटाने के लिए यहाँ क्लिक करें' : isAr ? '👉 انقر هنا لطلب حذف الحساب' : '👉 Click here to request account deletion online'}
            </Link>
          </div>
        </section>

        {/* Section 5: Contact */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={20} style={{ color: 'var(--primary)' }} />
            <span>{isMl ? 'ബന്ധപ്പെടുക (Contact)' : isHi ? 'संपर्क करें (Contact)' : isAr ? 'اتصل بنا (Contact)' : 'Contact Support'}</span>
          </h2>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Email: <a href="mailto:support@angadionline.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>support@angadionline.com</a>
          </p>
        </section>

      </div>
    </div>
  )
}
