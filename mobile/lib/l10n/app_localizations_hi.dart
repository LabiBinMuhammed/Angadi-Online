// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class AppLocalizationsHi extends AppLocalizations {
  AppLocalizationsHi([String locale = 'hi']) : super(locale);

  @override
  String get appTitle => 'विलेज मार्केट';

  @override
  String get navHome => 'होम';

  @override
  String get navOrders => 'ऑर्डर';

  @override
  String get navCart => 'कार्ट';

  @override
  String get navProfile => 'प्रोफ़ाइल';

  @override
  String get navSettings => 'सेटिंग्स';

  @override
  String get searchPlaceholder => 'उत्पाद खोजें...';

  @override
  String get addToCart => 'कार्ट में जोड़ें';

  @override
  String get buyNow => 'अभी खरीदें';

  @override
  String get save => 'सहेजें';

  @override
  String get cancel => 'रद्द करें';

  @override
  String get edit => 'संपादित करें';

  @override
  String get delete => 'हटाएं';

  @override
  String get signOut => 'साइन आउट';

  @override
  String get settingsTitle => 'सेटिंग्स';

  @override
  String get languagePreference => 'भाषा वरीयता';

  @override
  String get themeMode => 'थीम मोड';

  @override
  String get darkMode => 'डार्क मोड';

  @override
  String get lightMode => 'लाइट मोड';

  @override
  String get cashOnDelivery => 'कैश ऑन डिलीवरी';

  @override
  String get creditPayment => 'क्रेडिट भुगतान';

  @override
  String get placeOrder => 'ऑर्डर दें';

  @override
  String get totalPrice => 'कुल मूल्य';

  @override
  String get orderStatusPending => 'लंबित';

  @override
  String get orderStatusPacking => 'पैकिंग';

  @override
  String get orderStatusDelivering => 'वितरण जारी';

  @override
  String get orderStatusDelivered => 'वितरित';

  @override
  String get orderStatusCancelled => 'रद्द';

  @override
  String get heyGreeting => 'नमस्ते';

  @override
  String get findGroceriesSubtitle => 'अपनी पसंद का ताज़ा सामान ढूँढें';

  @override
  String get searchShopsPlaceholder => 'दुकानें खोजें...';

  @override
  String get searchItemsPlaceholder => 'सामान खोजें...';

  @override
  String get noShopsFound => 'कोई दुकान नहीं मिली।';

  @override
  String get noItemsFound => 'कोई आइटम नहीं मिला।';

  @override
  String get productsLabel => 'उत्पाद';

  @override
  String get categoriesTitle => 'श्रेणियाँ';

  @override
  String get clearLabel => 'साफ करें';

  @override
  String get popularTitle => 'लोकप्रिय';

  @override
  String get shopItemsTitle => 'दुकान के सामान';

  @override
  String get addButtonLabel => 'जोड़ें';

  @override
  String get bestOrganic => 'सर्वोत्तम जैविक ताजी सब्जियां';

  @override
  String get greatDeals => 'फलों पर शानदार डील्स';

  @override
  String addingToCartMessage(String name) {
    return '$name को कार्ट में जोड़ा जा रहा है...';
  }

  @override
  String addedToCartMessage(String name) {
    return '$name कार्ट में जोड़ा गया!';
  }

  @override
  String get deliverySchedule => 'वितरण अनुसूची';

  @override
  String get changeDate => 'तारीख बदलें';

  @override
  String get morning => 'सुबह';

  @override
  String get evening => 'शाम';

  @override
  String get myBag => 'मेरा बैग';

  @override
  String get yourBagIsEmpty => 'आपका बैग खाली है';

  @override
  String get browseShops => 'दुकानें देखें';

  @override
  String get total => 'कुल';

  @override
  String get proceedToCheckout => 'चेकआउट के लिए आगे बढ़ें';

  @override
  String get cutoffPassed => 'समय सीमा समाप्त';

  @override
  String get limitReached => 'सीमा समाप्त';

  @override
  String get unavailable => 'अनुपलब्ध';

  @override
  String itemsCount(int count) {
    return '$count सामान';
  }

  @override
  String get exploreCategoriesSubtitle =>
      'श्रेणी के अनुसार ताज़ा उत्पादों का अन्वेषण करें';

  @override
  String get searchCategoriesPlaceholder => 'श्रेणियाँ खोजें...';

  @override
  String get noCategoriesFound => 'कोई श्रेणी नहीं मिली';

  @override
  String productsAvailable(int count) {
    return '$count उत्पाद उपलब्ध हैं';
  }

  @override
  String get noItemsInCategory => 'इस श्रेणी में अभी तक कोई उत्पाद नहीं है।';

  @override
  String get checkoutTitle => 'चेकआउट';

  @override
  String get deliveryAddressTitle => 'वितरण का पता';

  @override
  String get selectAddressLabel => 'पता चुनें';

  @override
  String get changeAddressLabel => 'पता बदलें';

  @override
  String get addNewAddressLabel => 'नया पता जोड़ें';

  @override
  String get noAddressesFound => 'कोई पता नहीं मिला।';

  @override
  String get contactNameLabel => 'संपर्क नाम *';

  @override
  String get fullNamePlaceholder => 'पूरा नाम';

  @override
  String get contactPhoneLabel => 'संपर्क फ़ोन *';

  @override
  String get addressLine1Label => 'पता पंक्ति 1 *';

  @override
  String get addressLine1Placeholder => 'गली, इमारत, मकान नंबर';

  @override
  String get addressLine2Label => 'पता पंक्ति 2 (वैकल्पिक)';

  @override
  String get addressLine2Placeholder => 'अपार्टमेंट, मंजिल, इकाई';

  @override
  String get landmarkLabel => 'सीमाचिह्न (वैकल्पिक)';

  @override
  String get landmarkPlaceholder => 'जैसे, सिटी मॉल के पास';

  @override
  String get saveToAddressBook => 'मेरी पता पुस्तिका में सहेजें';

  @override
  String get closeButton => 'बंद करें';

  @override
  String get backButton => 'पीछे';

  @override
  String get useAddressButton => 'इस पते का उपयोग करें';

  @override
  String get thisTimeOnlyLabel => 'केवल इस बार';

  @override
  String get noAddressSelected => 'कोई पता नहीं चुना गया';

  @override
  String get deliveryScheduleTitle => 'वितरण अनुसूची';

  @override
  String get paymentMethodTitle => 'भुगतान विधि';

  @override
  String get orderSummaryTitle => 'ऑर्डर सारांश';

  @override
  String get totalAmountTitle => 'कुल राशि';

  @override
  String get placeOrderButton => 'ऑर्डर दें';

  @override
  String get fillRequiredFieldsError => 'कृपया सभी आवश्यक (*) फ़ील्ड भरें।';

  @override
  String orderPlacementFailed(String error) {
    return 'ऑर्डर देने में विफल: $error';
  }

  @override
  String get orderPlacedTitle => 'ऑर्डर दे दिया गया!';

  @override
  String orderIdLabel(String orderId) {
    return 'ऑर्डर #$orderId';
  }

  @override
  String get orderReceivedSubtitle =>
      'आपका ऑर्डर प्राप्त हो गया है और जल्द ही पैक किया जाएगा।';

  @override
  String get viewMyOrdersButton => 'मेरे ऑर्डर देखें';

  @override
  String get continueShoppingButton => 'खरीदारी जारी रखें';

  @override
  String get guestUser => 'अतिथि';

  @override
  String failedToLoadHomeData(String error) {
    return 'होम डेटा लोड करने में विफल: $error';
  }

  @override
  String get productLabel => 'उत्पाद';

  @override
  String removedFromFavoritesMessage(String name) {
    return '$name पसंदीदा से हटा दिया गया';
  }

  @override
  String addedToFavoritesMessage(String name) {
    return '$name पसंदीदा में जोड़ा गया';
  }

  @override
  String get failedToUpdateFavoriteStatus =>
      'पसंदीदा स्थिति अपडेट करने में विफल';

  @override
  String get pinLimitReached =>
      'आप केवल 3 दुकानों को पिन कर सकते हैं। कृपया पहले एक दुकान को अनपिन करें।';

  @override
  String unpinnedSuccessfully(String name) {
    return '$name सफलतापूर्वक अनपिन किया गया';
  }

  @override
  String pinnedSuccessfully(String name) {
    return '$name सफलतापूर्वक पिन किया गया';
  }

  @override
  String get failedToUpdatePinStatus => 'पिन स्थिति अपडेट करने में विफल';

  @override
  String get shopReviewsTooltip => 'दुकान की समीक्षा और प्रतिक्रिया';

  @override
  String productsCount(int count) {
    return '$count उत्पाद';
  }

  @override
  String get selectOption => 'विकल्प चुनें';

  @override
  String get quantityLabel => 'मात्रा';

  @override
  String get addedToCartLabel => 'कार्ट में जोड़ा गया';

  @override
  String get addToCartLabel => 'कार्ट में जोड़ें';

  @override
  String get notificationsTitle => 'सूचनाएं';

  @override
  String get noNotificationsYet => 'अभी तक कोई सूचना नहीं है';

  @override
  String get orderNotificationPlaced => 'आपका ऑर्डर दे दिया गया है';

  @override
  String get orderNotificationPreparing => 'दुकान आपका ऑर्डर तैयार कर रही है';

  @override
  String get orderNotificationOnWay => 'आपका ऑर्डर रास्ते में है!';

  @override
  String get orderNotificationDelivered =>
      'ऑर्डर सफलतापूर्वक वितरित किया गया 🎉';

  @override
  String get orderNotificationCancelled => 'ऑर्डर रद्द कर दिया गया था';

  @override
  String minutesAgo(int count) {
    return '$count मिनट पहले';
  }

  @override
  String hoursAgo(int count) {
    return '$count घंटे पहले';
  }

  @override
  String daysAgo(int count) {
    return '$count दिन पहले';
  }

  @override
  String reviewShopTitle(String shopName) {
    return '$shopName की समीक्षा करें';
  }

  @override
  String get rateYourExperienceTitle => 'अपने अनुभव को रेट करें';

  @override
  String rateExperienceSubtitle(String shopName) {
    return 'कृपया $shopName से अपने ऑर्डर के निम्नलिखित पहलुओं को रेट करें।';
  }

  @override
  String get productQualityRatingLabel => 'उत्पाद की गुणवत्ता';

  @override
  String get productQualityRatingSub => 'उत्पादों की गुणवत्ता कैसी थी?';

  @override
  String get productQualityRatingHint =>
      'ताज़ा उत्पाद, अच्छी गुणवत्ता, असली सामान...';

  @override
  String get deliveryTimelinessRatingLabel => 'वितरण समयबद्धता';

  @override
  String get deliveryTimelinessRatingSub =>
      'क्या आपका ऑर्डर समय पर डिलीवर हुआ था?';

  @override
  String get deliveryTimelinessRatingHint =>
      'सुबह की डिलीवरी समय पर आई...\nशाम की डिलीवरी में देरी हुई...';

  @override
  String get orderAccuracyRatingLabel => 'ऑर्डर की सटीकता';

  @override
  String get orderAccuracyRatingSub =>
      'क्या आपको वही मिला जो आपने ऑर्डर किया था?';

  @override
  String get orderAccuracyRatingHint => 'सही सामान, सही मात्रा, सही प्रकार...';

  @override
  String get overallExperienceRatingLabel => 'समग्र अनुभव';

  @override
  String get overallExperienceRatingSub =>
      'हमें अपने समग्र अनुभव के बारे में बताएं।';

  @override
  String get overallExperienceRatingHint =>
      'अनुकूल सेवा, शानदार अनुभव, फिर से ऑर्डर करेंगे...';

  @override
  String get calculatedAverageLabel => 'परिकलित औसत:';

  @override
  String get submitReviewButton => 'समीक्षा सबमिट करें';

  @override
  String get reviewSubmittedSuccess => 'समीक्षा सफलतापूर्वक सबमिट की गई!';

  @override
  String reviewSubmittedFailed(String error) {
    return 'समीक्षा सबमिट करने में विफल: $error';
  }

  @override
  String get myOrdersTitle => 'मेरे ऑर्डर';

  @override
  String get noOrdersYet => 'अभी तक कोई ऑर्डर नहीं है';

  @override
  String get noOrdersSubtitle =>
      'आपने अभी तक कोई ऑर्डर नहीं दिया है। अपना इतिहास यहाँ देखने के लिए खरीदारी शुरू करें।';

  @override
  String get todayLabel => 'आज';

  @override
  String get last7DaysLabel => 'पिछले 7 दिन';

  @override
  String get last30DaysLabel => 'पिछले 30 दिन';

  @override
  String get allTimeLabel => 'हमेशा';

  @override
  String get allSlotsLabel => 'सभी स्लॉट';

  @override
  String get morningSlotLabel => '☀️ सुबह का स्लॉट';

  @override
  String get eveningSlotLabel => '🌙 शाम का स्लॉट';

  @override
  String get pendingStatus => 'लंबित';

  @override
  String get acceptedStatus => 'स्वीकृत';

  @override
  String get readyForDeliveryStatus => 'वितरण के लिए तैयार';

  @override
  String get outForDeliveryStatus => 'वितरण के लिए बाहर';

  @override
  String get onTheWayStatus => 'रास्ते में';

  @override
  String get deliveredStatus => 'वितरित';

  @override
  String get cancelledStatus => 'रद्द';

  @override
  String get morningTimeLabel => '☀️ सुबह';

  @override
  String get eveningTimeLabel => '🌙 शाम';

  @override
  String deliverOnLabel(String date) {
    return 'वितरण तिथि: $date';
  }

  @override
  String get orderDetailAddressSection => '📍 वितरण का पता';

  @override
  String get orderDetailItemsSection => '🧾 सामान';

  @override
  String get orderDetailReviewSection => '⭐ आपकी समीक्षा';

  @override
  String get leaveShopReviewButton => 'दुकान की समीक्षा लिखें';

  @override
  String nearLandmarkLabel(String landmark) {
    return 'निकट: $landmark';
  }

  @override
  String get myAddressesTitle => 'मेरे पते';

  @override
  String get addAddressButton => 'पता जोड़ें';

  @override
  String get noAddressesSaved => 'कोई पता सहेजा नहीं गया है';

  @override
  String get defaultAddressBadge => 'डिफ़ॉल्ट';

  @override
  String get editAddressTitle => 'पता संपादित करें';

  @override
  String get labelFieldTitle => 'लेबल';

  @override
  String get labelHome => 'घर';

  @override
  String get labelWork => 'काम';

  @override
  String get labelOther => 'अन्य';

  @override
  String get fieldRequiredValidation => 'आवश्यक';

  @override
  String get pinMyLocationButton => 'मेरा स्थान पिन करें (OSM)';

  @override
  String get mapPickerComingSoon =>
      'मानचित्र चयनकर्ता जल्द ही आ रहा है (OpenStreetMap)';

  @override
  String get setAsDefaultAddress => 'डिफ़ॉल्ट पते के रूप में सेट करें';

  @override
  String get updateAddressButton => 'पता अपडेट करें';

  @override
  String get favoriteProductsTitle => 'पसंदीदा उत्पाद';

  @override
  String get noFavoritesYet => 'अभी तक कोई पसंदीदा नहीं है';

  @override
  String get noFavoritesSubtitle =>
      'इसे यहाँ सहेजने के लिए किसी भी उत्पाद पर दिल के आइकन पर टैप करें';

  @override
  String get browseProductsButton => 'उत्पाद ब्राउज़ करें';

  @override
  String outOfStockMessage(String name) {
    return '$name अभी स्टॉक में नहीं है';
  }

  @override
  String get platformFeedbackTitle => 'प्लेटफ़ॉर्म प्रतिक्रिया';

  @override
  String get submitFeedbackTab => 'प्रतिक्रिया भेजें';

  @override
  String get feedbackHistoryTab => 'प्रतिक्रिया का इतिहास';

  @override
  String get valueFeedbackHeader => 'हम आपकी प्रतिक्रिया को महत्व देते हैं';

  @override
  String get feedbackInstruction =>
      'यदि आपको कोई बग मिला है, किसी सुविधा का अनुरोध करना चाहते हैं, या प्लेटफ़ॉर्म को बेहतर बनाने के लिए सुझाव हैं, तो हमें बताएं।';

  @override
  String get feedbackTypeLabel => 'प्रतिक्रिया का प्रकार';

  @override
  String get suggestionOption => 'सुझाव';

  @override
  String get complaintOption => 'शिकायत';

  @override
  String get bugReportOption => 'बग रिपोर्ट';

  @override
  String get featureRequestOption => 'सुविधा का अनुरोध';

  @override
  String get generalOption => 'सामान्य';

  @override
  String get rateExperienceHeader => 'आप अपने अनुभव को कैसे रेट करेंगे?';

  @override
  String get yourMessageLabel => 'आपका संदेश';

  @override
  String get feedbackPlaceholder => 'अपनी प्रतिक्रिया का विवरण यहाँ लिखें...';

  @override
  String get enterMessageError => 'कृपया अपना संदेश दर्ज करें';

  @override
  String get messageLengthError => 'संदेश कम से कम 10 वर्णों का होना चाहिए';

  @override
  String get feedbackSubmittedSuccess =>
      'प्रतिक्रिया सफलतापूर्वक सबमिट की गई! धन्यवाद।';

  @override
  String get noFeedbackHistory => 'अभी तक कोई प्रतिक्रिया सबमिट नहीं की गई है';

  @override
  String get pinnedShopsTitle => 'पिन की गई दुकानें';

  @override
  String get noPinnedShopsYet => 'अभी तक कोई दुकान पिन नहीं की गई है';

  @override
  String get noPinnedShopsSubtitle =>
      'त्वरित पहुंच के लिए पसंदीदा दुकानों को पिन करें';

  @override
  String get guestUserLabel => 'अतिथि उपयोगकर्ता';

  @override
  String get myProfileTitle => 'मेरा प्रोफ़ाइल';

  @override
  String get noPhoneNumberLabel => 'कोई फ़ोन नंबर नहीं';

  @override
  String get personalInfoSection => 'व्यक्तिगत जानकारी';

  @override
  String get emailLabel => 'ईमेल';

  @override
  String get genderLabel => 'लिंग';

  @override
  String get birthdayLabel => 'जन्मदिन';

  @override
  String get languageLabel => 'भाषा';

  @override
  String get preferencesSection => 'प्राथमिकताएं';

  @override
  String get recentPurchasesLabel => 'हाल ही की खरीदारी';

  @override
  String get purchaseHistoryLabel => 'खरीद इतिहास';

  @override
  String get platformFeedbackLabel => 'प्लेटफ़ॉर्म प्रतिक्रिया';

  @override
  String get managementSection => 'प्रबंधन';

  @override
  String get vendorPanelLabel => 'विक्रेता पैनल';

  @override
  String get vendorPanelSubtitle => 'अपनी दुकान और ऑर्डर प्रबंधित करें';

  @override
  String get adminPanelLabel => 'एडमिन पैनल';

  @override
  String get adminPanelSubtitle => 'सिस्टम प्रशासन';

  @override
  String get searchHistoryPlaceholder => 'ऑर्डर नंबर, दुकान, उत्पाद खोजें...';

  @override
  String get noHistoryFound => 'कोई खरीद इतिहास नहीं मिला';

  @override
  String get noHistorySubtitle =>
      'अपने फ़िल्टर या खोज क्वेरी को बदलने का प्रयास करें';

  @override
  String get csvButtonLabel => 'CSV';

  @override
  String get reportButtonLabel => 'रिपोर्ट';

  @override
  String get noOrdersToExport => 'निर्यात करने के लिए कोई ऑर्डर नहीं';

  @override
  String get csvCopiedSuccess =>
      'खरीद इतिहास CSV क्लिपबोर्ड पर कॉपी किया गया! आप इसे फ़ाइल के रूप में सहेज सकते हैं।';

  @override
  String get reportCopiedSuccess =>
      'ऑर्डर इतिहास रिपोर्ट क्लिपबोर्ड पर कॉपी की गई! साझा करने के लिए तैयार है।';

  @override
  String get totalLabel => 'कुल';

  @override
  String get viewDetailsButton => 'विवरण देखें';

  @override
  String get searchPurchasesPlaceholder => 'खरीदारी खोजें...';

  @override
  String get sevenDaysFilter => '7 दिन';

  @override
  String get thirtyDaysFilter => '30 दिन';

  @override
  String get ninetyDaysFilter => '90 दिन';

  @override
  String get mostRecentSort => 'सबसे हाल का';

  @override
  String get mostOrderedSort => 'सबसे अधिक ऑर्डर किया गया';

  @override
  String get noRecentPurchases => 'कोई हाल की खरीद नहीं';

  @override
  String get noRecentPurchasesSubtitle => 'खरीदारी शुरू करें';

  @override
  String get reorderButton => 'फिर से ऑर्डर करें';

  @override
  String get outOfStockLabel => 'स्टॉक से बाहर';

  @override
  String get searchShopsHint => 'दुकानें खोजें...';

  @override
  String get searchForShopsLabel => 'दुकानों की खोज करें';

  @override
  String get recentSearchesTitle => 'हाल ही का';

  @override
  String get clearButtonLabel => 'साफ़ करें';

  @override
  String get noShopsFoundMessage => 'कोई दुकान नहीं मिली';

  @override
  String get generalStoreFallback => 'जनरल स्टोर';

  @override
  String get catalogTab => 'कैटलॉग';

  @override
  String get reviewsTab => 'समीक्षाएं';

  @override
  String get noItemsInShop => 'इस दुकान में कोई सामान नहीं है';

  @override
  String get noReviewsYet => 'अभी तक कोई समीक्षा नहीं है';

  @override
  String get noReviewsSubtitle =>
      'इस दुकान की समीक्षा करने वाले पहले ग्राहक बनें।';

  @override
  String get writeFirstReviewButton => 'पहली समीक्षा लिखें';

  @override
  String get reviewsTitle => 'समीक्षाएं';

  @override
  String get verifiedPurchaseBadge => 'सत्यापित खरीद';

  @override
  String get anonymousReviewer => 'अनाम';

  @override
  String get runPreparedSuccess =>
      'वितरण रन सफलतापूर्वक तैयार! ऑर्डर लिंक किए गए।';

  @override
  String runPreparedFailed(String error) {
    return 'रन तैयार करने में विफल: $error';
  }

  @override
  String runUpdatedMessage(String status) {
    return 'रन अपडेट किया गया: $status';
  }

  @override
  String runUpdatedFailed(String error) {
    return 'रन अपडेट करने में विफल: $error';
  }

  @override
  String get deliveryRunsManagementTitle => 'वितरण रन प्रबंधन';

  @override
  String get runNotStarted => 'शुरू नहीं हुआ';

  @override
  String get runPrepare => 'रन तैयार करें';

  @override
  String get runPacking => 'पैकिंग';

  @override
  String get runStartDelivery => 'वितरण शुरू करें';

  @override
  String get runOutForDelivery => 'वितरण के लिए बाहर';

  @override
  String get runComplete => 'रन पूरा करें';

  @override
  String get runCompleted => 'पूरा हुआ';

  @override
  String get ordersCountLabel => 'ऑर्डर';

  @override
  String get runValueLabel => 'मूल्य';

  @override
  String get viewOrdersButton => 'ऑर्डर देखें';

  @override
  String get vendorPanelTitle => 'विक्रेता पैनल';

  @override
  String get welcomeBackTo => 'में आपका स्वागत है ';

  @override
  String get viewMyShopButton => 'मेरी दुकान देखें';

  @override
  String get quickActionsTitle => 'त्वरित कार्रवाई';

  @override
  String get addNewProductAction => 'नया उत्पाद जोड़ें';

  @override
  String get viewProductsAction => 'उत्पाद देखें';

  @override
  String get manageOrdersAction => 'ऑर्डर प्रबंधित करें';

  @override
  String get commissionStatsAction => 'कमीशन आंकड़े';

  @override
  String get customerCreditAction => 'ग्राहक क्रेडिट';

  @override
  String get shopSettingsAction => 'दुकान सेटिंग्स';

  @override
  String get vendorPortalTitle => 'विक्रेता पोर्टल';

  @override
  String get vendorDrawerDashboard => 'डैशबोर्ड';

  @override
  String get vendorDrawerAllProducts => 'सभी उत्पाद';

  @override
  String get vendorDrawerAddProduct => 'उत्पाद जोड़ें';

  @override
  String get vendorDrawerOrders => 'ऑर्डर';

  @override
  String get vendorDrawerCustomerCredit => 'ग्राहक क्रेडिट';

  @override
  String get vendorDrawerCommissions => 'कमीशन';

  @override
  String get vendorDrawerMyShops => 'मेरी दुकानें';

  @override
  String get backToMarketplace => 'मार्केटप्लेस पर वापस जाएं';

  @override
  String get itemMarkedLive => 'उत्पाद अब लाइव है';

  @override
  String get itemMarkedHidden => 'उत्पाद अब छिपा हुआ है';

  @override
  String get deleteProductDialogTitle => 'उत्पाद हटाएं';

  @override
  String deleteProductDialogMessage(String name) {
    return 'क्या आप \"$name\" को हमेशा के लिए हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।';
  }

  @override
  String get productDeletedSuccess => 'उत्पाद सफलतापूर्वक हटा दिया गया';

  @override
  String get manageProductsTitle => 'उत्पाद प्रबंधित करें';

  @override
  String get searchProductsPlaceholder => 'नाम से उत्पाद खोजें...';

  @override
  String get filterAll => 'सभी';

  @override
  String get filterLive => 'लाइव';

  @override
  String get filterDraft => 'ड्राफ्ट';

  @override
  String get filterInactive => 'निष्क्रिय';

  @override
  String get noProductsFound => 'कोई उत्पाद नहीं मिला';

  @override
  String get statusDraft => 'ड्राफ्ट';

  @override
  String get statusIncomplete => 'अपूर्ण';

  @override
  String get statusReady => 'तैयार';

  @override
  String get statusHidden => 'छिपा हुआ';

  @override
  String get statusRejected => 'अस्वीकृत';

  @override
  String get statusOutOfStock => 'स्टॉक से बाहर';

  @override
  String get deactivateTooltip => 'निष्क्रिय करें';

  @override
  String get goLiveTooltip => 'लाइव करें';

  @override
  String get vendorManageOrdersTitle => 'ऑर्डर प्रबंधित करें';

  @override
  String get resetDateButton => 'तारीख रीसेट करें';

  @override
  String get allStatusesFilter => 'सभी स्थितियाँ';

  @override
  String vendorDeliverOnLabel(String date) {
    return 'वितरण तिथि: $date';
  }

  @override
  String get vendorNoOrders => 'अभी तक कोई ऑर्डर नहीं है';

  @override
  String vendorNoStatusOrders(String status) {
    return 'कोई $status ऑर्डर नहीं मिला';
  }

  @override
  String get orderTimelineTitle => 'ऑर्डर टाइमलाइन';

  @override
  String get orderedItemsTitle => 'ऑर्डर किए गए सामान';

  @override
  String get totalFinalPriceTitle => 'कुल अंतिम मूल्य';

  @override
  String get cancelOrderButton => 'ऑर्डर रद्द करें';

  @override
  String get shopCreatedSuccess => 'दुकान सफलतापूर्वक बनाई गई!';

  @override
  String shopCreatedFailed(String error) {
    return 'दुकान बनाने में विफल: $error';
  }

  @override
  String get vendorShopsTitle => 'दुकान सेटिंग्स';

  @override
  String get shopProfileSection => 'दुकान प्रोफ़ाइल';

  @override
  String get manageShopSettingsSubtitle =>
      'अपनी दुकान के विवरण और सेटिंग्स प्रबंधित करें';

  @override
  String get setupShopSubtitle =>
      'बेचना शुरू करने के लिए अपनी दुकान स्थापित करें';

  @override
  String get yourShopsTitle => 'आपकी दुकानें';

  @override
  String get orderNotificationsTitle => 'ऑर्डर सूचनाएं';

  @override
  String get orderNotificationsSubtitle => 'सभी ऑर्डर अपडेट के लिए सक्षम';

  @override
  String get appVersionTitle => 'ऐप संस्करण';

  @override
  String get failedToAddToCart => 'कार्ट में जोड़ने में विफल';

  @override
  String failedToLoadOrderDetails(String error) {
    return 'ऑर्डर विवरण लोड करने में विफल: $error';
  }

  @override
  String failedToLoadHistory(String error) {
    return 'इतिहास लोड करने में विफल: $error';
  }

  @override
  String failedToSubmitFeedback(String error) {
    return 'प्रतिक्रिया सबमिट करने में विफल: $error';
  }

  @override
  String failedToLoadReviews(String error) {
    return 'समीक्षाएं लोड करने में विफल: $error';
  }
}
