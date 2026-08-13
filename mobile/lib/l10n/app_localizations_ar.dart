// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'سوق القرية';

  @override
  String get navHome => 'الرئيسية';

  @override
  String get navOrders => 'الطلبات';

  @override
  String get navCart => 'السلة';

  @override
  String get navProfile => 'الملف الشخصي';

  @override
  String get navSettings => 'الإعدادات';

  @override
  String get searchPlaceholder => 'البحث عن المنتجات...';

  @override
  String get addToCart => 'إضافة إلى السلة';

  @override
  String get buyNow => 'شراء الآن';

  @override
  String get save => 'حفظ';

  @override
  String get cancel => 'إلغاء';

  @override
  String get edit => 'تعديل';

  @override
  String get delete => 'حذف';

  @override
  String get signOut => 'تسجيل الخروج';

  @override
  String get settingsTitle => 'الإعدادات';

  @override
  String get languagePreference => 'تفضيل اللغة';

  @override
  String get themeMode => 'وضع المظهر';

  @override
  String get darkMode => 'الوضع الداكن';

  @override
  String get lightMode => 'الوضع الفاتح';

  @override
  String get cashOnDelivery => 'الدفع عند الاستلام';

  @override
  String get creditPayment => 'الدفع بالرصيد';

  @override
  String get placeOrder => 'إتمام الطلب';

  @override
  String get totalPrice => 'إجمالي السعر';

  @override
  String get orderStatusPending => 'قيد الانتظار';

  @override
  String get orderStatusPacking => 'جاري التعبئة';

  @override
  String get orderStatusDelivering => 'جاري التوصيل';

  @override
  String get orderStatusDelivered => 'تم التوصيل';

  @override
  String get orderStatusCancelled => 'ملغي';

  @override
  String get heyGreeting => 'مرحباً';

  @override
  String get findGroceriesSubtitle => 'ابحث عن البقالة الطازجة التي تريدها';

  @override
  String get searchShopsPlaceholder => 'البحث عن المتاجر...';

  @override
  String get searchItemsPlaceholder => 'البحث عن العناصر...';

  @override
  String get noShopsFound => 'لم يتم العثور على متاجر.';

  @override
  String get noItemsFound => 'لم يتم العثور على عناصر.';

  @override
  String get productsLabel => 'منتجات';

  @override
  String get categoriesTitle => 'الفئات';

  @override
  String get clearLabel => 'مسح';

  @override
  String get popularTitle => 'شائع';

  @override
  String get shopItemsTitle => 'عناصر المتجر';

  @override
  String get addButtonLabel => 'إضافة';

  @override
  String get bestOrganic => 'أفضل الخضروات العضوية الطازجة';

  @override
  String get greatDeals => 'عروض رائعة على الفواكه';

  @override
  String addingToCartMessage(String name) {
    return 'جاري إضافة $name إلى السلة...';
  }

  @override
  String addedToCartMessage(String name) {
    return 'تم إضافة $name إلى السلة!';
  }

  @override
  String get deliverySchedule => 'جدول التوصيل';

  @override
  String get changeDate => 'تغيير التاريخ';

  @override
  String get morning => 'صباحاً';

  @override
  String get evening => 'مساءً';

  @override
  String get myBag => 'حقيبتي';

  @override
  String get yourBagIsEmpty => 'حقيبتك فارغة';

  @override
  String get browseShops => 'تصفح المحلات';

  @override
  String get total => 'الإجمالي';

  @override
  String get proceedToCheckout => 'المتابعة لإتمام الشراء';

  @override
  String get cutoffPassed => 'فات وقت القطع';

  @override
  String get limitReached => 'تم الوصول للحد الأقصى';

  @override
  String get unavailable => 'غير متوفر';

  @override
  String itemsCount(int count) {
    return '$count عناصر';
  }

  @override
  String get exploreCategoriesSubtitle => 'استكشف المنتجات الطازجة حسب الفئة';

  @override
  String get searchCategoriesPlaceholder => 'البحث في الفئات...';

  @override
  String get noCategoriesFound => 'لم يتم العثور على فئات';

  @override
  String productsAvailable(int count) {
    return 'يتوفر $count من المنتجات';
  }

  @override
  String get noItemsInCategory => 'لا توجد عناصر في هذه الفئة بعد.';

  @override
  String get checkoutTitle => 'الدفع';

  @override
  String get deliveryAddressTitle => 'عنوان التوصيل';

  @override
  String get selectAddressLabel => 'اختر العنوان';

  @override
  String get changeAddressLabel => 'تغيير العنوان';

  @override
  String get addNewAddressLabel => 'إضافة عنوان جديد';

  @override
  String get noAddressesFound => 'لم يتم العثور على عناوين.';

  @override
  String get addressLabel => 'اسم العنوان *';

  @override
  String get addressLabelPlaceholder => 'المنزل، السكن الجامعي، المكتب، إلخ.';

  @override
  String get contactNameLabel => 'اسم جهة الاتصال *';

  @override
  String get fullNamePlaceholder => 'الاسم الكامل';

  @override
  String get contactPhoneLabel => 'رقم هاتف الاتصال *';

  @override
  String get addressLine1Label => 'سطر العنوان 1 *';

  @override
  String get addressLine1Placeholder => 'الشارع، المبنى، رقم المنزل.';

  @override
  String get addressLine2Label => 'سطر العنوان 2 (اختياري)';

  @override
  String get addressLine2Placeholder => 'الشقة، الطابق، الوحدة';

  @override
  String get landmarkLabel => 'علامة مميزة (اختياري)';

  @override
  String get landmarkPlaceholder => 'مثال: بالقرب من سيتي मॉल';

  @override
  String get saveToAddressBook => 'حفظ في دفتر العناوين الخاص بي';

  @override
  String get closeButton => 'إغلاق';

  @override
  String get backButton => 'عودة';

  @override
  String get useAddressButton => 'استخدم العنوان';

  @override
  String get thisTimeOnlyLabel => 'هذه المرة فقط';

  @override
  String get noAddressSelected => 'لم يتم اختيار عنوان';

  @override
  String get deliveryScheduleTitle => 'جدول التوصيل';

  @override
  String get paymentMethodTitle => 'طريقة الدفع';

  @override
  String get orderSummaryTitle => 'ملخص الطلب';

  @override
  String get totalAmountTitle => 'المبلغ الإجمالي';

  @override
  String get placeOrderButton => 'تقديم الطلب';

  @override
  String get fillRequiredFieldsError => 'يرجى ملء جميع الحقول المطلوبة (*).';

  @override
  String orderPlacementFailed(String error) {
    return 'فشل تقديم الطلب: $error';
  }

  @override
  String get orderPlacedTitle => 'تم تقديم الطلب!';

  @override
  String orderIdLabel(String orderId) {
    return 'الطلب #$orderId';
  }

  @override
  String get orderReceivedSubtitle => 'تم استلام طلبك وسيتم تجهيزه قريباً.';

  @override
  String get viewMyOrdersButton => 'عرض طلباتي';

  @override
  String get continueShoppingButton => 'مواصلة التسوق';

  @override
  String get guestUser => 'ضيف';

  @override
  String failedToLoadHomeData(String error) {
    return 'فشل تحميل البيانات الرئيسية: $error';
  }

  @override
  String get productLabel => 'المنتج';

  @override
  String removedFromFavoritesMessage(String name) {
    return 'تم إزالة $name من المفضلات';
  }

  @override
  String addedToFavoritesMessage(String name) {
    return 'تم إضافة $name إلى المفضلات';
  }

  @override
  String get failedToUpdateFavoriteStatus => 'فشل تحديث حالة المفضلة';

  @override
  String get pinLimitReached =>
      'يمكنك تثبيت ما يصل إلى 3 محلات فقط. يرجى إلغاء تثبيت محل أولاً.';

  @override
  String unpinnedSuccessfully(String name) {
    return 'تم إلغاء تثبيت $name بنجاح';
  }

  @override
  String pinnedSuccessfully(String name) {
    return 'تم تثبيت $name بنجاح';
  }

  @override
  String get failedToUpdatePinStatus => 'فشل تحديث حالة التثبيت';

  @override
  String get shopReviewsTooltip => 'تقييمات المحل والملاحظات';

  @override
  String productsCount(int count) {
    return '$count من المنتجات';
  }

  @override
  String get selectOption => 'اختر خياراً';

  @override
  String get quantityLabel => 'الكمية';

  @override
  String get addedToCartLabel => 'تم الإضافة للحقيبة';

  @override
  String get addToCartLabel => 'إضافة للحقيبة';

  @override
  String get notificationsTitle => 'الإشعارات';

  @override
  String get noNotificationsYet => 'لا توجد إشعارات بعد';

  @override
  String get orderNotificationPlaced => 'تم تقديم طلبك';

  @override
  String get orderNotificationPreparing => 'المحل يجهز طلبك';

  @override
  String get orderNotificationOnWay => 'طلبك في الطريق إليك!';

  @override
  String get orderNotificationDelivered => 'تم توصيل الطلب بنجاح 🎉';

  @override
  String get orderNotificationCancelled => 'تم إلغاء الطلب';

  @override
  String minutesAgo(int count) {
    return 'قبل $count دقيقة';
  }

  @override
  String hoursAgo(int count) {
    return 'قبل $count ساعة';
  }

  @override
  String daysAgo(int count) {
    return 'قبل $count يوم';
  }

  @override
  String reviewShopTitle(String shopName) {
    return 'تقييم $shopName';
  }

  @override
  String get rateYourExperienceTitle => 'قيم تجربتك';

  @override
  String rateExperienceSubtitle(String shopName) {
    return 'يرجى تقييم الجوانب التالية لطلبك من $shopName.';
  }

  @override
  String get productQualityRatingLabel => 'جودة المنتج';

  @override
  String get productQualityRatingSub => 'كيف كانت جودة المنتجات؟';

  @override
  String get productQualityRatingHint =>
      'منتجات طازجة، جودة عالية، عناصر أصلية...';

  @override
  String get deliveryTimelinessRatingLabel => 'التوصيل في الوقت المحدد';

  @override
  String get deliveryTimelinessRatingSub => 'هل تم توصيل طلبك في الوقت المحدد؟';

  @override
  String get deliveryTimelinessRatingHint =>
      'وصل التوصيل الصباحي في الوقت المحدد...\nتأخر التوصيل المسائي...';

  @override
  String get orderAccuracyRatingLabel => 'دقة الطلب';

  @override
  String get orderAccuracyRatingSub => 'هل استلمت بالضبط ما طلبته؟';

  @override
  String get orderAccuracyRatingHint =>
      'عناصر صحيحة، كمية صحيحة، خيارات صحيحة...';

  @override
  String get overallExperienceRatingLabel => 'التجربة العامة';

  @override
  String get overallExperienceRatingSub => 'أخبرنا عن تجربتك العامة.';

  @override
  String get overallExperienceRatingHint =>
      'خدمة ودودة، تجربة رائعة، سأطلب مجدداً...';

  @override
  String get calculatedAverageLabel => 'المتوسط المحسوب:';

  @override
  String get submitReviewButton => 'تقديم التقييم';

  @override
  String get reviewSubmittedSuccess => 'تم تقديم التقييم بنجاح!';

  @override
  String reviewSubmittedFailed(String error) {
    return 'فشل تقديم التقييم: $error';
  }

  @override
  String get myOrdersTitle => 'طلباتي';

  @override
  String get noOrdersYet => 'لا توجد طلبات بعد';

  @override
  String get noOrdersSubtitle =>
      'لم تقم بتقديم أي طلبات بعد. ابدأ التسوق لعرض تاريخ طلباتك هنا.';

  @override
  String get todayLabel => 'اليوم';

  @override
  String get last7DaysLabel => 'آخر 7 أيام';

  @override
  String get last30DaysLabel => 'آخر 30 يوماً';

  @override
  String get allTimeLabel => 'كل الوقت';

  @override
  String get allSlotsLabel => 'كل الفترات';

  @override
  String get morningSlotLabel => '☀️ الفترة الصباحية';

  @override
  String get eveningSlotLabel => '🌙 الفترة المسائية';

  @override
  String get pendingStatus => 'قيد الانتظار';

  @override
  String get acceptedStatus => 'تم القبول';

  @override
  String get readyForDeliveryStatus => 'جاهز للتوصيل';

  @override
  String get outForDeliveryStatus => 'خرج للتوصيل';

  @override
  String get onTheWayStatus => 'في الطريق';

  @override
  String get deliveredStatus => 'تم التوصيل';

  @override
  String get cancelledStatus => 'ملغي';

  @override
  String get morningTimeLabel => '☀️ صباحاً';

  @override
  String get eveningTimeLabel => '🌙 مساءً';

  @override
  String deliverOnLabel(String date) {
    return 'التوصيل في: $date';
  }

  @override
  String get orderDetailAddressSection => '📍 عنوان التوصيل';

  @override
  String get orderDetailItemsSection => '🧾 العناصر';

  @override
  String get orderDetailReviewSection => '⭐ تقييمك';

  @override
  String get leaveShopReviewButton => 'أضف تقييم للمحل';

  @override
  String nearLandmarkLabel(String landmark) {
    return 'بالقرب من: $landmark';
  }

  @override
  String get myAddressesTitle => 'عناويني';

  @override
  String get addAddressButton => 'إضافة عنوان';

  @override
  String get noAddressesSaved => 'لم يتم حفظ أي عنوان';

  @override
  String get defaultAddressBadge => 'افتراضي';

  @override
  String get editAddressTitle => 'تعديل العنوان';

  @override
  String get labelFieldTitle => 'التسمية';

  @override
  String get labelHome => 'المنزل';

  @override
  String get labelWork => 'العمل';

  @override
  String get labelOther => 'آخر';

  @override
  String get fieldRequiredValidation => 'مطلوب';

  @override
  String get pinMyLocationButton => 'تثبيت موقعي (OSM)';

  @override
  String get mapPickerComingSoon =>
      'أداة اختيار الخريطة قريباً (OpenStreetMap)';

  @override
  String get setAsDefaultAddress => 'تعيين كعنوان افتراضي';

  @override
  String get updateAddressButton => 'تحديث العنوان';

  @override
  String get favoriteProductsTitle => 'المنتجات المفضلات';

  @override
  String get noFavoritesYet => 'لا توجد مفضلات بعد';

  @override
  String get noFavoritesSubtitle =>
      'اضغط على أيقونة القلب في أي منتج لحفظه هنا';

  @override
  String get browseProductsButton => 'تصفح المنتجات';

  @override
  String outOfStockMessage(String name) {
    return '$name غير متوفر في المخزون حالياً';
  }

  @override
  String get platformFeedbackTitle => 'ملاحظات المنصة';

  @override
  String get submitFeedbackTab => 'تقديم الملاحظات';

  @override
  String get feedbackHistoryTab => 'سجل الملاحظات';

  @override
  String get valueFeedbackHeader => 'نحن نقدر ملاحظاتك';

  @override
  String get feedbackInstruction =>
      'أخبرنا إذا عثرت على خطأ برمجي، أو تريد طلب ميزة جديدة، أو لديك اقتراحات لتحسين المنصة.';

  @override
  String get feedbackTypeLabel => 'نوع الملاحظات';

  @override
  String get suggestionOption => 'اقتراح';

  @override
  String get complaintOption => 'شكوى';

  @override
  String get bugReportOption => 'تقرير عن مشكلة';

  @override
  String get featureRequestOption => 'طلب ميزة';

  @override
  String get generalOption => 'عام';

  @override
  String get rateExperienceHeader => 'كيف تقيم تجربتك؟';

  @override
  String get yourMessageLabel => 'رسالتك';

  @override
  String get feedbackPlaceholder => 'اكتب ملاحظاتك بالتفصيل هنا...';

  @override
  String get enterMessageError => 'يرجى إدخال رسالتك';

  @override
  String get messageLengthError => 'يجب أن تكون الرسالة من 10 رموز على الأقل';

  @override
  String get feedbackSubmittedSuccess => 'تم تقديم الملاحظات بنجاح! شكراً لك.';

  @override
  String get noFeedbackHistory => 'لم يتم تقديم ملاحظات بعد';

  @override
  String get pinnedShopsTitle => 'المحلات المثبتة';

  @override
  String get noPinnedShopsYet => 'لا توجد محلات مثبتة بعد';

  @override
  String get noPinnedShopsSubtitle => 'قم بتثبيت محلاتك المفضلة للوصول السريع';

  @override
  String get guestUserLabel => 'مستخدم ضيف';

  @override
  String get myProfileTitle => 'ملفي الشخصي';

  @override
  String get noPhoneNumberLabel => 'لا يوجد رقم هاتف';

  @override
  String get personalInfoSection => 'المعلومات الشخصية';

  @override
  String get emailLabel => 'البريد الإلكتروني';

  @override
  String get genderLabel => 'الجنس';

  @override
  String get birthdayLabel => 'تاريخ الميلاد';

  @override
  String get languageLabel => 'اللغة';

  @override
  String get preferencesSection => 'التفضيلات';

  @override
  String get recentPurchasesLabel => 'المشتريات الأخيرة';

  @override
  String get purchaseHistoryLabel => 'سجل المشتريات';

  @override
  String get platformFeedbackLabel => 'ملاحظات المنصة';

  @override
  String get managementSection => 'الإدارة';

  @override
  String get vendorPanelLabel => 'لوحة البائع';

  @override
  String get vendorPanelSubtitle => 'إدارة المحل والطلبات الخاصة بك';

  @override
  String get adminPanelLabel => 'لوحة التحكم';

  @override
  String get adminPanelSubtitle => 'إدارة النظام';

  @override
  String get searchHistoryPlaceholder => 'البحث في رقم الطلب، المحل، المنتج...';

  @override
  String get noHistoryFound => 'لم يتم العثور على سجل مشتريات';

  @override
  String get noHistorySubtitle => 'حاول تعديل الفلاتر أو عبارة البحث';

  @override
  String get csvButtonLabel => 'CSV';

  @override
  String get reportButtonLabel => 'تقرير';

  @override
  String get noOrdersToExport => 'لا توجد طلبات لتصديرها';

  @override
  String get csvCopiedSuccess =>
      'تم نسخ سجل المشتريات بصيغة CSV إلى الحافظة! يمكنك لصقه وحفظه كملف.';

  @override
  String get reportCopiedSuccess =>
      'تم نسخ تقرير سجل الطلبات النصي إلى الحافظة! جاهز للطباعة أو المشاركة.';

  @override
  String get totalLabel => 'الإجمالي';

  @override
  String get viewDetailsButton => 'عرض التفاصيل';

  @override
  String get searchPurchasesPlaceholder => 'البحث في المشتريات...';

  @override
  String get sevenDaysFilter => '7 أيام';

  @override
  String get thirtyDaysFilter => '30 يوماً';

  @override
  String get ninetyDaysFilter => '90 يوماً';

  @override
  String get mostRecentSort => 'الأحدث';

  @override
  String get mostOrderedSort => 'الأكثر طلباً';

  @override
  String get noRecentPurchases => 'لا توجد مشتريات حديثة';

  @override
  String get noRecentPurchasesSubtitle =>
      'ابدأ التسوق لتكوين سجل المشتريات الخاص بك';

  @override
  String get reorderButton => 'إعادة الطلب';

  @override
  String get outOfStockLabel => 'نفذت الكمية';

  @override
  String get searchShopsHint => 'البحث في المحلات...';

  @override
  String get searchForShopsLabel => 'ابحث عن المحلات';

  @override
  String get recentSearchesTitle => 'عمليات البحث الأخيرة';

  @override
  String get clearButtonLabel => 'مسح';

  @override
  String get noShopsFoundMessage => 'لم يتم العثور على محلات';

  @override
  String get generalStoreFallback => 'متجر عام';

  @override
  String get catalogTab => 'الكتالوج';

  @override
  String get reviewsTab => 'التقييمات';

  @override
  String get noItemsInShop => 'لا توجد عناصر في هذا المحل';

  @override
  String get noReviewsYet => 'لا توجد تقييمات بعد';

  @override
  String get noReviewsSubtitle => 'كن أول عميل يقيم هذا المحل.';

  @override
  String get writeFirstReviewButton => 'كتابة أول تقييم';

  @override
  String get reviewsTitle => 'التقييمات';

  @override
  String get verifiedPurchaseBadge => 'عملية شراء موثقة';

  @override
  String get anonymousReviewer => 'مجهول';

  @override
  String get runPreparedSuccess => 'تم تجهيز الجولة بنجاح! تم ربط الطلبات.';

  @override
  String runPreparedFailed(String error) {
    return 'فشل تجهيز الجولة: $error';
  }

  @override
  String runUpdatedMessage(String status) {
    return 'تم تحديث الجولة إلى: $status';
  }

  @override
  String runUpdatedFailed(String error) {
    return 'فشل تحديث الجولة: $error';
  }

  @override
  String get deliveryRunsManagementTitle => 'إدارة جولات التوصيل';

  @override
  String get runNotStarted => 'لم تبدأ';

  @override
  String get runPrepare => 'تجهيز الجولة';

  @override
  String get runPacking => 'تعبئة وتغليف';

  @override
  String get runStartDelivery => 'بدء التوصيل';

  @override
  String get runOutForDelivery => 'خرج للتوصيل';

  @override
  String get runComplete => 'إكمال الجولة';

  @override
  String get runCompleted => 'اكتملت';

  @override
  String get ordersCountLabel => 'طلبات';

  @override
  String get runValueLabel => 'القيمة';

  @override
  String get viewOrdersButton => 'عرض الطلبات';

  @override
  String get vendorPanelTitle => 'لوحة البائع';

  @override
  String get welcomeBackTo => 'مرحباً بك مجدداً في ';

  @override
  String get viewMyShopButton => 'عرض المحل الخاص بي';

  @override
  String get quickActionsTitle => 'إجراءات سريعة';

  @override
  String get addNewProductAction => 'إضافة منتج جديد';

  @override
  String get viewProductsAction => 'عرض المنتجات';

  @override
  String get manageOrdersAction => 'إدارة الطلبات';

  @override
  String get commissionStatsAction => 'إحصاءات العمولات';

  @override
  String get customerCreditAction => 'ائتمان العملاء';

  @override
  String get shopSettingsAction => 'إعدادات المحل';

  @override
  String get vendorPortalTitle => 'بوابة البائع';

  @override
  String get vendorDrawerDashboard => 'لوحة القيادة';

  @override
  String get vendorDrawerAllProducts => 'جميع المنتجات';

  @override
  String get vendorDrawerAddProduct => 'إضافة منتج';

  @override
  String get vendorDrawerOrders => 'الطلب';

  @override
  String get vendorDrawerCustomerCredit => 'ائتمان العملاء';

  @override
  String get vendorDrawerCommissions => 'العمولات';

  @override
  String get vendorDrawerMyShops => 'محلاتي';

  @override
  String get backToMarketplace => 'العودة إلى السوق';

  @override
  String get itemMarkedLive => 'المنتج متوفر الآن للجميع';

  @override
  String get itemMarkedHidden => 'المنتج مخفي الآن';

  @override
  String get deleteProductDialogTitle => 'حذف المنتج';

  @override
  String deleteProductDialogMessage(String name) {
    return 'هل تريد حذف \"$name\" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.';
  }

  @override
  String get productDeletedSuccess => 'تم حذف المنتج بنجاح';

  @override
  String get manageProductsTitle => 'إدارة المنتجات';

  @override
  String get searchProductsPlaceholder => 'البحث عن المنتجات بالاسم...';

  @override
  String get filterAll => 'الكل';

  @override
  String get filterLive => 'نشط';

  @override
  String get filterDraft => 'مسودة';

  @override
  String get filterInactive => 'غير نشط';

  @override
  String get noProductsFound => 'لم يتم العثور على منتجات';

  @override
  String get statusDraft => 'مسودة';

  @override
  String get statusIncomplete => 'غير مكتمل';

  @override
  String get statusReady => 'جاهز';

  @override
  String get statusHidden => 'مخفي';

  @override
  String get statusRejected => 'مرفوض';

  @override
  String get statusOutOfStock => 'غير متوفر';

  @override
  String get deactivateTooltip => 'إلغاء التنشيط';

  @override
  String get goLiveTooltip => 'نشر على العام';

  @override
  String get vendorManageOrdersTitle => 'إدارة الطلبات';

  @override
  String get resetDateButton => 'إعادة ضبط التاريخ';

  @override
  String get allStatusesFilter => 'كل الحالات';

  @override
  String vendorDeliverOnLabel(String date) {
    return 'التوصيل في: $date';
  }

  @override
  String get vendorNoOrders => 'لا توجد طلبات بعد';

  @override
  String vendorNoStatusOrders(String status) {
    return 'لم يتم العثور على طلبات بالحالة: $status';
  }

  @override
  String get orderTimelineTitle => 'جدول الطلب الزمني';

  @override
  String get orderedItemsTitle => 'العناصر المطلوبة';

  @override
  String get totalFinalPriceTitle => 'السعر النهائي الإجمالي';

  @override
  String get cancelOrderButton => 'إلغاء الطلب';

  @override
  String get shopCreatedSuccess => 'تم إنشاء المحل بنجاح!';

  @override
  String shopCreatedFailed(String error) {
    return 'فشل إنشاء المحل: $error';
  }

  @override
  String get vendorShopsTitle => 'إعدادات المحل';

  @override
  String get shopProfileSection => 'ملف المحل';

  @override
  String get manageShopSettingsSubtitle =>
      'إدارة تفاصيل وإعدادات المحل الخاص بك';

  @override
  String get setupShopSubtitle => 'قم بإعداد المحل الخاص بك لبدء البيع';

  @override
  String get yourShopsTitle => 'محلاتك';

  @override
  String get orderNotificationsTitle => 'إشعارات الطلب';

  @override
  String get orderNotificationsSubtitle => 'تم التفعيل لجميع تحديثات الطلبات';

  @override
  String get appVersionTitle => 'اصدار التطبيق';

  @override
  String get failedToAddToCart => 'فشل الإضافة إلى السلة';

  @override
  String failedToLoadOrderDetails(String error) {
    return 'فشل تحميل تفاصيل الطلب: $error';
  }

  @override
  String failedToLoadHistory(String error) {
    return 'فشل تحميل السجل: $error';
  }

  @override
  String failedToSubmitFeedback(String error) {
    return 'فشل إرسال التعليقات: $error';
  }

  @override
  String failedToLoadReviews(String error) {
    return 'فشل تحميل المراجعات: $error';
  }

  @override
  String get waitingUserConfirmation => 'بانتظار تأكيد المستخدم';

  @override
  String get authWelcomeBack => 'مرحباً بعودتك';

  @override
  String get authSignInSubtitle => 'سجل الدخول إلى حساب فيليج ماركت الخاص بك';

  @override
  String get authPhoneLogin => 'تسجيل الدخول بالهاتف';

  @override
  String get authEmailLogin => 'تسجيل الدخول بالبريد الإلكتروني';

  @override
  String get authForgotPassword => 'هل نسيت كلمة المرور؟';

  @override
  String get authSignIn => 'تسجيل الدخول';

  @override
  String get authCreateAccount => 'إنشاء حساب';

  @override
  String get authJoinSubtitle => 'انضم إلى فيليج ماركت — أدخل التفاصيل للبدء';

  @override
  String get authUsePhone => 'استخدام رقم الهاتف';

  @override
  String get authUseEmail => 'استخدام البريد الإلكتروني';

  @override
  String get authRegister => 'تسجيل';

  @override
  String get authResetPassword => 'إعادة تعيين كلمة المرور';

  @override
  String get authResetPwInstructions =>
      'أدخل التفاصيل الخاصة بك لتلقي تعليمات إعادة تعيين كلمة المرور';

  @override
  String get authCheckInboxReset =>
      'تحقق من بريدك الوارد للحصول على رابط إعادة التعيين';

  @override
  String get authEmailAccounts => 'حسابات البريد الإلكتروني';

  @override
  String get authPhoneAccounts => 'حسابات الهاتف';

  @override
  String get authSendResetLink => 'إرسال رابط إعادة التعيين';

  @override
  String get authGoToLogin => 'الانتقال إلى تسجيل الدخول';

  @override
  String get authRememberPw => 'هل تتذكر كلمة المرور الخاصة بك؟';

  @override
  String get authSignInLink => 'تسجيل الدخول';

  @override
  String authResetLinkSentTo(String email) {
    return 'تم إرسال رابط إعادة تعيين كلمة المرور بنجاح إلى $email. يرجى التحقق من البريد الوارد والمجلدات غير المرغوب فيها.';
  }

  @override
  String get authCompleteRegistration => 'إكمال التسجيل';

  @override
  String get authFewDetailsSetup => 'فقط بعض التفاصيل لإعداد حسابك';

  @override
  String get authPreferredLanguage => 'اللغة المفضلة';

  @override
  String get authVillageLocation => 'القرية / الموقع';

  @override
  String get authCompleteSetup => 'إكمال الإعداد';

  @override
  String get authLoadingLocations => 'جاري تحميل المواقع...';

  @override
  String get authFullName => 'الاسم الكامل';

  @override
  String get authEmail => 'البريد الإلكتروني';

  @override
  String get authPhone => 'رقم الهاتف';

  @override
  String get authPassword => 'كلمة المرور';

  @override
  String get securityTitle => 'إعدادات الأمان';

  @override
  String get securityChangePhone => 'تغيير رقم الهاتف';

  @override
  String get securityPhoneSuccess => 'تم تحديث رقم الهاتف بنجاح!';

  @override
  String get securityActivePhone => 'رقم الهاتف النشط';

  @override
  String get securityRequestPhoneChange => 'طلب تغيير الهاتف';

  @override
  String get securitySending => 'جاري الإرسال...';

  @override
  String securityEnterVerificationCode(String phone) {
    return 'أدخل رمز التحقق المرسل إلى $phone';
  }

  @override
  String get securityDidntReceiveCode => 'لم يصلك الرمز؟';

  @override
  String securityResendIn(String countdown) {
    return 'إعادة الإرسال خلال $countdown ثانية';
  }

  @override
  String get securityResendOtp => 'إعادة إرسال الرمز';

  @override
  String get securityCancel => 'إلغاء';

  @override
  String get securityVerifyChange => 'التحقق والتغيير';

  @override
  String get securityVerifying => 'جاري التحقق...';

  @override
  String get securityChangePassword => 'تغيير كلمة مرور الحساب';

  @override
  String get securityPasswordSuccess => 'تم تحديث كلمة المرور بنجاح!';

  @override
  String get securityNewPassword => 'كلمة المرور الجديدة';

  @override
  String get securityConfirmNewPassword => 'تأكيد كلمة المرور الجديدة';

  @override
  String get securityUpdatePassword => 'تحديث كلمة المرور';

  @override
  String get securitySaving => 'جاري الحفظ...';

  @override
  String get securityDangerZone => 'منطقة الخطر';

  @override
  String get securityDangerZoneDesc =>
      'سيؤدي تسجيل الخروج من جميع الأجهزة إلى إنهاء كافة الجلسات النشطة عبر متصفحات الويب وتطبيقات الهاتف والأجهزة الأخرى.';

  @override
  String get securitySignOutAll => 'تسجيل الخروج من جميع الأجهزة';

  @override
  String get securityLoggingOut => 'جاري تسجيل الخروج...';

  @override
  String get securityConfirmSignOutAll =>
      'هل أنت متأكد أنك تريد تسجيل الخروج من جميع الأجهزة؟ سيتعين عليك تسجيل الدخول مرة أخرى على جميع أجهزتك النشطة.';

  @override
  String get authNoAccountPrompt => 'ليس لديك حساب؟ ';

  @override
  String get authAlreadyHaveAccount => 'لديك حساب بالفعل؟ ';

  @override
  String get authAccountType => 'نوع الحساب';

  @override
  String get authCustomerRole => 'عميل';

  @override
  String get authShopOwnerRole => 'صاحب متجر';

  @override
  String get authVerifyPhone => 'التحقق من رقم الهاتف';

  @override
  String get authVerifyCode => 'تحقق من الرمز';

  @override
  String get authVerificationCodeResent => 'تم إعادة إرسال رمز التحقق!';

  @override
  String get selectLocationTitle => 'اختر الموقع';

  @override
  String get searchLocationsHint => 'البحث عن المواقع…';

  @override
  String get allLocationsOption => 'جميع المواقع';

  @override
  String failedToLoadLocations(String error) {
    return 'فشل في تحميل المواقع: $error';
  }

  @override
  String get noLocationsMatch => 'لا توجد مواقع تطابق بحثك.';

  @override
  String get vendorFooterDashboard => 'لوحة التحكم';

  @override
  String get vendorFooterOrders => 'الطلبات';

  @override
  String get vendorFooterProducts => 'المنتجات';

  @override
  String get vendorFooterCredit => 'الائتمان';

  @override
  String get vendorFooterExit => 'خروج';

  @override
  String get vendorEditProduct => 'تعديل المنتج';

  @override
  String get vendorUserCreditDetail => 'تفاصيل ائتمان المستخدم';

  @override
  String get tutorialSkip => 'تخطي';

  @override
  String get tutorialNext => 'التالي';

  @override
  String get tutorialFinish => 'إنهاء';

  @override
  String get tutorialHomeLocationTitle => 'اختر الموقع';

  @override
  String get tutorialHomeLocationDesc => 'انقر هنا لتغيير موقع قريتك أو سوقك.';

  @override
  String get tutorialHomeSearchTitle => 'البحث عن المحلات';

  @override
  String get tutorialHomeSearchDesc =>
      'ابحث عن محلاتك المحلية المفضلة بالكتابة هنا.';

  @override
  String get tutorialHomeCategoryTitle => 'الفئات';

  @override
  String get tutorialHomeCategoryDesc =>
      'تصفية الخضروات والفواكه والمنتجات حسب الفئة.';

  @override
  String get tutorialHomeShopCardTitle => 'استكشف المحلات';

  @override
  String get tutorialHomeShopCardDesc =>
      'انقر على أي محل لعرض المنتجات المتاحة فيه.';

  @override
  String get tutorialShopFilterTitle => 'تصفية بالفئة';

  @override
  String get tutorialShopFilterDesc =>
      'انقر على الفئة لتصفية المنتجات المحددة والعثور عليها بسرعة.';

  @override
  String get tutorialShopProductTitle => 'عرض المنتجات';

  @override
  String get tutorialShopProductDesc =>
      'شاهد الأسعار والصور والتفاصيل لجميع المنتجات المتاحة.';

  @override
  String get tutorialShopOpenTitle => 'فتح المنتج';

  @override
  String get tutorialShopOpenDesc =>
      'انقر على أي بطاقة منتج لعرض مزيد من التفاصيل وإضافته إلى حقيبتك.';

  @override
  String get shopOwnersTitle => 'مالكو المتاجر / المالكين المشاركين';

  @override
  String get addCoOwner => 'إضافة مالك مشارك';

  @override
  String get removeCoOwner => 'إزالة المالك المشارك';

  @override
  String get maxOwnersLimit => 'الحد الأقصى 3';

  @override
  String get deleteShop => 'حذف المتجر';

  @override
  String get primaryOwner => 'المالك الرئيسي';

  @override
  String get coOwner => 'مالك مشارك';

  @override
  String get signInYourAccount => 'تسجيل الدخول إلى حسابك';

  @override
  String get signUpYourAccount => 'إنشاء حساب جديد';

  @override
  String get emailAddress => 'البريد الإلكتروني';

  @override
  String get phoneNumber => 'رقم الهاتف';

  @override
  String get rememberMe => 'تذكرني';

  @override
  String get forgotPassword => 'هل نسيت كلمة المرور؟';

  @override
  String get completeRegistration => 'إكمال التسجيل';

  @override
  String get alreadyHaveAccountQuestion => 'هل لديك حساب بالفعل؟';

  @override
  String get dontHaveAccount => 'ليس لديك حساب؟';

  @override
  String get usePhone => 'الهاتف';

  @override
  String get useEmail => 'البريد الإلكتروني';

  @override
  String get agreeTerms => 'أوافق على';

  @override
  String get termsConditions => 'الشروط والأحكام';

  @override
  String get orderSuccessSubtitle =>
      'شكرا لطلبك! تم إخطار البائع وجاري تجهيز التوصيل.';

  @override
  String get estimatedDeliveryLabel => 'التوصيل المتوقع:';

  @override
  String get estimatedDeliveryValue => 'خلال 30-45 دقيقة';

  @override
  String get orderIdCopiedToast => 'تم نسخ رقم الطلب!';

  @override
  String get coOwnersDesc =>
      'التعاون مع ما يصل إلى 3 مالكين في متجر واحد مع صلاحيات كاملة.';

  @override
  String get addCoOwnerBtn => '+ إضافة مالك مشارك';

  @override
  String get addCoOwnerModalTitle => 'إضافة مالك مشارك للمتجر (حد أقصى 3)';

  @override
  String get selectRegisteredUser => 'اختر مستخدم مسجل';

  @override
  String get maxOwnersReached => 'تم الوصول إلى الحد الأقصى 3 مالكين';

  @override
  String get cannotRemoveOnlyOwner => 'لا يمكن إزالة المالك الوحيد للمتجر.';

  @override
  String get confirmRemoveCoOwner => 'هل أنت تأكد من إزالة هذا المالك المشارك؟';

  @override
  String get coOwnerAddedSuccess => 'تمت إضافة المالك المشارك بنجاح!';

  @override
  String get coOwnerRemovedSuccess => 'تمت إزالة المالك المشارك بنجاح!';
}
