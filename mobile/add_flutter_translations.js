const fs = require('fs');
const path = require('path');

const l10nDir = path.join(__dirname, 'lib', 'l10n');

const flutterTranslations = {
  en: {
    orderSuccessSubtitle: "Thank you for your order! The shop vendor has been notified and is preparing your delivery.",
    estimatedDeliveryLabel: "Est. Delivery:",
    estimatedDeliveryValue: "Within 30–45 mins",
    orderIdCopiedToast: "Order ID copied to clipboard!"
  },
  ml: {
    orderSuccessSubtitle: "നിങ്ങളുടെ ഓർഡറിന് നന്ദി! കടയുടമയെ വിവരമറിയിച്ചിട്ടുണ്ട്, നിങ്ങളുടെ സാധനങ്ങൾ തയ്യാറാക്കുകയാണ്.",
    estimatedDeliveryLabel: "പ്രതീക്ഷിക്കുന്ന ഡെലിവറി:",
    estimatedDeliveryValue: "30-45 മിനിറ്റിനുള്ളിൽ",
    orderIdCopiedToast: "ഓർഡർ ഐഡി പകർത്തി!"
  },
  ar: {
    orderSuccessSubtitle: "شكرا لطلبك! تم إخطار البائع وجاري تجهيز التوصيل.",
    estimatedDeliveryLabel: "التوصيل المتوقع:",
    estimatedDeliveryValue: "خلال 30-45 دقيقة",
    orderIdCopiedToast: "تم نسخ رقم الطلب!"
  },
  hi: {
    orderSuccessSubtitle: "आपके ऑर्डर के लिए धन्यवाद! विक्रेता को सूचित कर दिया गया है और आपकी डिलीवरी तैयार की जा रही है।",
    estimatedDeliveryLabel: "अनुमानित डिलीवरी:",
    estimatedDeliveryValue: "30-45 मिनट के भीतर",
    orderIdCopiedToast: "ऑर्डर आईडी कॉपी की गई!"
  }
};

['en', 'ml', 'ar', 'hi'].forEach(lang => {
  const filePath = path.join(l10nDir, `app_${lang}.arb`);
  let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  Object.assign(content, flutterTranslations[lang]);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Updated mobile/lib/l10n/app_${lang}.arb`);
});
