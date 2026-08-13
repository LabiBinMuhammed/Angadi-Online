const fs = require('fs');
const path = require('path');

const l10nDir = path.join(__dirname, 'lib', 'l10n');

const translations = {
  en: {
    shopOwnersTitle: "Shop Owners / Co-Owners",
    coOwnersDesc: "Collaborate up to 3 owners on a single shop with full vendor access.",
    addCoOwnerBtn: "+ Add Co-Owner",
    addCoOwnerModalTitle: "Add Shop Co-Owner (Max 3)",
    selectRegisteredUser: "Select Registered User",
    maxOwnersReached: "Max 3 Owners Limit Reached",
    cannotRemoveOnlyOwner: "Cannot remove the only owner of a shop.",
    confirmRemoveCoOwner: "Are you sure you want to remove this co-owner?",
    coOwnerAddedSuccess: "Co-owner added successfully!",
    coOwnerRemovedSuccess: "Co-owner removed successfully!"
  },
  ml: {
    shopOwnersTitle: "കട ഉടമസ്ഥർ / സഹ-ഉടമകൾ",
    coOwnersDesc: "ഒരു കടയിൽ പരമാവധി 3 ഉടമകൾക്ക് ഒന്നിച്ച് പ്രവർത്തിക്കാം.",
    addCoOwnerBtn: "+ സഹ-ഉടമയെ ചേർക്കുക",
    addCoOwnerModalTitle: "കട സഹ-ഉടമയെ ചേർക്കുക (പരമാവധി 3)",
    selectRegisteredUser: "രജിസ്റ്റർ ചെയ്ത ഉപയോക്താവിനെ തിരഞ്ഞെടുക്കുക",
    maxOwnersReached: "പരമാവധി 3 ഉടമകളുടെ പരിധിയിലെത്തി",
    cannotRemoveOnlyOwner: "കടയുടെ ഏക ഉടമയെ നീക്കം ചെയ്യാൻ കഴിയില്ല.",
    confirmRemoveCoOwner: "ഈ സഹ-ഉടമയെ നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?",
    coOwnerAddedSuccess: "സഹ-ഉടമയെ വിജയകരമായി ചേർത്തു!",
    coOwnerRemovedSuccess: "സഹ-ഉടമയെ വിജയകരമായി നീക്കം ചെയ്തു!"
  },
  ar: {
    shopOwnersTitle: "مالكو المتاجر / المالكين المشاركين",
    coOwnersDesc: "التعاون مع ما يصل إلى 3 مالكين في متجر واحد مع صلاحيات كاملة.",
    addCoOwnerBtn: "+ إضافة مالك مشارك",
    addCoOwnerModalTitle: "إضافة مالك مشارك للمتجر (حد أقصى 3)",
    selectRegisteredUser: "اختر مستخدم مسجل",
    maxOwnersReached: "تم الوصول إلى الحد الأقصى 3 مالكين",
    cannotRemoveOnlyOwner: "لا يمكن إزالة المالك الوحيد للمتجر.",
    confirmRemoveCoOwner: "هل أنت تأكد من إزالة هذا المالك المشارك؟",
    coOwnerAddedSuccess: "تمت إضافة المالك المشارك بنجاح!",
    coOwnerRemovedSuccess: "تمت إزالة المالك المشارك بنجاح!"
  },
  hi: {
    shopOwnersTitle: "दुकान के मालिक / सह-मालिक",
    coOwnersDesc: "एक ही दुकान पर अधिकतम 3 मालिक मिलकर काम कर सकते हैं।",
    addCoOwnerBtn: "+ सह-मालिक जोड़ें",
    addCoOwnerModalTitle: "दुकान सह-मालिक जोड़ें (अधिकतम 3)",
    selectRegisteredUser: "पंजीकृत उपयोगकर्ता चुनें",
    maxOwnersReached: "अधिकतम 3 मालिकों की सीमा पूरी हुई",
    cannotRemoveOnlyOwner: "दुकान के एकमात्र मालिक को हटाया नहीं जा सकता।",
    confirmRemoveCoOwner: "क्या आप इस सह-मालिक को हटाना चाहते हैं?",
    coOwnerAddedSuccess: "सह-मालिक सफलतापूर्वक जोड़ा गया!",
    coOwnerRemovedSuccess: "सह-मालिक सफलतापूर्वक हटाया गया!"
  }
};

['en', 'ml', 'ar', 'hi'].forEach(lang => {
  const filePath = path.join(l10nDir, `app_${lang}.arb`);
  let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  Object.assign(content, translations[lang]);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Updated mobile/lib/l10n/app_${lang}.arb`);
});
