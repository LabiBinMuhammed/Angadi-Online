// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Angadi';

  @override
  String get navHome => 'Home';

  @override
  String get navOrders => 'Orders';

  @override
  String get navCart => 'Bag';

  @override
  String get navProfile => 'Profile';

  @override
  String get navSettings => 'Settings';

  @override
  String get searchPlaceholder => 'Search products...';

  @override
  String get addToCart => 'Add to Cart';

  @override
  String get buyNow => 'Buy Now';

  @override
  String get save => 'Save';

  @override
  String get cancel => 'Cancel';

  @override
  String get edit => 'Edit';

  @override
  String get delete => 'Delete';

  @override
  String get signOut => 'Sign Out';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get languagePreference => 'Language Preference';

  @override
  String get themeMode => 'Theme Mode';

  @override
  String get darkMode => 'Dark Mode';

  @override
  String get lightMode => 'Light Mode';

  @override
  String get cashOnDelivery => 'Cash on Delivery';

  @override
  String get creditPayment => 'Credit Payment';

  @override
  String get placeOrder => 'Place Order';

  @override
  String get totalPrice => 'Total Price';

  @override
  String get orderStatusPending => 'Pending';

  @override
  String get orderStatusPacking => 'Packing';

  @override
  String get orderStatusDelivering => 'Delivering';

  @override
  String get orderStatusDelivered => 'Delivered';

  @override
  String get orderStatusCancelled => 'Cancelled';

  @override
  String get heyGreeting => 'Hey';

  @override
  String get findGroceriesSubtitle => 'Find fresh groceries you want';

  @override
  String get searchShopsPlaceholder => 'Search shops...';

  @override
  String get searchItemsPlaceholder => 'Search items...';

  @override
  String get noShopsFound => 'No shops found.';

  @override
  String get noItemsFound => 'No items found.';

  @override
  String get productsLabel => 'products';

  @override
  String get categoriesTitle => 'Categories';

  @override
  String get clearLabel => 'CLEAR';

  @override
  String get popularTitle => 'Popular';

  @override
  String get shopItemsTitle => 'Shop Items';

  @override
  String get addButtonLabel => 'Add';

  @override
  String get bestOrganic => 'Best organic fresh vegetables';

  @override
  String get greatDeals => 'Great deals on fruit';

  @override
  String addingToCartMessage(String name) {
    return 'Adding $name to cart...';
  }

  @override
  String addedToCartMessage(String name) {
    return '$name added to cart!';
  }

  @override
  String get deliverySchedule => 'Delivery Schedule';

  @override
  String get changeDate => 'Change Date';

  @override
  String get morning => 'Morning';

  @override
  String get evening => 'Evening';

  @override
  String get myBag => 'My Bag';

  @override
  String get yourBagIsEmpty => 'Your bag is empty';

  @override
  String get browseShops => 'Browse Shops';

  @override
  String get total => 'Total';

  @override
  String get proceedToCheckout => 'Proceed To Checkout';

  @override
  String get cutoffPassed => 'Cutoff passed';

  @override
  String get limitReached => 'Limit reached';

  @override
  String get unavailable => 'Unavailable';

  @override
  String itemsCount(int count) {
    return '$count items';
  }

  @override
  String get exploreCategoriesSubtitle => 'Explore fresh products by category';

  @override
  String get searchCategoriesPlaceholder => 'Search categories...';

  @override
  String get noCategoriesFound => 'No categories found';

  @override
  String productsAvailable(int count) {
    return '$count products available';
  }

  @override
  String get noItemsInCategory => 'No items in this category yet.';

  @override
  String get checkoutTitle => 'Checkout';

  @override
  String get deliveryAddressTitle => 'Delivery Address';

  @override
  String get selectAddressLabel => 'Select Address';

  @override
  String get changeAddressLabel => 'Change Address';

  @override
  String get addNewAddressLabel => 'Add New Address';

  @override
  String get noAddressesFound => 'No addresses found.';

  @override
  String get addressLabel => 'Address Name *';

  @override
  String get addressLabelPlaceholder => 'Home, Hostel, Office, etc.';

  @override
  String get contactNameLabel => 'Contact Name *';

  @override
  String get fullNamePlaceholder => 'Full Name';

  @override
  String get contactPhoneLabel => 'Contact Phone *';

  @override
  String get addressLine1Label => 'Address Line 1 *';

  @override
  String get addressLine1Placeholder => 'Street, building, house no.';

  @override
  String get addressLine2Label => 'Address Line 2 (Optional)';

  @override
  String get addressLine2Placeholder => 'Apartment, floor, unit';

  @override
  String get landmarkLabel => 'Landmark (Optional)';

  @override
  String get landmarkPlaceholder => 'E.g., near City Mall';

  @override
  String get saveToAddressBook => 'Save to my address book';

  @override
  String get closeButton => 'Close';

  @override
  String get backButton => 'Back';

  @override
  String get useAddressButton => 'Use Address';

  @override
  String get thisTimeOnlyLabel => 'This Time Only';

  @override
  String get noAddressSelected => 'No address selected';

  @override
  String get deliveryScheduleTitle => 'DELIVERY SCHEDULE';

  @override
  String get paymentMethodTitle => 'Payment Method';

  @override
  String get orderSummaryTitle => 'Order Summary';

  @override
  String get totalAmountTitle => 'Total Amount';

  @override
  String get placeOrderButton => 'Place Order';

  @override
  String get fillRequiredFieldsError => 'Please fill all required (*) fields.';

  @override
  String orderPlacementFailed(String error) {
    return 'Order placement failed: $error';
  }

  @override
  String get orderPlacedTitle => 'Order Placed!';

  @override
  String orderIdLabel(String orderId) {
    return 'Order #$orderId';
  }

  @override
  String get orderReceivedSubtitle =>
      'Your order has been received and will be packed shortly.';

  @override
  String get viewMyOrdersButton => 'View My Orders';

  @override
  String get continueShoppingButton => 'Continue Shopping';

  @override
  String get guestUser => 'Guest';

  @override
  String failedToLoadHomeData(String error) {
    return 'Failed to load home data: $error';
  }

  @override
  String get productLabel => 'Product';

  @override
  String removedFromFavoritesMessage(String name) {
    return '$name removed from favorites';
  }

  @override
  String addedToFavoritesMessage(String name) {
    return '$name added to favorites';
  }

  @override
  String get failedToUpdateFavoriteStatus => 'Failed to update favorite status';

  @override
  String get pinLimitReached =>
      'You can only pin up to 3 shops. Please unpin a shop first.';

  @override
  String unpinnedSuccessfully(String name) {
    return '$name unpinned successfully';
  }

  @override
  String pinnedSuccessfully(String name) {
    return '$name pinned successfully';
  }

  @override
  String get failedToUpdatePinStatus => 'Failed to update pin status';

  @override
  String get shopReviewsTooltip => 'Shop Reviews & Feedback';

  @override
  String productsCount(int count) {
    return '$count products';
  }

  @override
  String get selectOption => 'Select Option';

  @override
  String get quantityLabel => 'Quantity';

  @override
  String get addedToCartLabel => 'Added to cart';

  @override
  String get addToCartLabel => 'Add to cart';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get noNotificationsYet => 'No notifications yet';

  @override
  String get orderNotificationPlaced => 'Your order has been placed';

  @override
  String get orderNotificationPreparing => 'Shop is preparing your order';

  @override
  String get orderNotificationOnWay => 'Your order is on the way!';

  @override
  String get orderNotificationDelivered => 'Order delivered successfully 🎉';

  @override
  String get orderNotificationCancelled => 'Order was cancelled';

  @override
  String minutesAgo(int count) {
    return '${count}m ago';
  }

  @override
  String hoursAgo(int count) {
    return '${count}h ago';
  }

  @override
  String daysAgo(int count) {
    return '${count}d ago';
  }

  @override
  String reviewShopTitle(String shopName) {
    return 'Review $shopName';
  }

  @override
  String get rateYourExperienceTitle => 'Rate your experience';

  @override
  String rateExperienceSubtitle(String shopName) {
    return 'Please rate the following aspects of your order from $shopName.';
  }

  @override
  String get productQualityRatingLabel => 'Product Quality';

  @override
  String get productQualityRatingSub => 'How was the quality of the products?';

  @override
  String get productQualityRatingHint =>
      'Fresh products, good quality, original items...';

  @override
  String get deliveryTimelinessRatingLabel => 'Delivery Timeliness';

  @override
  String get deliveryTimelinessRatingSub => 'Was your order delivered on time?';

  @override
  String get deliveryTimelinessRatingHint =>
      'Morning delivery arrived on time...\nEvening delivery was delayed...';

  @override
  String get orderAccuracyRatingLabel => 'Order Accuracy';

  @override
  String get orderAccuracyRatingSub =>
      'Did you receive exactly what you ordered?';

  @override
  String get orderAccuracyRatingHint =>
      'Correct items, correct quantity, correct variants...';

  @override
  String get overallExperienceRatingLabel => 'Overall Experience';

  @override
  String get overallExperienceRatingSub =>
      'Tell us about your overall experience.';

  @override
  String get overallExperienceRatingHint =>
      'Friendly service, great experience, will order again...';

  @override
  String get calculatedAverageLabel => 'Calculated Average:';

  @override
  String get submitReviewButton => 'Submit Review';

  @override
  String get reviewSubmittedSuccess => 'Review submitted successfully!';

  @override
  String reviewSubmittedFailed(String error) {
    return 'Failed to submit review: $error';
  }

  @override
  String get myOrdersTitle => 'My Orders';

  @override
  String get noOrdersYet => 'No orders yet';

  @override
  String get noOrdersSubtitle =>
      'You haven\'t placed any orders yet. Start shopping to see your history here.';

  @override
  String get todayLabel => 'Today';

  @override
  String get last7DaysLabel => 'Last 7 Days';

  @override
  String get last30DaysLabel => 'Last 30 Days';

  @override
  String get allTimeLabel => 'All Time';

  @override
  String get allSlotsLabel => 'All Slots';

  @override
  String get morningSlotLabel => '☀️ Morning Slot';

  @override
  String get eveningSlotLabel => '🌙 Evening Slot';

  @override
  String get pendingStatus => 'Pending';

  @override
  String get acceptedStatus => 'Accepted';

  @override
  String get readyForDeliveryStatus => 'Ready for Delivery';

  @override
  String get outForDeliveryStatus => 'Out for Delivery';

  @override
  String get onTheWayStatus => 'On the way';

  @override
  String get deliveredStatus => 'Delivered';

  @override
  String get cancelledStatus => 'Cancelled';

  @override
  String get morningTimeLabel => '☀️ Morning';

  @override
  String get eveningTimeLabel => '🌙 Evening';

  @override
  String deliverOnLabel(String date) {
    return 'Deliver on: $date';
  }

  @override
  String get orderDetailAddressSection => '📍 Delivery Address';

  @override
  String get orderDetailItemsSection => '🧾 Items';

  @override
  String get orderDetailReviewSection => '⭐ Your Review';

  @override
  String get leaveShopReviewButton => 'Leave Shop Review';

  @override
  String nearLandmarkLabel(String landmark) {
    return 'Near: $landmark';
  }

  @override
  String get myAddressesTitle => 'My Addresses';

  @override
  String get addAddressButton => 'Add Address';

  @override
  String get noAddressesSaved => 'No addresses saved';

  @override
  String get defaultAddressBadge => 'DEFAULT';

  @override
  String get editAddressTitle => 'Edit Address';

  @override
  String get labelFieldTitle => 'Label';

  @override
  String get labelHome => 'Home';

  @override
  String get labelWork => 'Work';

  @override
  String get labelOther => 'Other';

  @override
  String get fieldRequiredValidation => 'Required';

  @override
  String get pinMyLocationButton => 'Pin my location (OSM)';

  @override
  String get mapPickerComingSoon => 'Map picker coming soon (OpenStreetMap)';

  @override
  String get setAsDefaultAddress => 'Set as default address';

  @override
  String get updateAddressButton => 'Update Address';

  @override
  String get favoriteProductsTitle => 'Favorite Products';

  @override
  String get noFavoritesYet => 'No favorites yet';

  @override
  String get noFavoritesSubtitle =>
      'Tap the heart icon on any product to save it here';

  @override
  String get browseProductsButton => 'Browse Products';

  @override
  String outOfStockMessage(String name) {
    return '$name is currently out of stock';
  }

  @override
  String get platformFeedbackTitle => 'Platform Feedback';

  @override
  String get submitFeedbackTab => 'Submit Feedback';

  @override
  String get feedbackHistoryTab => 'Feedback History';

  @override
  String get valueFeedbackHeader => 'We value your feedback';

  @override
  String get feedbackInstruction =>
      'Let us know if you found a bug, want to request a feature, or have suggestions to improve the platform.';

  @override
  String get feedbackTypeLabel => 'Feedback Type';

  @override
  String get suggestionOption => 'Suggestion';

  @override
  String get complaintOption => 'Complaint';

  @override
  String get bugReportOption => 'Bug Report';

  @override
  String get featureRequestOption => 'Feature Request';

  @override
  String get generalOption => 'General';

  @override
  String get rateExperienceHeader => 'How would you rate your experience?';

  @override
  String get yourMessageLabel => 'Your Message';

  @override
  String get feedbackPlaceholder => 'Describe your feedback in detail here...';

  @override
  String get enterMessageError => 'Please enter your message';

  @override
  String get messageLengthError => 'Message must be at least 10 characters';

  @override
  String get feedbackSubmittedSuccess =>
      'Feedback submitted successfully! Thank you.';

  @override
  String get noFeedbackHistory => 'No feedback submitted yet';

  @override
  String get pinnedShopsTitle => 'Pinned Shops';

  @override
  String get noPinnedShopsYet => 'No pinned shops yet';

  @override
  String get noPinnedShopsSubtitle => 'Pin favorite shops for quick access';

  @override
  String get guestUserLabel => 'Guest User';

  @override
  String get myProfileTitle => 'My Profile';

  @override
  String get noPhoneNumberLabel => 'No phone number';

  @override
  String get personalInfoSection => 'Personal Info';

  @override
  String get emailLabel => 'Email';

  @override
  String get genderLabel => 'Gender';

  @override
  String get birthdayLabel => 'Birthday';

  @override
  String get languageLabel => 'Language';

  @override
  String get preferencesSection => 'Preferences';

  @override
  String get recentPurchasesLabel => 'Recent Purchases';

  @override
  String get purchaseHistoryLabel => 'Purchase History';

  @override
  String get platformFeedbackLabel => 'Platform Feedback';

  @override
  String get managementSection => 'Management';

  @override
  String get vendorPanelLabel => 'Vendor Panel';

  @override
  String get vendorPanelSubtitle => 'Manage your shop & orders';

  @override
  String get adminPanelLabel => 'Admin Panel';

  @override
  String get adminPanelSubtitle => 'System administration';

  @override
  String get searchHistoryPlaceholder =>
      'Search order number, shop, product...';

  @override
  String get noHistoryFound => 'No purchase history found';

  @override
  String get noHistorySubtitle => 'Try modifying your filters or search query';

  @override
  String get csvButtonLabel => 'CSV';

  @override
  String get reportButtonLabel => 'Report';

  @override
  String get noOrdersToExport => 'No orders to export';

  @override
  String get csvCopiedSuccess =>
      'Purchase history CSV copied to clipboard! You can paste and save it as a file.';

  @override
  String get reportCopiedSuccess =>
      'Order history text report copied to clipboard! Ready to print or share.';

  @override
  String get totalLabel => 'TOTAL';

  @override
  String get viewDetailsButton => 'View Details';

  @override
  String get searchPurchasesPlaceholder => 'Search purchases...';

  @override
  String get sevenDaysFilter => '7 Days';

  @override
  String get thirtyDaysFilter => '30 Days';

  @override
  String get ninetyDaysFilter => '90 Days';

  @override
  String get mostRecentSort => 'Most Recent';

  @override
  String get mostOrderedSort => 'Most Ordered';

  @override
  String get noRecentPurchases => 'No recent purchases';

  @override
  String get noRecentPurchasesSubtitle =>
      'Start shopping to build your history';

  @override
  String get reorderButton => 'Reorder';

  @override
  String get outOfStockLabel => 'Out Stock';

  @override
  String get searchShopsHint => 'Search shops…';

  @override
  String get searchForShopsLabel => 'Search for shops';

  @override
  String get recentSearchesTitle => 'Recent';

  @override
  String get clearButtonLabel => 'Clear';

  @override
  String get noShopsFoundMessage => 'No shops found';

  @override
  String get generalStoreFallback => 'General Store';

  @override
  String get catalogTab => 'Catalog';

  @override
  String get reviewsTab => 'Reviews';

  @override
  String get noItemsInShop => 'No items in this shop';

  @override
  String get noReviewsYet => 'No reviews yet';

  @override
  String get noReviewsSubtitle => 'Be the first customer to review this shop.';

  @override
  String get writeFirstReviewButton => 'Write First Review';

  @override
  String get reviewsTitle => 'Reviews';

  @override
  String get verifiedPurchaseBadge => 'Verified Purchase';

  @override
  String get anonymousReviewer => 'Anonymous';

  @override
  String get runPreparedSuccess => 'Run prepared successfully! Orders linked.';

  @override
  String runPreparedFailed(String error) {
    return 'Failed to prepare run: $error';
  }

  @override
  String runUpdatedMessage(String status) {
    return 'Run updated to: $status';
  }

  @override
  String runUpdatedFailed(String error) {
    return 'Failed to update run: $error';
  }

  @override
  String get deliveryRunsManagementTitle => 'Delivery Runs Management';

  @override
  String get runNotStarted => 'Not Started';

  @override
  String get runPrepare => 'Prepare Run';

  @override
  String get runPacking => 'Packing';

  @override
  String get runStartDelivery => 'Start Delivery';

  @override
  String get runOutForDelivery => 'Out for Delivery';

  @override
  String get runComplete => 'Complete Run';

  @override
  String get runCompleted => 'Completed';

  @override
  String get ordersCountLabel => 'Orders';

  @override
  String get runValueLabel => 'Value';

  @override
  String get viewOrdersButton => 'View Orders';

  @override
  String get vendorPanelTitle => 'Vendor Panel';

  @override
  String get welcomeBackTo => 'Welcome back to ';

  @override
  String get viewMyShopButton => 'View My Shop';

  @override
  String get quickActionsTitle => 'Quick Actions';

  @override
  String get addNewProductAction => 'Add New Product';

  @override
  String get viewProductsAction => 'View Products';

  @override
  String get manageOrdersAction => 'Manage Orders';

  @override
  String get commissionStatsAction => 'Commission Stats';

  @override
  String get customerCreditAction => 'Customer Credit';

  @override
  String get shopSettingsAction => 'Shop Settings';

  @override
  String get vendorPortalTitle => 'Vendor Portal';

  @override
  String get vendorDrawerDashboard => 'Dashboard';

  @override
  String get vendorDrawerAllProducts => 'All Products';

  @override
  String get vendorDrawerAddProduct => 'Add Product';

  @override
  String get vendorDrawerOrders => 'Orders';

  @override
  String get vendorDrawerCustomerCredit => 'Customer Credit';

  @override
  String get vendorDrawerCommissions => 'Commissions';

  @override
  String get vendorDrawerMyShops => 'My Shops';

  @override
  String get backToMarketplace => 'Back to Marketplace';

  @override
  String get itemMarkedLive => 'Product is now Live';

  @override
  String get itemMarkedHidden => 'Product is now Hidden';

  @override
  String get deleteProductDialogTitle => 'Delete Product';

  @override
  String deleteProductDialogMessage(String name) {
    return 'Permanently delete \"$name\"? This cannot be undone.';
  }

  @override
  String get productDeletedSuccess => 'Product deleted successfully';

  @override
  String get manageProductsTitle => 'Manage Products';

  @override
  String get searchProductsPlaceholder => 'Search products by name...';

  @override
  String get filterAll => 'All';

  @override
  String get filterLive => 'Live';

  @override
  String get filterDraft => 'Draft';

  @override
  String get filterInactive => 'Inactive';

  @override
  String get noProductsFound => 'No products found';

  @override
  String get statusDraft => 'Draft';

  @override
  String get statusIncomplete => 'Incomplete';

  @override
  String get statusReady => 'Ready';

  @override
  String get statusHidden => 'Hidden';

  @override
  String get statusRejected => 'Rejected';

  @override
  String get statusOutOfStock => 'Out Of Stock';

  @override
  String get deactivateTooltip => 'Deactivate';

  @override
  String get goLiveTooltip => 'Go Live';

  @override
  String get vendorManageOrdersTitle => 'Manage Orders';

  @override
  String get resetDateButton => 'Reset Date';

  @override
  String get allStatusesFilter => 'All Statuses';

  @override
  String vendorDeliverOnLabel(String date) {
    return 'Deliver on: $date';
  }

  @override
  String get vendorNoOrders => 'No orders yet';

  @override
  String vendorNoStatusOrders(String status) {
    return 'No $status orders found';
  }

  @override
  String get orderTimelineTitle => 'Order Timeline';

  @override
  String get orderedItemsTitle => 'Ordered Items';

  @override
  String get totalFinalPriceTitle => 'Total Final Price';

  @override
  String get cancelOrderButton => 'Cancel Order';

  @override
  String get shopCreatedSuccess => 'Shop created successfully!';

  @override
  String shopCreatedFailed(String error) {
    return 'Failed to create shop: $error';
  }

  @override
  String get vendorShopsTitle => 'Shop Settings';

  @override
  String get shopProfileSection => 'Shop Profile';

  @override
  String get manageShopSettingsSubtitle =>
      'Manage your shop details and settings';

  @override
  String get setupShopSubtitle => 'Set up your shop to start selling';

  @override
  String get yourShopsTitle => 'Your Shops';

  @override
  String get orderNotificationsTitle => 'Order notifications';

  @override
  String get orderNotificationsSubtitle => 'Enabled for all order updates';

  @override
  String get appVersionTitle => 'App version';

  @override
  String get failedToAddToCart => 'Failed to add to cart';

  @override
  String failedToLoadOrderDetails(String error) {
    return 'Failed to load order details: $error';
  }

  @override
  String failedToLoadHistory(String error) {
    return 'Failed to load history: $error';
  }

  @override
  String failedToSubmitFeedback(String error) {
    return 'Failed to submit feedback: $error';
  }

  @override
  String failedToLoadReviews(String error) {
    return 'Failed to load reviews: $error';
  }

  @override
  String get waitingUserConfirmation => 'Waiting for user confirmation';

  @override
  String get authWelcomeBack => 'Welcome back';

  @override
  String get authSignInSubtitle => 'Sign in to your Angadi account';

  @override
  String get authPhoneLogin => 'Phone Login';

  @override
  String get authEmailLogin => 'Email Login';

  @override
  String get authForgotPassword => 'Forgot Password?';

  @override
  String get authSignIn => 'Sign In';

  @override
  String get authCreateAccount => 'Create account';

  @override
  String get authJoinSubtitle => 'Join Angadi — enter details to get started';

  @override
  String get authUsePhone => 'Use Phone Number';

  @override
  String get authUseEmail => 'Use Email Address';

  @override
  String get authRegister => 'Register';

  @override
  String get authResetPassword => 'Reset password';

  @override
  String get authResetPwInstructions =>
      'Enter your details to receive password reset instructions';

  @override
  String get authCheckInboxReset => 'Check your inbox for a reset link';

  @override
  String get authEmailAccounts => 'Email Accounts';

  @override
  String get authPhoneAccounts => 'Phone Accounts';

  @override
  String get authSendResetLink => 'Send Reset Link';

  @override
  String get authGoToLogin => 'Go to Login';

  @override
  String get authRememberPw => 'Remember your password?';

  @override
  String get authSignInLink => 'Sign in';

  @override
  String authResetLinkSentTo(String email) {
    return 'A password reset link has been successfully sent to $email. Please check your inbox and spam folders.';
  }

  @override
  String get authCompleteRegistration => 'Complete registration';

  @override
  String get authFewDetailsSetup => 'Just a few details to set up your account';

  @override
  String get authPreferredLanguage => 'Preferred Language';

  @override
  String get authVillageLocation => 'Village / Location';

  @override
  String get authCompleteSetup => 'Complete Setup';

  @override
  String get authLoadingLocations => 'Loading locations...';

  @override
  String get authFullName => 'Full Name';

  @override
  String get authEmail => 'Email';

  @override
  String get authPhone => 'Phone number';

  @override
  String get authPassword => 'Password';

  @override
  String get securityTitle => 'Security Settings';

  @override
  String get securityChangePhone => 'Change Phone Number';

  @override
  String get securityPhoneSuccess => 'Phone number updated successfully!';

  @override
  String get securityActivePhone => 'Active Phone Number';

  @override
  String get securityRequestPhoneChange => 'Request Phone Change';

  @override
  String get securitySending => 'Sending...';

  @override
  String securityEnterVerificationCode(String phone) {
    return 'Enter Verification Code sent to $phone';
  }

  @override
  String get securityDidntReceiveCode => 'Didn\'t receive code?';

  @override
  String securityResendIn(String countdown) {
    return 'Resend in ${countdown}s';
  }

  @override
  String get securityResendOtp => 'Resend OTP';

  @override
  String get securityCancel => 'Cancel';

  @override
  String get securityVerifyChange => 'Verify & Change';

  @override
  String get securityVerifying => 'Verifying...';

  @override
  String get securityChangePassword => 'Change Account Password';

  @override
  String get securityPasswordSuccess => 'Password updated successfully!';

  @override
  String get securityNewPassword => 'New Password';

  @override
  String get securityConfirmNewPassword => 'Confirm New Password';

  @override
  String get securityUpdatePassword => 'Update Password';

  @override
  String get securitySaving => 'Saving...';

  @override
  String get securityDangerZone => 'Danger Zone';

  @override
  String get securityDangerZoneDesc =>
      'Logging out from all devices will terminate all your active sessions across web browsers, mobile apps, and other logged-in clients.';

  @override
  String get securitySignOutAll => 'Sign Out From All Devices';

  @override
  String get securityLoggingOut => 'Logging out...';

  @override
  String get securityConfirmSignOutAll =>
      'Are you sure you want to sign out from all devices? You will need to log in again on all your active devices.';

  @override
  String get authNoAccountPrompt => 'Don\'t have an account? ';

  @override
  String get authAlreadyHaveAccount => 'Already have an account? ';

  @override
  String get authAccountType => 'Account Type';

  @override
  String get authCustomerRole => 'Customer';

  @override
  String get authShopOwnerRole => 'Shop Owner';

  @override
  String get authVerifyPhone => 'Verify Phone Number';

  @override
  String get authVerifyCode => 'Verify Code';

  @override
  String get authVerificationCodeResent => 'Verification code resent!';

  @override
  String get selectLocationTitle => 'Select Location';

  @override
  String get searchLocationsHint => 'Search locations…';

  @override
  String get allLocationsOption => 'All Locations';

  @override
  String failedToLoadLocations(String error) {
    return 'Failed to load locations: $error';
  }

  @override
  String get noLocationsMatch => 'No locations match your search.';

  @override
  String get vendorFooterDashboard => 'Dashboard';

  @override
  String get vendorFooterOrders => 'Orders';

  @override
  String get vendorFooterProducts => 'Products';

  @override
  String get vendorFooterCredit => 'Credit';

  @override
  String get vendorFooterExit => 'Exit';

  @override
  String get vendorEditProduct => 'Edit Product';

  @override
  String get vendorUserCreditDetail => 'User Credit Detail';

  @override
  String get tutorialSkip => 'Skip';

  @override
  String get tutorialNext => 'Next';

  @override
  String get tutorialFinish => 'Finish';

  @override
  String get tutorialHomeLocationTitle => 'Select Location';

  @override
  String get tutorialHomeLocationDesc =>
      'Tap here to change your village or marketplace location.';

  @override
  String get tutorialHomeSearchTitle => 'Search Shops';

  @override
  String get tutorialHomeSearchDesc =>
      'Find your favorite local shops by typing here.';

  @override
  String get tutorialHomeCategoryTitle => 'Categories';

  @override
  String get tutorialHomeCategoryDesc =>
      'Filter fresh groceries and items by category.';

  @override
  String get tutorialHomeShopCardTitle => 'Explore Shops';

  @override
  String get tutorialHomeShopCardDesc =>
      'Tap on any shop to see its available items.';

  @override
  String get tutorialShopFilterTitle => 'Filter by Category';

  @override
  String get tutorialShopFilterDesc =>
      'Tap a category to quickly filter and find specific items.';

  @override
  String get tutorialShopProductTitle => 'View Products';

  @override
  String get tutorialShopProductDesc =>
      'See prices, images, and details of all available items.';

  @override
  String get tutorialShopOpenTitle => 'Open Product';

  @override
  String get tutorialShopOpenDesc =>
      'Tap on any item card to see more details and add it to your bag.';

  @override
  String get shopOwnersTitle => 'Shop Owners / Co-Owners';

  @override
  String get addCoOwner => 'Add Co-Owner';

  @override
  String get removeCoOwner => 'Remove Co-Owner';

  @override
  String get maxOwnersLimit => 'Max 3 Limit';

  @override
  String get deleteShop => 'Delete Shop';

  @override
  String get primaryOwner => 'Primary Owner';

  @override
  String get coOwner => 'Co-Owner';

  @override
  String get signInYourAccount => 'Sign In Your Account';

  @override
  String get signUpYourAccount => 'Sign Up Your Account';

  @override
  String get emailAddress => 'Email Address';

  @override
  String get phoneNumber => 'Phone Number';

  @override
  String get rememberMe => 'Remember Me';

  @override
  String get forgotPassword => 'Forgot Password?';

  @override
  String get completeRegistration => 'Complete Registration';

  @override
  String get alreadyHaveAccountQuestion => 'Already Have An Account?';

  @override
  String get dontHaveAccount => 'Don\'t Have An Account?';

  @override
  String get usePhone => 'Phone';

  @override
  String get useEmail => 'Email';

  @override
  String get agreeTerms => 'I agree to the';

  @override
  String get termsConditions => 'terms & conditions';

  @override
  String get orderSuccessSubtitle =>
      'Thank you for your order! The shop vendor has been notified and is preparing your delivery.';

  @override
  String get estimatedDeliveryLabel => 'Est. Delivery:';

  @override
  String get estimatedDeliveryValue => 'Within 30–45 mins';

  @override
  String get orderIdCopiedToast => 'Order ID copied to clipboard!';

  @override
  String get coOwnersDesc =>
      'Collaborate up to 3 owners on a single shop with full vendor access.';

  @override
  String get addCoOwnerBtn => '+ Add Co-Owner';

  @override
  String get addCoOwnerModalTitle => 'Add Shop Co-Owner (Max 3)';

  @override
  String get selectRegisteredUser => 'Select Registered User';

  @override
  String get maxOwnersReached => 'Max 3 Owners Limit Reached';

  @override
  String get cannotRemoveOnlyOwner => 'Cannot remove the only owner of a shop.';

  @override
  String get confirmRemoveCoOwner =>
      'Are you sure you want to remove this co-owner?';

  @override
  String get coOwnerAddedSuccess => 'Co-owner added successfully!';

  @override
  String get coOwnerRemovedSuccess => 'Co-owner removed successfully!';

  @override
  String get loyaltyClubTitle => '5-Star Rewards Club';

  @override
  String loyaltyProgressLabel(Object stars) {
    return '$stars / 5 Stars Collected';
  }

  @override
  String get loyaltyStarEarnedNotice =>
      '🎉 +1 Star Earned on this delivered order!';

  @override
  String loyaltyKeepCollectingNotice(Object remaining) {
    return '⭐ Collect $remaining more Star to unlock your next Lucky Scratch Card!';
  }

  @override
  String get loyaltyScratchCardUnlockedTitle =>
      '🎉 Lucky Scratch Card Unlocked!';

  @override
  String get loyaltyScratchCardUnlockedDesc =>
      'Scratch to reveal your guaranteed ₹2–₹15 Angadi Credit reward!';

  @override
  String get loyaltyScratchNowBtn => 'Scratch Now 🎟️';

  @override
  String get loyaltyScratchDialogTitle => '🎟️ Lucky Scratch Card';

  @override
  String get loyaltyScratchDialogSubtitle =>
      'Rub the metallic surface to reveal your guaranteed reward!';

  @override
  String get loyaltyClaimRewardBtn => 'Claim Reward 🎁';

  @override
  String get loyaltyRewardClaimedTitle => '🎉 Congratulations!';

  @override
  String loyaltyRewardClaimedSubtitle(Object amount) {
    return '₹$amount Angadi Credit added to your wallet!';
  }

  @override
  String get loyaltyCloseBtn => 'Close';
}
