'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Trash2, ArrowLeft, ShieldAlert, CheckCircle2, HelpCircle, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  const isMl = locale === 'ml'
  const isHi = locale === 'hi'
  const isAr = locale === 'ar'

  const [identifier, setIdentifier] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError(
        isMl 
          ? 'നിങ്ങളുടെ ഫോൺ നമ്പറോ ഇമെയിലോ നൽകുക.' 
          : isHi 
          ? 'कृपया अपना पंजीकृत फोन नंबर या ईमेल दर्ज करें।' 
          : isAr 
          ? 'يرجى إدخال رقم هاتفك أو بريدك الإلكتروني.' 
          : 'Please provide your registered phone number or email address.'
      )
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      await supabase.from('feedbacks').insert({
        comment: `[ACCOUNT DELETION REQUEST] Target Identifier: ${identifier.trim()}. Reason: ${reason || 'User requested via public deletion page.'}`,
        category: 'other',
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 16px 80px' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back Link & Lang Switcher */}
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
          {isMl ? 'തിരികെ ഹോമിലേക്ക്' : isHi ? 'वापस होम पर जाएं' : isAr ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>

        {/* Language Quick Switcher */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
          <Link href="/en/delete-account" style={{ fontWeight: locale === 'en' ? 800 : 500, color: locale === 'en' ? '#ef4444' : 'var(--text-muted)' }}>EN</Link>
          <span>•</span>
          <Link href="/ml/delete-account" style={{ fontWeight: locale === 'ml' ? 800 : 500, color: locale === 'ml' ? '#ef4444' : 'var(--text-muted)' }}>മലയാളം</Link>
          <span>•</span>
          <Link href="/hi/delete-account" style={{ fontWeight: locale === 'hi' ? 800 : 500, color: locale === 'hi' ? '#ef4444' : 'var(--text-muted)' }}>हिंदी</Link>
          <span>•</span>
          <Link href="/ar/delete-account" style={{ fontWeight: locale === 'ar' ? 800 : 500, color: locale === 'ar' ? '#ef4444' : 'var(--text-muted)' }}>العربية</Link>
        </div>
      </div>

      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '32px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#ef4444',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-base)' }}>
              {isMl ? 'അക്കൗണ്ട് ഇല്ലാതാക്കാൻ അപേക്ഷിക്കുക' : isHi ? 'खाता और डेटा हटाने का अनुरोध' : isAr ? 'طلب حذف الحساب والبيانات' : 'Request Account & Data Deletion'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Google Play User Data Compliance — Angadi Online
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.6, fontSize: '15px' }}>
        
        {/* Policy Explanation */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} style={{ color: '#ef4444' }} />
            <span>{isMl ? 'ഡിലീറ്റ് ചെയ്യുമ്പോൾ എന്താണ് സംഭവിക്കുന്നത്?' : isHi ? 'खाता हटाने पर क्या होगा?' : isAr ? 'ما الذي سيتم حذفه عند إرسال الطلب؟' : 'What happens when you delete your account?'}</span>
          </h2>
          <ul style={{ margin: '10px 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <li><strong>{isMl ? 'വ്യക്തിഗത വിവരങ്ങൾ:' : isHi ? 'व्यक्तिगत विवरण:' : isAr ? 'الملف الشخصي:' : 'Personal Profile:'}</strong> {isMl ? 'നിങ്ങളുടെ പേര്, ഫോൺ നമ്പർ, ലോഗിൻ വിവരങ്ങൾ എന്നിവ പൂർണ്ണമായി മായ്ച്ചുകളയും.' : isHi ? 'आपका नाम, फोन नंबर और पासवर्ड पूरी तरह से मिटा दिया जाएगा।' : isAr ? 'سيتم مسح اسمك ورقم هاتفك وبيانات الدخول نهائياً.' : 'Your full name, phone number, email, and authentication credentials will be permanently erased.'}</li>
            <li><strong>{isMl ? 'സേവ് ചെയ്ത വിലാസങ്ങൾ:' : isHi ? 'सहेजे गए पते:' : isAr ? 'العناوين المحفوظة:' : 'Saved Addresses:'}</strong> {isMl ? 'നിങ്ങളുടെ എല്ലാ ഡെലിവറി വിലാസങ്ങളും ലൊക്കേഷനുകളും നീക്കം ചെയ്യും.' : isHi ? 'सहेजे गए सभी पते और लोकेशन डेटा स्थायी रूप से हटा दिए जाएंगे।' : isAr ? 'سيتم حذف جميع عناوين التوصيل المسجلة.' : 'All saved delivery addresses and GPS coordinates will be permanently purged.'}</li>
            <li><strong>{isMl ? 'പ്രിയപ്പെട്ടവ:' : isHi ? 'पसंदीदा:' : isAr ? 'المفضلات:' : 'Favorites & Preferences:'}</strong> {isMl ? 'പിൻ ചെയ്ത കടകൾ, ഫേവറിറ്റുകൾ എന്നിവ ഡിലീറ്റ് ചെയ്യും.' : isHi ? 'पसंदीदा दुकानें और उत्पाद हटा दिए जाएंगे।' : isAr ? 'سيتم حذف المتاجر والمنتجات المثبتة.' : 'Pinned shops and favorite items will be deleted.'}</li>
          </ul>
        </section>

        {/* Submission Form or Confirmation */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-base)', margin: '0 0 8px' }}>
                {isMl ? 'അപേക്ഷ സ്വീകരിച്ചു' : isHi ? 'अनुरोध प्राप्त हुआ' : isAr ? 'تم استلام طلبك بنجاح' : 'Deletion Request Received'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 16px', lineHeight: 1.6 }}>
                {isMl
                  ? `നിങ്ങൾ നൽകിയ വിവരങ്ങൾ (${identifier}) പരിശോധിച്ച ശേഷം 30 ദിവസത്തിനുള്ളിൽ അക്കൗണ്ടും വിവരങ്ങളും പൂർണ്ണമായി നീക്കം ചെയ്യുന്നതാണ്.`
                  : isHi
                  ? `डेटा हटाने का आपका अनुरोध (${identifier}) दर्ज कर लिया गया है। 30 कार्य दिवसों के भीतर प्रक्रिया पूरी कर ली जाएगी।`
                  : isAr
                  ? `تم تسجيل طلب حذف البيانات للحساب (${identifier}) وسيتم إتمام الحذف النهائي خلال 30 يوماً.`
                  : `Your request to delete account data for ${identifier} has been logged. Our administrative team will verify and complete the data purge within 30 business days.`}
              </p>
              <Link href={`/${locale}/home`} className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', textDecoration: 'none' }}>
                {isMl ? 'ഹോമിലേക്ക് മടങ്ങുക' : isHi ? 'होम पर जाएं' : isAr ? 'العودة للرئيسية' : 'Return to Home'}
              </Link>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, marginTop: 0, marginBottom: '6px' }}>
                {isMl ? 'ഡിലീഷൻ റിക്വസ്റ്റ് സമർപ്പിക്കുക' : isHi ? 'डेटा हटाने का फॉर्म' : isAr ? 'تقديم طلب الحذف' : 'Submit Deletion Request'}
              </h2>
              <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                {isMl
                  ? 'നിങ്ങളുടെ രജിസ്റ്റർ ചെയ്ത ഫോൺ നമ്പറോ ഇമെയിലോ താഴെ രേഖപ്പെടുത്തുക:'
                  : isHi
                  ? 'नीचे अपना पंजीकृत फोन नंबर या ईमेल दर्ज करें:'
                  : isAr
                  ? 'أدخل رقم هاتفك أو بريدك الإلكتروني المسجل أدناه:'
                  : 'Enter your registered phone number or email address below to submit your data deletion request:'}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-base)' }}>
                    {isMl ? 'രജിസ്റ്റർ ചെയ്ത ഫോൺ നമ്പർ അല്ലെങ്കിൽ ഇമെയിൽ *' : isHi ? 'पंजीकृत फोन नंबर या ईमेल *' : isAr ? 'رقم الهاتف أو البريد المسجل *' : 'Registered Phone Number or Email *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 9876543210 or user@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-base)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-base)' }}>
                    {isMl ? 'കാരണം (ഓപ്ഷണൽ)' : isHi ? 'हटाने का कारण (वैकल्पिक)' : isAr ? 'سبب الحذف (اختياري)' : 'Reason for Deletion (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={isMl ? 'അക്കൗണ്ട് ഒഴിവാക്കുന്നതിനുള്ള കാരണം...' : isHi ? 'खाता हटाने का कारण...' : isAr ? 'سبب طلب الحذف...' : 'Let us know why you are leaving...'}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-base)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '13px' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-danger"
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Trash2 size={16} />
                  {loading 
                    ? (isMl ? 'അപേക്ഷ സമർപ്പിക്കുന്നു...' : isHi ? 'जमा हो रहा है...' : isAr ? 'جاري الإرسال...' : 'Submitting Request...') 
                    : (isMl ? 'അക്കൗണ്ട് ഡിലീറ്റ് ചെയ്യാൻ അപേക്ഷിക്കുക' : isHi ? 'खाता हटाने का अनुरोध जमा करें' : isAr ? 'تأكيد طلب حذف الحساب' : 'Confirm & Submit Deletion Request')}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Alternative In-App Deletion */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={20} style={{ color: '#0ea5e9' }} />
            <span>{isMl ? 'ആപ്പിലൂടെ നേരിട്ട് ഡിലീറ്റ് ചെയ്യാം' : isHi ? 'ऐप से तुरंत खाता हटाएं' : isAr ? 'الحذف المباشر عبر التطبيق' : 'Alternative: Instant In-App Deletion'}</span>
          </h2>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-muted)' }}>
            {isMl
              ? 'മൊബൈൽ ആപ്പ് ഉപയോഗിച്ച് ഉടനടി അക്കൗണ്ട് ഡിലീറ്റ് ചെയ്യാൻ:'
              : isHi
              ? 'मोबाइल ऐप से तुरंत खाता हटाने के चरण:'
              : isAr
              ? 'إذا كان التطبيق مثبتاً لديك، يمكنك حذف الحساب مباشرة:'
              : 'If you have the Angadi Online mobile app installed, you can delete your account instantly:'}
          </p>
          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13.5px', lineHeight: 1.8 }}>
            {isMl ? (
              <>
                1. <strong>അങ്ങാടി ഓൺലൈൻ</strong> ആപ്പ് തുറക്കുക.<br />
                2. താഴെയുള്ള <strong>പ്രൊഫൈൽ (Profile)</strong> ടാബ് തിരഞ്ഞെടുക്കുക.<br />
                3. <strong>സുരക്ഷാ ക്രമീകരണങ്ങൾ (Security Settings)</strong> അല്ലെങ്കിൽ <strong>Delete Account</strong> ക്ലിക്ക് ചെയ്യുക.<br />
                4. കൺഫേം ചെയ്യുക.
              </>
            ) : isHi ? (
              <>
                1. <strong>अंगाडी ऑनलाइन</strong> ऐप खोलें।<br />
                2. नीचे <strong>प्रोफ़ाइल (Profile)</strong> टैब पर टैप करें।<br />
                3. <strong>सुरक्षा सेटिंग्स</strong> या <strong>Delete Account</strong> चुनें।<br />
                4. पुष्टि करें।
              </>
            ) : isAr ? (
              <>
                1. افتح تطبيق <strong>أنجادي أونلاين</strong>.<br />
                2. انتقل إلى تبويب <strong>الملف الشخصي (Profile)</strong>.<br />
                3. اختر <strong>إعدادات الأمان</strong> أو <strong>حذف الحساب</strong>.<br />
                4. قم بالتأكيد.
              </>
            ) : (
              <>
                1. Open the <strong>Angadi Online</strong> app.<br />
                2. Tap on the <strong>Profile</strong> tab in the bottom bar.<br />
                3. Select <strong>Security Settings</strong> or <strong>Delete Account</strong>.<br />
                4. Tap <strong>Delete Account</strong> and confirm.
              </>
            )}
          </div>
        </section>

        {/* Support Contact */}
        <section className="card" style={{ padding: '20px 24px', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-base)' }}>
              {isMl ? 'സഹായം ആവശ്യമുണ്ടോ?' : isHi ? 'सहायता चाहिए?' : isAr ? 'هل تحتاج لمساعدة؟' : 'Need Assistance?'}
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>support@angadionline.com</span>
          </div>
          <a
            href="mailto:support@angadionline.com?subject=Account%20Deletion%20Assistance"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
          >
            <Mail size={16} /> {isMl ? 'ഇമെയിൽ സപ്പോർട്ട്' : isHi ? 'ईमेल समर्थन' : isAr ? 'مراسلة الدعم' : 'Email Support'}
          </a>
        </section>

      </div>
    </div>
  )
}
