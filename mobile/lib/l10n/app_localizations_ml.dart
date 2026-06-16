// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Malayalam (`ml`).
class AppLocalizationsMl extends AppLocalizations {
  AppLocalizationsMl([String locale = 'ml']) : super(locale);

  @override
  String get appTitle => 'വില്ലേജ് മാർക്കറ്റ്';

  @override
  String get navHome => 'ഹോം';

  @override
  String get navOrders => 'ഓർഡറുകൾ';

  @override
  String get navCart => 'ബാഗ്';

  @override
  String get navProfile => 'പ്രൊഫൈൽ';

  @override
  String get navSettings => 'ക്രമീകരണങ്ങൾ';

  @override
  String get searchPlaceholder => 'ഉൽപ്പന്നങ്ങൾ തിരയുക...';

  @override
  String get addToCart => 'കാർട്ടിലേക്ക് ചേർക്കുക';

  @override
  String get buyNow => 'ഇപ്പോൾ വാങ്ങുക';

  @override
  String get save => 'സംരക്ഷിക്കുക';

  @override
  String get cancel => 'റദ്ദാക്കുക';

  @override
  String get edit => 'തിരുത്തുക';

  @override
  String get delete => 'ഇല്ലാതാക്കുക';

  @override
  String get signOut => 'പുറത്തുകടക്കുക';

  @override
  String get settingsTitle => 'ക്രമീകരണങ്ങൾ';

  @override
  String get languagePreference => 'ഭാഷാ മുൻഗണന';

  @override
  String get themeMode => 'തീം';

  @override
  String get darkMode => 'ഡാർക്ക് മോഡ്';

  @override
  String get lightMode => 'ലൈറ്റ് മോഡ്';

  @override
  String get cashOnDelivery => 'ക്യാഷ് ഓൺ ഡെലിവറി';

  @override
  String get creditPayment => 'ക്രെഡിറ്റ് പേയ്‌മെന്റ്';

  @override
  String get placeOrder => 'ഓർഡർ ചെയ്യുക';

  @override
  String get totalPrice => 'ആകെ തുക';

  @override
  String get orderStatusPending => 'തീരുമാനമാകാത്തത്';

  @override
  String get orderStatusPacking => 'പാക്കിംഗ്';

  @override
  String get orderStatusDelivering => 'ഡെലിവറി ചെയ്യുന്നു';

  @override
  String get orderStatusDelivered => 'ഡെലിവറി ചെയ്തത്';

  @override
  String get orderStatusCancelled => 'റദ്ദാക്കിയത്';

  @override
  String get heyGreeting => 'ഹലോ';

  @override
  String get findGroceriesSubtitle =>
      'നിങ്ങൾക്ക് ആവശ്യമുള്ള പുതിയ പലചരക്ക് സാധനങ്ങൾ കണ്ടെത്തുക';

  @override
  String get searchShopsPlaceholder => 'കടകൾ തിരയുക...';

  @override
  String get searchItemsPlaceholder => 'സാധനങ്ങൾ തിരയുക...';

  @override
  String get noShopsFound => 'കടകളൊന്നും കണ്ടെത്തിയില്ല.';

  @override
  String get noItemsFound => 'ഇനങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല.';

  @override
  String get productsLabel => 'ഉൽപ്പന്നങ്ങൾ';

  @override
  String get categoriesTitle => 'വിഭാഗങ്ങൾ';

  @override
  String get clearLabel => 'ഒഴിവാക്കുക';

  @override
  String get popularTitle => 'ജനപ്രിയമായവ';

  @override
  String get shopItemsTitle => 'കടയിലെ സാധനങ്ങൾ';

  @override
  String get addButtonLabel => 'ചേർക്കുക';

  @override
  String get bestOrganic => 'മികച്ച ഓർഗാനിക് പച്ചക്കറികൾ';

  @override
  String get greatDeals => 'പഴങ്ങൾക്ക് മികച്ച ഓഫറുകൾ';

  @override
  String addingToCartMessage(String name) {
    return '$name കാർട്ടിലേക്ക് ചേർക്കുന്നു...';
  }

  @override
  String addedToCartMessage(String name) {
    return '$name കാർട്ടിലേക്ക് ചേർത്തു!';
  }

  @override
  String get deliverySchedule => 'ഡെലിവറി ഷെഡ്യൂൾ';

  @override
  String get changeDate => 'തീയതി മാറ്റുക';

  @override
  String get morning => 'രാവിലെ';

  @override
  String get evening => 'വൈകുന്നേരം';

  @override
  String get myBag => 'എന്റെ ബാഗ്';

  @override
  String get yourBagIsEmpty => 'നിങ്ങളുടെ ബാഗ് ശൂന്യമാണ്';

  @override
  String get browseShops => 'കടകൾ കാണുക';

  @override
  String get total => 'ആകെ';

  @override
  String get proceedToCheckout => 'ചെക്ക്ഔട്ടിലേക്ക് പോവുക';

  @override
  String get cutoffPassed => 'സമയപരിധി കഴിഞ്ഞു';

  @override
  String get limitReached => 'പരിധി കഴിഞ്ഞു';

  @override
  String get unavailable => 'ലഭ്യമല്ല';

  @override
  String itemsCount(int count) {
    return '$count ഇനങ്ങൾ';
  }

  @override
  String get exploreCategoriesSubtitle =>
      'വിഭാഗങ്ങൾ അനുസരിച്ച് പുതിയ ഉൽപ്പന്നങ്ങൾ കണ്ടെത്തുക';

  @override
  String get searchCategoriesPlaceholder => 'വിഭാഗങ്ങൾ തിരയുക...';

  @override
  String get noCategoriesFound => 'വിഭാഗങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല';

  @override
  String productsAvailable(int count) {
    return '$count ഉൽപ്പന്നങ്ങൾ ലഭ്യമാണ്';
  }

  @override
  String get noItemsInCategory => 'ഈ വിഭാഗത്തിൽ ഇതുവരെ ഇനങ്ങൾ ഒന്നുമില്ല.';

  @override
  String get checkoutTitle => 'ചെക്ക്ഔട്ട്';

  @override
  String get deliveryAddressTitle => 'ഡെലിവറി വിലാസം';

  @override
  String get selectAddressLabel => 'വിലാസം തിരഞ്ഞെടുക്കുക';

  @override
  String get changeAddressLabel => 'വിലാസം മാറ്റുക';

  @override
  String get addNewAddressLabel => 'പുതിയ വിലാസം ചേർക്കുക';

  @override
  String get noAddressesFound => 'വിലാസങ്ങളൊന്നും കണ്ടെത്തിയില്ല.';

  @override
  String get contactNameLabel => 'ബന്ധപ്പെടേണ്ട വ്യക്തിയുടെ പേര് *';

  @override
  String get fullNamePlaceholder => 'മുഴുവൻ പേര്';

  @override
  String get contactPhoneLabel => 'ബന്ധപ്പെടേണ്ട ഫോൺ നമ്പർ *';

  @override
  String get addressLine1Label => 'വിലാസ വരി 1 *';

  @override
  String get addressLine1Placeholder => 'തെരുവ്, കെട്ടിടം, വീട്ടു നമ്പർ';

  @override
  String get addressLine2Label => 'വിലാസ വരി 2 (ഓപ്ഷണൽ)';

  @override
  String get addressLine2Placeholder => 'അപ്പാർട്ട്മെന്റ്, ഫ്ലോർ, യൂണിറ്റ്';

  @override
  String get landmarkLabel => 'അടയാളം (ഓപ്ഷണൽ)';

  @override
  String get landmarkPlaceholder => 'ഉദാഹരണത്തിന്, സിറ്റി മാളിന് സമീപം';

  @override
  String get saveToAddressBook => 'എന്റെ വിലാസ പുസ്തകത്തിൽ സംരക്ഷിക്കുക';

  @override
  String get closeButton => 'അടയ്ക്കുക';

  @override
  String get backButton => 'പിന്നിലേക്ക്';

  @override
  String get useAddressButton => 'ഈ വിലാസം ഉപയോഗിക്കുക';

  @override
  String get thisTimeOnlyLabel => 'ഈ തവണ മാത്രം';

  @override
  String get noAddressSelected => 'വിലാസമൊന്നും തിരഞ്ഞെടുത്തിട്ടില്ല';

  @override
  String get deliveryScheduleTitle => 'ഡെലിവറി ഷെഡ്യൂൾ';

  @override
  String get paymentMethodTitle => 'പേയ്മെന്റ് രീതി';

  @override
  String get orderSummaryTitle => 'ഓർഡർ സംഗ്രഹം';

  @override
  String get totalAmountTitle => 'ആകെ തുക';

  @override
  String get placeOrderButton => 'ഓർഡർ ചെയ്യുക';

  @override
  String get fillRequiredFieldsError =>
      'ദയവായി ആവശ്യമായ (*) ഫീൽഡുകൾ പൂരിപ്പിക്കുക.';

  @override
  String orderPlacementFailed(String error) {
    return 'ഓർഡർ സമർപ്പിക്കാൻ കഴിഞ്ഞില്ല: $error';
  }

  @override
  String get orderPlacedTitle => 'ഓർഡർ സമർപ്പിച്ചു!';

  @override
  String orderIdLabel(String orderId) {
    return 'ഓർഡർ #$orderId';
  }

  @override
  String get orderReceivedSubtitle =>
      'നിങ്ങളുടെ ഓർഡർ ലഭിച്ചു, ഉടൻ തന്നെ പാക്ക് ചെയ്യുന്നതാണ്.';

  @override
  String get viewMyOrdersButton => 'എന്റെ ഓർഡറുകൾ കാണുക';

  @override
  String get continueShoppingButton => 'ഷോപ്പിംഗ് തുടരുക';

  @override
  String get guestUser => 'അതിഥി';

  @override
  String failedToLoadHomeData(String error) {
    return 'ഹോം ഡാറ്റ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല: $error';
  }

  @override
  String get productLabel => 'ഉൽപ്പന്നം';

  @override
  String removedFromFavoritesMessage(String name) {
    return '$name പ്രിയപ്പെട്ടവയിൽ നിന്നും ഒഴിവാക്കി';
  }

  @override
  String addedToFavoritesMessage(String name) {
    return '$name പ്രിയപ്പെട്ടവയിൽ ചേർത്തു';
  }

  @override
  String get failedToUpdateFavoriteStatus =>
      'പ്രിയപ്പെട്ട സ്റ്റാറ്റസ് അപ്ഡേറ്റ് ചെയ്യാൻ കഴിഞ്ഞില്ല';

  @override
  String get pinLimitReached =>
      'നിങ്ങൾക്ക് 3 കടകൾ വരെ മാത്രമേ പിൻ ചെയ്യാൻ കഴിയൂ. ദയവായി ഒരു കട ആദ്യം അൺപിൻ ചെയ്യുക.';

  @override
  String unpinnedSuccessfully(String name) {
    return '$name വിജയകരമായി അൺപിൻ ചെയ്തു';
  }

  @override
  String pinnedSuccessfully(String name) {
    return '$name വിജയകരമായി പിൻ ചെയ്തു';
  }

  @override
  String get failedToUpdatePinStatus =>
      'പിൻ സ്റ്റാറ്റസ് അപ്ഡേറ്റ് ചെയ്യാൻ കഴിഞ്ഞില്ല';

  @override
  String get shopReviewsTooltip => 'കടയുടെ അവലോകനങ്ങളും ഫീഡ്‌ബാക്കും';

  @override
  String productsCount(int count) {
    return '$count ഉൽപ്പന്നങ്ങൾ';
  }

  @override
  String get selectOption => 'ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക';

  @override
  String get quantityLabel => 'അളവ്';

  @override
  String get addedToCartLabel => 'കാർട്ടിലേക്ക് ചേർത്തു';

  @override
  String get addToCartLabel => 'കാർട്ടിലേക്ക് ചേർക്കുക';

  @override
  String get notificationsTitle => 'അറിയിപ്പുകൾ';

  @override
  String get noNotificationsYet => 'അറിയിപ്പുകൾ ഒന്നുമില്ല';

  @override
  String get orderNotificationPlaced => 'നിങ്ങളുടെ ഓർഡർ സമർപ്പിച്ചു';

  @override
  String get orderNotificationPreparing => 'കട നിങ്ങളുടെ ഓർഡർ തയ്യാറാക്കുന്നു';

  @override
  String get orderNotificationOnWay =>
      'നിങ്ങളുടെ ഓർഡർ എത്തിക്കൊണ്ടിരിക്കുന്നു!';

  @override
  String get orderNotificationDelivered => 'ഓർഡർ വിജയകരമായി ഡെലിവറി ചെയ്തു 🎉';

  @override
  String get orderNotificationCancelled => 'ഓർഡർ റദ്ദാക്കി';

  @override
  String minutesAgo(int count) {
    return '$count മിനിറ്റ് മുമ്പ്';
  }

  @override
  String hoursAgo(int count) {
    return '$count മണിക്കൂർ മുമ്പ്';
  }

  @override
  String daysAgo(int count) {
    return '$count ദിവസം മുമ്പ്';
  }

  @override
  String reviewShopTitle(String shopName) {
    return '$shopName അവലോകനം ചെയ്യുക';
  }

  @override
  String get rateYourExperienceTitle => 'നിങ്ങളുടെ അനുഭവം വിലയിരുത്തുക';

  @override
  String rateExperienceSubtitle(String shopName) {
    return '$shopName-ൽ നിന്നുള്ള നിങ്ങളുടെ ഓർഡറിന്റെ താഴെ പറയുന്ന കാര്യങ്ങൾ വിലയിരുത്തുക.';
  }

  @override
  String get productQualityRatingLabel => 'ഉൽപ്പന്നത്തിന്റെ ഗുണനിലവാരം';

  @override
  String get productQualityRatingSub =>
      'ഉൽപ്പന്നങ്ങളുടെ ഗുണനിലവാരം എങ്ങനെ ഉണ്ടായിരുന്നു?';

  @override
  String get productQualityRatingHint =>
      'പുതിയ ഉൽപ്പന്നങ്ങൾ, നല്ല ഗുണനിലവാരം, യഥാർത്ഥ സാധനങ്ങൾ...';

  @override
  String get deliveryTimelinessRatingLabel => 'ഡെലിവറി കൃത്യസമയത്ത് ആയോ';

  @override
  String get deliveryTimelinessRatingSub =>
      'നിങ്ങളുടെ ഓർഡർ കൃത്യസമയത്ത് ലഭിച്ചോ?';

  @override
  String get deliveryTimelinessRatingHint =>
      'രാവിലത്തെ ഡെലിവറി കൃത്യസമയത്ത് ലഭിച്ചു...\nവൈകുന്നേരത്തെ ഡെലിവറി വൈകി...';

  @override
  String get orderAccuracyRatingLabel => 'ഓർഡറിന്റെ കൃത്യത';

  @override
  String get orderAccuracyRatingSub =>
      'നിങ്ങൾ ഓർഡർ ചെയ്തത് തന്നെയാണോ ലഭിച്ചത്?';

  @override
  String get orderAccuracyRatingHint =>
      'ശരിയായ ഇനങ്ങൾ, ശരിയായ അളവ്, ശരിയായ വകഭേദങ്ങൾ...';

  @override
  String get overallExperienceRatingLabel => 'മൊത്തത്തിലുള്ള അനുഭവം';

  @override
  String get overallExperienceRatingSub =>
      'നിങ്ങളുടെ മൊത്തത്തിലുള്ള അനുഭവത്തെക്കുറിച്ച് പറയുക.';

  @override
  String get overallExperienceRatingHint =>
      'സൗഹൃദപരമായ സേവനം, മികച്ച അനുഭവം, വീണ്ടും ഓർഡർ ചെയ്യും...';

  @override
  String get calculatedAverageLabel => 'കണക്കാക്കിയ ശരാശരി:';

  @override
  String get submitReviewButton => 'അവലോകനം സമർപ്പിക്കുക';

  @override
  String get reviewSubmittedSuccess => 'അവലോകനം വിജയകരമായി സമർപ്പിച്ചു!';

  @override
  String reviewSubmittedFailed(String error) {
    return 'അവലോകനം സമർപ്പിക്കുന്നതിൽ പരാജയപ്പെട്ടു: $error';
  }

  @override
  String get myOrdersTitle => 'എന്റെ ഓർഡറുകൾ';

  @override
  String get noOrdersYet => 'ഓർഡറുകൾ ഇതുവരെയില്ല';

  @override
  String get noOrdersSubtitle =>
      'നിങ്ങൾ ഇതുവരെ ഓർഡറുകളൊന്നും നൽകിയിട്ടില്ല. നിങ്ങളുടെ ചരിത്രം ഇവിടെ കാണാൻ ഷോപ്പിംഗ് ആരംഭിക്കുക.';

  @override
  String get todayLabel => 'ഇന്ന്';

  @override
  String get last7DaysLabel => 'കഴിഞ്ഞ 7 ദിവസങ്ങൾ';

  @override
  String get last30DaysLabel => 'കഴിഞ്ഞ 30 ദിവസങ്ങൾ';

  @override
  String get allTimeLabel => 'എല്ലാ സമയവും';

  @override
  String get allSlotsLabel => 'എല്ലാ സ്ലോട്ടുകളും';

  @override
  String get morningSlotLabel => '☀️ രാവിലത്തെ സ്ലോട്ട്';

  @override
  String get eveningSlotLabel => '🌙 വൈകുന്നേരത്തെ സ്ലോട്ട്';

  @override
  String get pendingStatus => 'തീരുമാനമാകാത്തത്';

  @override
  String get acceptedStatus => 'സ്വീകരിച്ചത്';

  @override
  String get readyForDeliveryStatus => 'ഡെലിവറിക്ക് തയ്യാറാണ്';

  @override
  String get outForDeliveryStatus => 'ഡെലിവറിക്കായി പുറപ്പെട്ടു';

  @override
  String get onTheWayStatus => 'വഴിയിലാണ്';

  @override
  String get deliveredStatus => 'ഡെലിവറി ചെയ്തത്';

  @override
  String get cancelledStatus => 'റദ്ദാക്കിയത്';

  @override
  String get morningTimeLabel => '☀️ രാവിലെ';

  @override
  String get eveningTimeLabel => '🌙 വൈകുന്നേരം';

  @override
  String deliverOnLabel(String date) {
    return 'ഡെലിവറി തീയതി: $date';
  }

  @override
  String get orderDetailAddressSection => '📍 ഡെലിവറി വിലാസം';

  @override
  String get orderDetailItemsSection => '🧾 ഇനങ്ങൾ';

  @override
  String get orderDetailReviewSection => '⭐ നിങ്ങളുടെ അവലോകനം';

  @override
  String get leaveShopReviewButton => 'കടയെക്കുറിച്ച് അവലോകനം എഴുതുക';

  @override
  String nearLandmarkLabel(String landmark) {
    return 'അടുത്ത്: $landmark';
  }

  @override
  String get myAddressesTitle => 'എന്റെ വിലാസങ്ങൾ';

  @override
  String get addAddressButton => 'വിലാസം ചേർക്കുക';

  @override
  String get noAddressesSaved => 'വിലാസങ്ങളൊന്നും സംരക്ഷിച്ചിട്ടില്ല';

  @override
  String get defaultAddressBadge => 'സ്ഥിരമായുള്ളത്';

  @override
  String get editAddressTitle => 'വിലാസം തിരുത്തുക';

  @override
  String get labelFieldTitle => 'ലേബൽ';

  @override
  String get labelHome => 'വീട്';

  @override
  String get labelWork => 'ഓഫീസ്';

  @override
  String get labelOther => 'മറ്റുള്ളവ';

  @override
  String get fieldRequiredValidation => 'ആവശ്യമാണ്';

  @override
  String get pinMyLocationButton => 'എന്റെ ലൊക്കേഷൻ പിൻ ചെയ്യുക (OSM)';

  @override
  String get mapPickerComingSoon => 'മാപ്പ് പിക്കർ ഉടൻ വരുന്നു (OpenStreetMap)';

  @override
  String get setAsDefaultAddress => 'സ്ഥിര വിലാസമാക്കുക';

  @override
  String get updateAddressButton => 'വിലാസം പുതുക്കുക';

  @override
  String get favoriteProductsTitle => 'പ്രിയപ്പെട്ട ഉൽപ്പന്നങ്ങൾ';

  @override
  String get noFavoritesYet => 'പ്രിയപ്പെട്ടവ ഒന്നുമില്ല';

  @override
  String get noFavoritesSubtitle =>
      'ഏതെങ്കിലും ഉൽപ്പന്നത്തിൽ കാണുന്ന ഹൃദയ ചിഹ്നത്തിൽ ടാപ്പ് ചെയ്ത് അത് ഇവിടെ സംരക്ഷിക്കുക';

  @override
  String get browseProductsButton => 'ഉൽപ്പന്നങ്ങൾ കാണുക';

  @override
  String outOfStockMessage(String name) {
    return '$name ഇപ്പോൾ സ്റ്റോക്കിൽ ഇല്ല';
  }

  @override
  String get platformFeedbackTitle => 'പ്ലാറ്റ്ഫോം ഫീഡ്‌ബാക്ക്';

  @override
  String get submitFeedbackTab => 'ഫീഡ്‌ബാക്ക് സമർപ്പിക്കുക';

  @override
  String get feedbackHistoryTab => 'ഫീഡ്‌ബാക്ക് ചരിത്രം';

  @override
  String get valueFeedbackHeader =>
      'നിങ്ങളുടെ ഫീഡ്‌ബാക്ക് ഞങ്ങൾ വിലമതിക്കുന്നു';

  @override
  String get feedbackInstruction =>
      'എന്തെങ്കിലും ബഗ് കണ്ടെത്തുകയോ, പുതിയ ഫീച്ചർ ആവശ്യപ്പെടുകയോ, അല്ലെങ്കിൽ പ്ലാറ്റ്ഫോം മെച്ചപ്പെടുത്തുന്നതിനുള്ള നിർദ്ദേശങ്ങൾ നൽകുകയോ ചെയ്യാം.';

  @override
  String get feedbackTypeLabel => 'ഫീഡ്‌ബാക്ക് തരം';

  @override
  String get suggestionOption => 'നിർദ്ദേശം';

  @override
  String get complaintOption => 'പരാതി';

  @override
  String get bugReportOption => 'ബഗ് റിപ്പോർട്ട്';

  @override
  String get featureRequestOption => 'ഫീച്ചർ റിക്വസ്റ്റ്';

  @override
  String get generalOption => 'പൊതുവായത്';

  @override
  String get rateExperienceHeader => 'നിങ്ങളുടെ അനുഭവം എങ്ങനെ വിലയിരുത്തുന്നു?';

  @override
  String get yourMessageLabel => 'നിങ്ങളുടെ സന്ദേശം';

  @override
  String get feedbackPlaceholder =>
      'നിങ്ങളുടെ ഫീഡ്‌ബാക്ക് വിശദമായി ഇവിടെ വിവരിക്കുക...';

  @override
  String get enterMessageError => 'ദയവായി നിങ്ങളുടെ സന്ദേശം നൽകുക';

  @override
  String get messageLengthError => 'സന്ദേശത്തിന് കുറഞ്ഞത് 10 അക്ഷരങ്ങൾ വേണം';

  @override
  String get feedbackSubmittedSuccess =>
      'ഫീഡ്‌ബാക്ക് വിജയകരമായി സമർപ്പിച്ചു! നന്ദി.';

  @override
  String get noFeedbackHistory =>
      'ഫീഡ്‌ബാക്കുകളൊന്നും ഇതുവരെ സമർപ്പിച്ചിട്ടില്ല';

  @override
  String get pinnedShopsTitle => 'പിൻ ചെയ്ത കടകൾ';

  @override
  String get noPinnedShopsYet => 'പിൻ ചെയ്ത കടകൾ ഒന്നുമില്ല';

  @override
  String get noPinnedShopsSubtitle =>
      'വേഗത്തിലുള്ള ആക്‌സസിനായി പ്രിയപ്പെട്ട കടകൾ പിൻ ചെയ്യുക';

  @override
  String get guestUserLabel => 'അതിഥി ഉപയോക്താവ്';

  @override
  String get myProfileTitle => 'എന്റെ പ്രൊഫൈൽ';

  @override
  String get noPhoneNumberLabel => 'ഫോൺ നമ്പർ ഇല്ല';

  @override
  String get personalInfoSection => 'വ്യക്തിഗത വിവരങ്ങൾ';

  @override
  String get emailLabel => 'ഇമെയിൽ';

  @override
  String get genderLabel => 'ലിംഗഭേദം';

  @override
  String get birthdayLabel => 'ജന്മദിനം';

  @override
  String get languageLabel => 'ഭാഷ';

  @override
  String get preferencesSection => 'മുൻഗണനകൾ';

  @override
  String get recentPurchasesLabel => 'സമീപകാല വാങ്ങലുകൾ';

  @override
  String get purchaseHistoryLabel => 'വാങ്ങൽ ചരിത്രം';

  @override
  String get platformFeedbackLabel => 'ഫീഡ്‌ബാക്ക്';

  @override
  String get managementSection => 'മാനേജ്‌മെന്റ്';

  @override
  String get vendorPanelLabel => 'വിൽപ്പനക്കാരന്റെ പാനൽ';

  @override
  String get vendorPanelSubtitle => 'നിങ്ങളുടെ കടയും ഓർഡറുകളും നിയന്ത്രിക്കുക';

  @override
  String get adminPanelLabel => 'അഡ്മിൻ പാനൽ';

  @override
  String get adminPanelSubtitle => 'സിസ്റ്റം അഡ്മിനിസ്ട്രേഷൻ';

  @override
  String get searchHistoryPlaceholder => 'ഓർഡർ നമ്പർ, കട, ഉൽപ്പന്നം തിരയുക...';

  @override
  String get noHistoryFound => 'വാങ്ങൽ ചരിത്രം ഒന്നും കണ്ടെത്തിയില്ല';

  @override
  String get noHistorySubtitle => 'ഫിൽട്ടറുകളോ തിരയലോ മാറ്റി നോക്കുക';

  @override
  String get csvButtonLabel => 'സി.എസ്.വി';

  @override
  String get reportButtonLabel => 'റിപ്പോർട്ട്';

  @override
  String get noOrdersToExport => 'കയറ്റുമതി ചെയ്യാൻ ഓർഡറുകൾ ഒന്നുമില്ല';

  @override
  String get csvCopiedSuccess =>
      'വാങ്ങൽ ചരിത്രം CSV ക്ലിപ്പ്ബോർഡിലേക്ക് പകർത്തി! നിങ്ങൾക്ക് ഇത് പേസ്റ്റ് ചെയ്ത് സേവ് ചെയ്യാം.';

  @override
  String get reportCopiedSuccess =>
      'ഓർഡർ ചരിത്ര റിപ്പോർട്ട് ക്ലിപ്പ്ബോർഡിലേക്ക് പകർത്തി! പ്രിന്റ് ചെയ്യാനോ പങ്കുവെക്കാനോ തയ്യാറാണ്.';

  @override
  String get totalLabel => 'ആകെ';

  @override
  String get viewDetailsButton => 'വിശദാംശങ്ങൾ കാണുക';

  @override
  String get searchPurchasesPlaceholder => 'വാങ്ങലുകൾ തിരയുക...';

  @override
  String get sevenDaysFilter => '7 ദിവസങ്ങൾ';

  @override
  String get thirtyDaysFilter => '30 ദിവസങ്ങൾ';

  @override
  String get ninetyDaysFilter => '90 ദിവസങ്ങൾ';

  @override
  String get mostRecentSort => 'ഏറ്റവും പുതിയത്';

  @override
  String get mostOrderedSort => 'കൂടുതൽ ഓർഡർ ചെയ്തത്';

  @override
  String get noRecentPurchases => 'സമീപകാല വാങ്ങലുകൾ ഒന്നുമില്ല';

  @override
  String get noRecentPurchasesSubtitle =>
      'ചരിത്രം നിർമ്മിക്കാൻ ഷോപ്പിംഗ് ആരംഭിക്കുക';

  @override
  String get reorderButton => 'വീണ്ടും ഓർഡർ ചെയ്യുക';

  @override
  String get outOfStockLabel => 'സ്റ്റോക്കില്ല';

  @override
  String get searchShopsHint => 'കടകൾ തിരയുക…';

  @override
  String get searchForShopsLabel => 'കടകൾക്കായി തിരയുക';

  @override
  String get recentSearchesTitle => 'സമീപകാല തിരച്ചിലുകൾ';

  @override
  String get clearButtonLabel => 'ഒഴിവാക്കുക';

  @override
  String get noShopsFoundMessage => 'കടകളൊന്നും കണ്ടെത്തിയില്ല';

  @override
  String get generalStoreFallback => 'ജനറൽ സ്റ്റോർ';

  @override
  String get catalogTab => 'കാറ്റലോഗ്';

  @override
  String get reviewsTab => 'അവലോകനങ്ങൾ';

  @override
  String get noItemsInShop => 'ഈ കടയിൽ ഇനങ്ങൾ ഒന്നുമില്ല';

  @override
  String get noReviewsYet => 'അവലോകനങ്ങൾ ഒന്നുമില്ല';

  @override
  String get noReviewsSubtitle =>
      'ഈ കടയെ അവലോകനം ചെയ്യുന്ന ആദ്യത്തെ ഉപഭോക്താവാകൂ.';

  @override
  String get writeFirstReviewButton => 'ആദ്യ അവലോകനം എഴുതുക';

  @override
  String get reviewsTitle => 'അവലോകനങ്ങൾ';

  @override
  String get verifiedPurchaseBadge => 'സ്ഥിരീകരിച്ച വാങ്ങൽ';

  @override
  String get anonymousReviewer => 'അജ്ഞാതനായ ഉപയോക്താവ്';

  @override
  String get runPreparedSuccess =>
      'റൺ വിജയകരമായി തയ്യാറാക്കി! ഓർഡറുകൾ ലിങ്ക് ചെയ്തു.';

  @override
  String runPreparedFailed(String error) {
    return 'റൺ തയ്യാറാക്കാൻ കഴിഞ്ഞില്ല: $error';
  }

  @override
  String runUpdatedMessage(String status) {
    return 'റൺ പുതുക്കി: $status';
  }

  @override
  String runUpdatedFailed(String error) {
    return 'റൺ പുതുക്കാൻ കഴിഞ്ഞില്ല: $error';
  }

  @override
  String get deliveryRunsManagementTitle => 'ഡെലിവറി റൺസ് മാനേജ്‌മെന്റ്';

  @override
  String get runNotStarted => 'ആരംഭിച്ചിട്ടില്ല';

  @override
  String get runPrepare => 'റൺ തയ്യാറാക്കുക';

  @override
  String get runPacking => 'പാക്കിംഗ്';

  @override
  String get runStartDelivery => 'ഡെലിവറി ആരംഭിക്കുക';

  @override
  String get runOutForDelivery => 'ഡെലിവറിക്കായി പുറപ്പെട്ടു';

  @override
  String get runComplete => 'റൺ പൂർത്തിയാക്കുക';

  @override
  String get runCompleted => 'പൂർത്തിയായി';

  @override
  String get ordersCountLabel => 'ഓർഡറുകൾ';

  @override
  String get runValueLabel => 'മൂല്യം';

  @override
  String get viewOrdersButton => 'ഓർഡറുകൾ കാണുക';

  @override
  String get vendorPanelTitle => 'വിൽപ്പനക്കാരന്റെ പാനൽ';

  @override
  String get welcomeBackTo => 'ലേക്ക് വീണ്ടും സ്വാഗതം ';

  @override
  String get viewMyShopButton => 'എന്റെ കട കാണുക';

  @override
  String get quickActionsTitle => 'ദ്രുത നടപടികൾ';

  @override
  String get addNewProductAction => 'പുതിയ ഉൽപ്പന്നം ചേർക്കുക';

  @override
  String get viewProductsAction => 'ഉൽപ്പന്നങ്ങൾ കാണുക';

  @override
  String get manageOrdersAction => 'ഓർഡറുകൾ നിയന്ത്രിക്കുക';

  @override
  String get commissionStatsAction => 'കമ്മീഷൻ സ്ഥിതിവിവരക്കണക്കുകൾ';

  @override
  String get customerCreditAction => 'ഉപഭോക്തൃ ക്രെഡിറ്റ്';

  @override
  String get shopSettingsAction => 'കടയുടെ ക്രമീകരണങ്ങൾ';

  @override
  String get vendorPortalTitle => 'വിൽപ്പനക്കാരന്റെ പോർട്ടൽ';

  @override
  String get vendorDrawerDashboard => 'ഡാഷ്‌ബോർഡ്';

  @override
  String get vendorDrawerAllProducts => 'എല്ലാ ഉൽപ്പന്നങ്ങളും';

  @override
  String get vendorDrawerAddProduct => 'ഉൽപ്പന്നം ചേർക്കുക';

  @override
  String get vendorDrawerOrders => 'ഓർഡറുകൾ';

  @override
  String get vendorDrawerCustomerCredit => 'ഉപഭോക്തൃ ക്രെഡിറ്റ്';

  @override
  String get vendorDrawerCommissions => 'കമ്മീഷൻ';

  @override
  String get vendorDrawerMyShops => 'എന്റെ കടകൾ';

  @override
  String get backToMarketplace => 'മാർക്കറ്റ് പ്ലേസിലേക്ക് മടങ്ങുക';

  @override
  String get itemMarkedLive => 'ഉൽപ്പന്നം ഇപ്പോൾ ലൈവ് ആണ്';

  @override
  String get itemMarkedHidden => 'ഉൽപ്പന്നം ഇപ്പോൾ മറച്ചിരിക്കുന്നു';

  @override
  String get deleteProductDialogTitle => 'ഉൽപ്പന്നം ഇല്ലാതാക്കുക';

  @override
  String deleteProductDialogMessage(String name) {
    return '\"$name\" ശാശ്വതമായി ഇല്ലാതാക്കണോ? ഇത് മാറ്റാൻ കഴിയില്ല.';
  }

  @override
  String get productDeletedSuccess => 'ഉൽപ്പന്നം വിജയകരമായി ഇല്ലാതാക്കി';

  @override
  String get manageProductsTitle => 'ഉൽപ്പന്നങ്ങൾ നിയന്ത്രിക്കുക';

  @override
  String get searchProductsPlaceholder =>
      'പേര് ഉപയോഗിച്ച് ഉൽപ്പന്നങ്ങൾ തിരയുക...';

  @override
  String get filterAll => 'എല്ലാം';

  @override
  String get filterLive => 'ലൈവ്';

  @override
  String get filterDraft => 'ഡ്രാഫ്റ്റ്';

  @override
  String get filterInactive => 'നിഷ്‌ക്രിയം';

  @override
  String get noProductsFound => 'ഉൽപ്പന്നങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല';

  @override
  String get statusDraft => 'ഡ്രാഫ്റ്റ്';

  @override
  String get statusIncomplete => 'അപൂർണ്ണം';

  @override
  String get statusReady => 'തയ്യാറാണ്';

  @override
  String get statusHidden => 'മറച്ചത്';

  @override
  String get statusRejected => 'നിരസിച്ചു';

  @override
  String get statusOutOfStock => 'സ്റ്റോക്കില്ല';

  @override
  String get deactivateTooltip => 'നിഷ്‌ക്രിയമാക്കുക';

  @override
  String get goLiveTooltip => 'ലൈവ് ആക്കുക';

  @override
  String get vendorManageOrdersTitle => 'ഓർഡറുകൾ നിയന്ത്രിക്കുക';

  @override
  String get resetDateButton => 'തീയതി പുനഃക്രമീകരിക്കുക';

  @override
  String get allStatusesFilter => 'എല്ലാ സ്റ്റാറ്റസുകളും';

  @override
  String vendorDeliverOnLabel(String date) {
    return 'ഡെലിവറി തീയതി: $date';
  }

  @override
  String get vendorNoOrders => 'ഓർഡറുകൾ ഇതുവരെയില്ല';

  @override
  String vendorNoStatusOrders(String status) {
    return '$status ഓർഡറുകളൊന്നും കണ്ടെത്തിയില്ല';
  }

  @override
  String get orderTimelineTitle => 'ഓർഡർ ടൈംലൈൻ';

  @override
  String get orderedItemsTitle => 'ഓർഡർ ചെയ്ത സാധനങ്ങൾ';

  @override
  String get totalFinalPriceTitle => 'അവസാന ആകെ തുക';

  @override
  String get cancelOrderButton => 'ഓർഡർ റദ്ദാക്കുക';

  @override
  String get shopCreatedSuccess => 'കട വിജയകരമായി നിർമ്മിച്ചു!';

  @override
  String shopCreatedFailed(String error) {
    return 'കട നിർമ്മിക്കാൻ കഴിഞ്ഞില്ല: $error';
  }

  @override
  String get vendorShopsTitle => 'കടയുടെ ക്രമീകരണങ്ങൾ';

  @override
  String get shopProfileSection => 'കടയുടെ പ്രൊഫൈൽ';

  @override
  String get manageShopSettingsSubtitle =>
      'നിങ്ങളുടെ കടയുടെ വിവരങ്ങളും ക്രമീകരണങ്ങളും നിയന്ത്രിക്കുക';

  @override
  String get setupShopSubtitle =>
      'വിൽപ്പന ആരംഭിക്കാൻ നിങ്ങളുടെ കട സജ്ജീകരിക്കുക';

  @override
  String get yourShopsTitle => 'നിങ്ങളുടെ കടകൾ';

  @override
  String get orderNotificationsTitle => 'ഓർഡർ അറിയിപ്പുകൾ';

  @override
  String get orderNotificationsSubtitle =>
      'എല്ലാ ഓർഡർ അപ്‌ഡേറ്റുകൾക്കുമായി പ്രവർത്തനക്ഷമമാക്കി';

  @override
  String get appVersionTitle => 'ആപ്പ് പതിപ്പ്';

  @override
  String get failedToAddToCart => 'കാർട്ടിലേക്ക് ചേർക്കാൻ കഴിഞ്ഞില്ല';

  @override
  String failedToLoadOrderDetails(String error) {
    return 'ഓർഡർ വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു: $error';
  }

  @override
  String failedToLoadHistory(String error) {
    return 'ചരിത്രം ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു: $error';
  }

  @override
  String failedToSubmitFeedback(String error) {
    return 'അഭിപ്രായം സമർപ്പിക്കുന്നതിൽ പരാജയപ്പെട്ടു: $error';
  }

  @override
  String failedToLoadReviews(String error) {
    return 'അഭിപ്രായങ്ങൾ ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു: $error';
  }
}
