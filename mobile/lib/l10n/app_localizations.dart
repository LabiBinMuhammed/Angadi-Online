import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_ml.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
    Locale('hi'),
    Locale('ml')
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Angadi'**
  String get appTitle;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navOrders.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get navOrders;

  /// No description provided for @navCart.
  ///
  /// In en, this message translates to:
  /// **'Bag'**
  String get navCart;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @navSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get navSettings;

  /// No description provided for @searchPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search products...'**
  String get searchPlaceholder;

  /// No description provided for @addToCart.
  ///
  /// In en, this message translates to:
  /// **'Add to Cart'**
  String get addToCart;

  /// No description provided for @buyNow.
  ///
  /// In en, this message translates to:
  /// **'Buy Now'**
  String get buyNow;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign Out'**
  String get signOut;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @languagePreference.
  ///
  /// In en, this message translates to:
  /// **'Language Preference'**
  String get languagePreference;

  /// No description provided for @themeMode.
  ///
  /// In en, this message translates to:
  /// **'Theme Mode'**
  String get themeMode;

  /// No description provided for @darkMode.
  ///
  /// In en, this message translates to:
  /// **'Dark Mode'**
  String get darkMode;

  /// No description provided for @lightMode.
  ///
  /// In en, this message translates to:
  /// **'Light Mode'**
  String get lightMode;

  /// No description provided for @cashOnDelivery.
  ///
  /// In en, this message translates to:
  /// **'Cash on Delivery'**
  String get cashOnDelivery;

  /// No description provided for @creditPayment.
  ///
  /// In en, this message translates to:
  /// **'Credit Payment'**
  String get creditPayment;

  /// No description provided for @placeOrder.
  ///
  /// In en, this message translates to:
  /// **'Place Order'**
  String get placeOrder;

  /// No description provided for @totalPrice.
  ///
  /// In en, this message translates to:
  /// **'Total Price'**
  String get totalPrice;

  /// No description provided for @orderStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get orderStatusPending;

  /// No description provided for @orderStatusPacking.
  ///
  /// In en, this message translates to:
  /// **'Packing'**
  String get orderStatusPacking;

  /// No description provided for @orderStatusDelivering.
  ///
  /// In en, this message translates to:
  /// **'Delivering'**
  String get orderStatusDelivering;

  /// No description provided for @orderStatusDelivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get orderStatusDelivered;

  /// No description provided for @orderStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get orderStatusCancelled;

  /// No description provided for @heyGreeting.
  ///
  /// In en, this message translates to:
  /// **'Hey'**
  String get heyGreeting;

  /// No description provided for @findGroceriesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Find fresh groceries you want'**
  String get findGroceriesSubtitle;

  /// No description provided for @searchShopsPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search shops...'**
  String get searchShopsPlaceholder;

  /// No description provided for @searchItemsPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search items...'**
  String get searchItemsPlaceholder;

  /// No description provided for @noShopsFound.
  ///
  /// In en, this message translates to:
  /// **'No shops found.'**
  String get noShopsFound;

  /// No description provided for @noItemsFound.
  ///
  /// In en, this message translates to:
  /// **'No items found.'**
  String get noItemsFound;

  /// No description provided for @productsLabel.
  ///
  /// In en, this message translates to:
  /// **'products'**
  String get productsLabel;

  /// No description provided for @categoriesTitle.
  ///
  /// In en, this message translates to:
  /// **'Categories'**
  String get categoriesTitle;

  /// No description provided for @clearLabel.
  ///
  /// In en, this message translates to:
  /// **'CLEAR'**
  String get clearLabel;

  /// No description provided for @popularTitle.
  ///
  /// In en, this message translates to:
  /// **'Popular'**
  String get popularTitle;

  /// No description provided for @shopItemsTitle.
  ///
  /// In en, this message translates to:
  /// **'Shop Items'**
  String get shopItemsTitle;

  /// No description provided for @addButtonLabel.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get addButtonLabel;

  /// No description provided for @bestOrganic.
  ///
  /// In en, this message translates to:
  /// **'Best organic fresh vegetables'**
  String get bestOrganic;

  /// No description provided for @greatDeals.
  ///
  /// In en, this message translates to:
  /// **'Great deals on fruit'**
  String get greatDeals;

  /// No description provided for @addingToCartMessage.
  ///
  /// In en, this message translates to:
  /// **'Adding {name} to cart...'**
  String addingToCartMessage(String name);

  /// No description provided for @addedToCartMessage.
  ///
  /// In en, this message translates to:
  /// **'{name} added to cart!'**
  String addedToCartMessage(String name);

  /// No description provided for @deliverySchedule.
  ///
  /// In en, this message translates to:
  /// **'Delivery Schedule'**
  String get deliverySchedule;

  /// No description provided for @changeDate.
  ///
  /// In en, this message translates to:
  /// **'Change Date'**
  String get changeDate;

  /// No description provided for @morning.
  ///
  /// In en, this message translates to:
  /// **'Morning'**
  String get morning;

  /// No description provided for @evening.
  ///
  /// In en, this message translates to:
  /// **'Evening'**
  String get evening;

  /// No description provided for @myBag.
  ///
  /// In en, this message translates to:
  /// **'My Bag'**
  String get myBag;

  /// No description provided for @yourBagIsEmpty.
  ///
  /// In en, this message translates to:
  /// **'Your bag is empty'**
  String get yourBagIsEmpty;

  /// No description provided for @browseShops.
  ///
  /// In en, this message translates to:
  /// **'Browse Shops'**
  String get browseShops;

  /// No description provided for @total.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get total;

  /// No description provided for @proceedToCheckout.
  ///
  /// In en, this message translates to:
  /// **'Proceed To Checkout'**
  String get proceedToCheckout;

  /// No description provided for @cutoffPassed.
  ///
  /// In en, this message translates to:
  /// **'Cutoff passed'**
  String get cutoffPassed;

  /// No description provided for @limitReached.
  ///
  /// In en, this message translates to:
  /// **'Limit reached'**
  String get limitReached;

  /// No description provided for @unavailable.
  ///
  /// In en, this message translates to:
  /// **'Unavailable'**
  String get unavailable;

  /// No description provided for @itemsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} items'**
  String itemsCount(int count);

  /// No description provided for @exploreCategoriesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Explore fresh products by category'**
  String get exploreCategoriesSubtitle;

  /// No description provided for @searchCategoriesPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search categories...'**
  String get searchCategoriesPlaceholder;

  /// No description provided for @noCategoriesFound.
  ///
  /// In en, this message translates to:
  /// **'No categories found'**
  String get noCategoriesFound;

  /// No description provided for @productsAvailable.
  ///
  /// In en, this message translates to:
  /// **'{count} products available'**
  String productsAvailable(int count);

  /// No description provided for @noItemsInCategory.
  ///
  /// In en, this message translates to:
  /// **'No items in this category yet.'**
  String get noItemsInCategory;

  /// No description provided for @checkoutTitle.
  ///
  /// In en, this message translates to:
  /// **'Checkout'**
  String get checkoutTitle;

  /// No description provided for @deliveryAddressTitle.
  ///
  /// In en, this message translates to:
  /// **'Delivery Address'**
  String get deliveryAddressTitle;

  /// No description provided for @selectAddressLabel.
  ///
  /// In en, this message translates to:
  /// **'Select Address'**
  String get selectAddressLabel;

  /// No description provided for @changeAddressLabel.
  ///
  /// In en, this message translates to:
  /// **'Change Address'**
  String get changeAddressLabel;

  /// No description provided for @addNewAddressLabel.
  ///
  /// In en, this message translates to:
  /// **'Add New Address'**
  String get addNewAddressLabel;

  /// No description provided for @noAddressesFound.
  ///
  /// In en, this message translates to:
  /// **'No addresses found.'**
  String get noAddressesFound;

  /// No description provided for @addressLabel.
  ///
  /// In en, this message translates to:
  /// **'Address Name *'**
  String get addressLabel;

  /// No description provided for @addressLabelPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Home, Hostel, Office, etc.'**
  String get addressLabelPlaceholder;

  /// No description provided for @contactNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Contact Name *'**
  String get contactNameLabel;

  /// No description provided for @fullNamePlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get fullNamePlaceholder;

  /// No description provided for @contactPhoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Contact Phone *'**
  String get contactPhoneLabel;

  /// No description provided for @addressLine1Label.
  ///
  /// In en, this message translates to:
  /// **'Address Line 1 *'**
  String get addressLine1Label;

  /// No description provided for @addressLine1Placeholder.
  ///
  /// In en, this message translates to:
  /// **'Street, building, house no.'**
  String get addressLine1Placeholder;

  /// No description provided for @addressLine2Label.
  ///
  /// In en, this message translates to:
  /// **'Address Line 2 (Optional)'**
  String get addressLine2Label;

  /// No description provided for @addressLine2Placeholder.
  ///
  /// In en, this message translates to:
  /// **'Apartment, floor, unit'**
  String get addressLine2Placeholder;

  /// No description provided for @landmarkLabel.
  ///
  /// In en, this message translates to:
  /// **'Landmark (Optional)'**
  String get landmarkLabel;

  /// No description provided for @landmarkPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'E.g., near City Mall'**
  String get landmarkPlaceholder;

  /// No description provided for @saveToAddressBook.
  ///
  /// In en, this message translates to:
  /// **'Save to my address book'**
  String get saveToAddressBook;

  /// No description provided for @closeButton.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get closeButton;

  /// No description provided for @backButton.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get backButton;

  /// No description provided for @useAddressButton.
  ///
  /// In en, this message translates to:
  /// **'Use Address'**
  String get useAddressButton;

  /// No description provided for @thisTimeOnlyLabel.
  ///
  /// In en, this message translates to:
  /// **'This Time Only'**
  String get thisTimeOnlyLabel;

  /// No description provided for @noAddressSelected.
  ///
  /// In en, this message translates to:
  /// **'No address selected'**
  String get noAddressSelected;

  /// No description provided for @deliveryScheduleTitle.
  ///
  /// In en, this message translates to:
  /// **'DELIVERY SCHEDULE'**
  String get deliveryScheduleTitle;

  /// No description provided for @paymentMethodTitle.
  ///
  /// In en, this message translates to:
  /// **'Payment Method'**
  String get paymentMethodTitle;

  /// No description provided for @orderSummaryTitle.
  ///
  /// In en, this message translates to:
  /// **'Order Summary'**
  String get orderSummaryTitle;

  /// No description provided for @totalAmountTitle.
  ///
  /// In en, this message translates to:
  /// **'Total Amount'**
  String get totalAmountTitle;

  /// No description provided for @placeOrderButton.
  ///
  /// In en, this message translates to:
  /// **'Place Order'**
  String get placeOrderButton;

  /// No description provided for @fillRequiredFieldsError.
  ///
  /// In en, this message translates to:
  /// **'Please fill all required (*) fields.'**
  String get fillRequiredFieldsError;

  /// No description provided for @orderPlacementFailed.
  ///
  /// In en, this message translates to:
  /// **'Order placement failed: {error}'**
  String orderPlacementFailed(String error);

  /// No description provided for @orderPlacedTitle.
  ///
  /// In en, this message translates to:
  /// **'Order Placed!'**
  String get orderPlacedTitle;

  /// No description provided for @orderIdLabel.
  ///
  /// In en, this message translates to:
  /// **'Order #{orderId}'**
  String orderIdLabel(String orderId);

  /// No description provided for @orderReceivedSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Your order has been received and will be packed shortly.'**
  String get orderReceivedSubtitle;

  /// No description provided for @viewMyOrdersButton.
  ///
  /// In en, this message translates to:
  /// **'View My Orders'**
  String get viewMyOrdersButton;

  /// No description provided for @continueShoppingButton.
  ///
  /// In en, this message translates to:
  /// **'Continue Shopping'**
  String get continueShoppingButton;

  /// No description provided for @guestUser.
  ///
  /// In en, this message translates to:
  /// **'Guest'**
  String get guestUser;

  /// No description provided for @failedToLoadHomeData.
  ///
  /// In en, this message translates to:
  /// **'Failed to load home data: {error}'**
  String failedToLoadHomeData(String error);

  /// No description provided for @productLabel.
  ///
  /// In en, this message translates to:
  /// **'Product'**
  String get productLabel;

  /// No description provided for @removedFromFavoritesMessage.
  ///
  /// In en, this message translates to:
  /// **'{name} removed from favorites'**
  String removedFromFavoritesMessage(String name);

  /// No description provided for @addedToFavoritesMessage.
  ///
  /// In en, this message translates to:
  /// **'{name} added to favorites'**
  String addedToFavoritesMessage(String name);

  /// No description provided for @failedToUpdateFavoriteStatus.
  ///
  /// In en, this message translates to:
  /// **'Failed to update favorite status'**
  String get failedToUpdateFavoriteStatus;

  /// No description provided for @pinLimitReached.
  ///
  /// In en, this message translates to:
  /// **'You can only pin up to 3 shops. Please unpin a shop first.'**
  String get pinLimitReached;

  /// No description provided for @unpinnedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'{name} unpinned successfully'**
  String unpinnedSuccessfully(String name);

  /// No description provided for @pinnedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'{name} pinned successfully'**
  String pinnedSuccessfully(String name);

  /// No description provided for @failedToUpdatePinStatus.
  ///
  /// In en, this message translates to:
  /// **'Failed to update pin status'**
  String get failedToUpdatePinStatus;

  /// No description provided for @shopReviewsTooltip.
  ///
  /// In en, this message translates to:
  /// **'Shop Reviews & Feedback'**
  String get shopReviewsTooltip;

  /// No description provided for @productsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} products'**
  String productsCount(int count);

  /// No description provided for @selectOption.
  ///
  /// In en, this message translates to:
  /// **'Select Option'**
  String get selectOption;

  /// No description provided for @quantityLabel.
  ///
  /// In en, this message translates to:
  /// **'Quantity'**
  String get quantityLabel;

  /// No description provided for @addedToCartLabel.
  ///
  /// In en, this message translates to:
  /// **'Added to cart'**
  String get addedToCartLabel;

  /// No description provided for @addToCartLabel.
  ///
  /// In en, this message translates to:
  /// **'Add to cart'**
  String get addToCartLabel;

  /// No description provided for @notificationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @noNotificationsYet.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet'**
  String get noNotificationsYet;

  /// No description provided for @orderNotificationPlaced.
  ///
  /// In en, this message translates to:
  /// **'Your order has been placed'**
  String get orderNotificationPlaced;

  /// No description provided for @orderNotificationPreparing.
  ///
  /// In en, this message translates to:
  /// **'Shop is preparing your order'**
  String get orderNotificationPreparing;

  /// No description provided for @orderNotificationOnWay.
  ///
  /// In en, this message translates to:
  /// **'Your order is on the way!'**
  String get orderNotificationOnWay;

  /// No description provided for @orderNotificationDelivered.
  ///
  /// In en, this message translates to:
  /// **'Order delivered successfully 🎉'**
  String get orderNotificationDelivered;

  /// No description provided for @orderNotificationCancelled.
  ///
  /// In en, this message translates to:
  /// **'Order was cancelled'**
  String get orderNotificationCancelled;

  /// No description provided for @minutesAgo.
  ///
  /// In en, this message translates to:
  /// **'{count}m ago'**
  String minutesAgo(int count);

  /// No description provided for @hoursAgo.
  ///
  /// In en, this message translates to:
  /// **'{count}h ago'**
  String hoursAgo(int count);

  /// No description provided for @daysAgo.
  ///
  /// In en, this message translates to:
  /// **'{count}d ago'**
  String daysAgo(int count);

  /// No description provided for @reviewShopTitle.
  ///
  /// In en, this message translates to:
  /// **'Review {shopName}'**
  String reviewShopTitle(String shopName);

  /// No description provided for @rateYourExperienceTitle.
  ///
  /// In en, this message translates to:
  /// **'Rate your experience'**
  String get rateYourExperienceTitle;

  /// No description provided for @rateExperienceSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Please rate the following aspects of your order from {shopName}.'**
  String rateExperienceSubtitle(String shopName);

  /// No description provided for @productQualityRatingLabel.
  ///
  /// In en, this message translates to:
  /// **'Product Quality'**
  String get productQualityRatingLabel;

  /// No description provided for @productQualityRatingSub.
  ///
  /// In en, this message translates to:
  /// **'How was the quality of the products?'**
  String get productQualityRatingSub;

  /// No description provided for @productQualityRatingHint.
  ///
  /// In en, this message translates to:
  /// **'Fresh products, good quality, original items...'**
  String get productQualityRatingHint;

  /// No description provided for @deliveryTimelinessRatingLabel.
  ///
  /// In en, this message translates to:
  /// **'Delivery Timeliness'**
  String get deliveryTimelinessRatingLabel;

  /// No description provided for @deliveryTimelinessRatingSub.
  ///
  /// In en, this message translates to:
  /// **'Was your order delivered on time?'**
  String get deliveryTimelinessRatingSub;

  /// No description provided for @deliveryTimelinessRatingHint.
  ///
  /// In en, this message translates to:
  /// **'Morning delivery arrived on time...\nEvening delivery was delayed...'**
  String get deliveryTimelinessRatingHint;

  /// No description provided for @orderAccuracyRatingLabel.
  ///
  /// In en, this message translates to:
  /// **'Order Accuracy'**
  String get orderAccuracyRatingLabel;

  /// No description provided for @orderAccuracyRatingSub.
  ///
  /// In en, this message translates to:
  /// **'Did you receive exactly what you ordered?'**
  String get orderAccuracyRatingSub;

  /// No description provided for @orderAccuracyRatingHint.
  ///
  /// In en, this message translates to:
  /// **'Correct items, correct quantity, correct variants...'**
  String get orderAccuracyRatingHint;

  /// No description provided for @overallExperienceRatingLabel.
  ///
  /// In en, this message translates to:
  /// **'Overall Experience'**
  String get overallExperienceRatingLabel;

  /// No description provided for @overallExperienceRatingSub.
  ///
  /// In en, this message translates to:
  /// **'Tell us about your overall experience.'**
  String get overallExperienceRatingSub;

  /// No description provided for @overallExperienceRatingHint.
  ///
  /// In en, this message translates to:
  /// **'Friendly service, great experience, will order again...'**
  String get overallExperienceRatingHint;

  /// No description provided for @calculatedAverageLabel.
  ///
  /// In en, this message translates to:
  /// **'Calculated Average:'**
  String get calculatedAverageLabel;

  /// No description provided for @submitReviewButton.
  ///
  /// In en, this message translates to:
  /// **'Submit Review'**
  String get submitReviewButton;

  /// No description provided for @reviewSubmittedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Review submitted successfully!'**
  String get reviewSubmittedSuccess;

  /// No description provided for @reviewSubmittedFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed to submit review: {error}'**
  String reviewSubmittedFailed(String error);

  /// No description provided for @myOrdersTitle.
  ///
  /// In en, this message translates to:
  /// **'My Orders'**
  String get myOrdersTitle;

  /// No description provided for @noOrdersYet.
  ///
  /// In en, this message translates to:
  /// **'No orders yet'**
  String get noOrdersYet;

  /// No description provided for @noOrdersSubtitle.
  ///
  /// In en, this message translates to:
  /// **'You haven\'t placed any orders yet. Start shopping to see your history here.'**
  String get noOrdersSubtitle;

  /// No description provided for @todayLabel.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get todayLabel;

  /// No description provided for @last7DaysLabel.
  ///
  /// In en, this message translates to:
  /// **'Last 7 Days'**
  String get last7DaysLabel;

  /// No description provided for @last30DaysLabel.
  ///
  /// In en, this message translates to:
  /// **'Last 30 Days'**
  String get last30DaysLabel;

  /// No description provided for @allTimeLabel.
  ///
  /// In en, this message translates to:
  /// **'All Time'**
  String get allTimeLabel;

  /// No description provided for @allSlotsLabel.
  ///
  /// In en, this message translates to:
  /// **'All Slots'**
  String get allSlotsLabel;

  /// No description provided for @morningSlotLabel.
  ///
  /// In en, this message translates to:
  /// **'☀️ Morning Slot'**
  String get morningSlotLabel;

  /// No description provided for @eveningSlotLabel.
  ///
  /// In en, this message translates to:
  /// **'🌙 Evening Slot'**
  String get eveningSlotLabel;

  /// No description provided for @pendingStatus.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pendingStatus;

  /// No description provided for @acceptedStatus.
  ///
  /// In en, this message translates to:
  /// **'Accepted'**
  String get acceptedStatus;

  /// No description provided for @readyForDeliveryStatus.
  ///
  /// In en, this message translates to:
  /// **'Ready for Delivery'**
  String get readyForDeliveryStatus;

  /// No description provided for @outForDeliveryStatus.
  ///
  /// In en, this message translates to:
  /// **'Out for Delivery'**
  String get outForDeliveryStatus;

  /// No description provided for @onTheWayStatus.
  ///
  /// In en, this message translates to:
  /// **'On the way'**
  String get onTheWayStatus;

  /// No description provided for @deliveredStatus.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get deliveredStatus;

  /// No description provided for @cancelledStatus.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get cancelledStatus;

  /// No description provided for @morningTimeLabel.
  ///
  /// In en, this message translates to:
  /// **'☀️ Morning'**
  String get morningTimeLabel;

  /// No description provided for @eveningTimeLabel.
  ///
  /// In en, this message translates to:
  /// **'🌙 Evening'**
  String get eveningTimeLabel;

  /// No description provided for @deliverOnLabel.
  ///
  /// In en, this message translates to:
  /// **'Deliver on: {date}'**
  String deliverOnLabel(String date);

  /// No description provided for @orderDetailAddressSection.
  ///
  /// In en, this message translates to:
  /// **'📍 Delivery Address'**
  String get orderDetailAddressSection;

  /// No description provided for @orderDetailItemsSection.
  ///
  /// In en, this message translates to:
  /// **'🧾 Items'**
  String get orderDetailItemsSection;

  /// No description provided for @orderDetailReviewSection.
  ///
  /// In en, this message translates to:
  /// **'⭐ Your Review'**
  String get orderDetailReviewSection;

  /// No description provided for @leaveShopReviewButton.
  ///
  /// In en, this message translates to:
  /// **'Leave Shop Review'**
  String get leaveShopReviewButton;

  /// No description provided for @nearLandmarkLabel.
  ///
  /// In en, this message translates to:
  /// **'Near: {landmark}'**
  String nearLandmarkLabel(String landmark);

  /// No description provided for @myAddressesTitle.
  ///
  /// In en, this message translates to:
  /// **'My Addresses'**
  String get myAddressesTitle;

  /// No description provided for @addAddressButton.
  ///
  /// In en, this message translates to:
  /// **'Add Address'**
  String get addAddressButton;

  /// No description provided for @noAddressesSaved.
  ///
  /// In en, this message translates to:
  /// **'No addresses saved'**
  String get noAddressesSaved;

  /// No description provided for @defaultAddressBadge.
  ///
  /// In en, this message translates to:
  /// **'DEFAULT'**
  String get defaultAddressBadge;

  /// No description provided for @editAddressTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit Address'**
  String get editAddressTitle;

  /// No description provided for @labelFieldTitle.
  ///
  /// In en, this message translates to:
  /// **'Label'**
  String get labelFieldTitle;

  /// No description provided for @labelHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get labelHome;

  /// No description provided for @labelWork.
  ///
  /// In en, this message translates to:
  /// **'Work'**
  String get labelWork;

  /// No description provided for @labelOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get labelOther;

  /// No description provided for @fieldRequiredValidation.
  ///
  /// In en, this message translates to:
  /// **'Required'**
  String get fieldRequiredValidation;

  /// No description provided for @pinMyLocationButton.
  ///
  /// In en, this message translates to:
  /// **'Pin my location (OSM)'**
  String get pinMyLocationButton;

  /// No description provided for @mapPickerComingSoon.
  ///
  /// In en, this message translates to:
  /// **'Map picker coming soon (OpenStreetMap)'**
  String get mapPickerComingSoon;

  /// No description provided for @setAsDefaultAddress.
  ///
  /// In en, this message translates to:
  /// **'Set as default address'**
  String get setAsDefaultAddress;

  /// No description provided for @updateAddressButton.
  ///
  /// In en, this message translates to:
  /// **'Update Address'**
  String get updateAddressButton;

  /// No description provided for @favoriteProductsTitle.
  ///
  /// In en, this message translates to:
  /// **'Favorite Products'**
  String get favoriteProductsTitle;

  /// No description provided for @noFavoritesYet.
  ///
  /// In en, this message translates to:
  /// **'No favorites yet'**
  String get noFavoritesYet;

  /// No description provided for @noFavoritesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Tap the heart icon on any product to save it here'**
  String get noFavoritesSubtitle;

  /// No description provided for @browseProductsButton.
  ///
  /// In en, this message translates to:
  /// **'Browse Products'**
  String get browseProductsButton;

  /// No description provided for @outOfStockMessage.
  ///
  /// In en, this message translates to:
  /// **'{name} is currently out of stock'**
  String outOfStockMessage(String name);

  /// No description provided for @platformFeedbackTitle.
  ///
  /// In en, this message translates to:
  /// **'Platform Feedback'**
  String get platformFeedbackTitle;

  /// No description provided for @submitFeedbackTab.
  ///
  /// In en, this message translates to:
  /// **'Submit Feedback'**
  String get submitFeedbackTab;

  /// No description provided for @feedbackHistoryTab.
  ///
  /// In en, this message translates to:
  /// **'Feedback History'**
  String get feedbackHistoryTab;

  /// No description provided for @valueFeedbackHeader.
  ///
  /// In en, this message translates to:
  /// **'We value your feedback'**
  String get valueFeedbackHeader;

  /// No description provided for @feedbackInstruction.
  ///
  /// In en, this message translates to:
  /// **'Let us know if you found a bug, want to request a feature, or have suggestions to improve the platform.'**
  String get feedbackInstruction;

  /// No description provided for @feedbackTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'Feedback Type'**
  String get feedbackTypeLabel;

  /// No description provided for @suggestionOption.
  ///
  /// In en, this message translates to:
  /// **'Suggestion'**
  String get suggestionOption;

  /// No description provided for @complaintOption.
  ///
  /// In en, this message translates to:
  /// **'Complaint'**
  String get complaintOption;

  /// No description provided for @bugReportOption.
  ///
  /// In en, this message translates to:
  /// **'Bug Report'**
  String get bugReportOption;

  /// No description provided for @featureRequestOption.
  ///
  /// In en, this message translates to:
  /// **'Feature Request'**
  String get featureRequestOption;

  /// No description provided for @generalOption.
  ///
  /// In en, this message translates to:
  /// **'General'**
  String get generalOption;

  /// No description provided for @rateExperienceHeader.
  ///
  /// In en, this message translates to:
  /// **'How would you rate your experience?'**
  String get rateExperienceHeader;

  /// No description provided for @yourMessageLabel.
  ///
  /// In en, this message translates to:
  /// **'Your Message'**
  String get yourMessageLabel;

  /// No description provided for @feedbackPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Describe your feedback in detail here...'**
  String get feedbackPlaceholder;

  /// No description provided for @enterMessageError.
  ///
  /// In en, this message translates to:
  /// **'Please enter your message'**
  String get enterMessageError;

  /// No description provided for @messageLengthError.
  ///
  /// In en, this message translates to:
  /// **'Message must be at least 10 characters'**
  String get messageLengthError;

  /// No description provided for @feedbackSubmittedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Feedback submitted successfully! Thank you.'**
  String get feedbackSubmittedSuccess;

  /// No description provided for @noFeedbackHistory.
  ///
  /// In en, this message translates to:
  /// **'No feedback submitted yet'**
  String get noFeedbackHistory;

  /// No description provided for @pinnedShopsTitle.
  ///
  /// In en, this message translates to:
  /// **'Pinned Shops'**
  String get pinnedShopsTitle;

  /// No description provided for @noPinnedShopsYet.
  ///
  /// In en, this message translates to:
  /// **'No pinned shops yet'**
  String get noPinnedShopsYet;

  /// No description provided for @noPinnedShopsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Pin favorite shops for quick access'**
  String get noPinnedShopsSubtitle;

  /// No description provided for @guestUserLabel.
  ///
  /// In en, this message translates to:
  /// **'Guest User'**
  String get guestUserLabel;

  /// No description provided for @myProfileTitle.
  ///
  /// In en, this message translates to:
  /// **'My Profile'**
  String get myProfileTitle;

  /// No description provided for @noPhoneNumberLabel.
  ///
  /// In en, this message translates to:
  /// **'No phone number'**
  String get noPhoneNumberLabel;

  /// No description provided for @personalInfoSection.
  ///
  /// In en, this message translates to:
  /// **'Personal Info'**
  String get personalInfoSection;

  /// No description provided for @emailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @genderLabel.
  ///
  /// In en, this message translates to:
  /// **'Gender'**
  String get genderLabel;

  /// No description provided for @birthdayLabel.
  ///
  /// In en, this message translates to:
  /// **'Birthday'**
  String get birthdayLabel;

  /// No description provided for @languageLabel.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get languageLabel;

  /// No description provided for @preferencesSection.
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get preferencesSection;

  /// No description provided for @recentPurchasesLabel.
  ///
  /// In en, this message translates to:
  /// **'Recent Purchases'**
  String get recentPurchasesLabel;

  /// No description provided for @purchaseHistoryLabel.
  ///
  /// In en, this message translates to:
  /// **'Purchase History'**
  String get purchaseHistoryLabel;

  /// No description provided for @platformFeedbackLabel.
  ///
  /// In en, this message translates to:
  /// **'Platform Feedback'**
  String get platformFeedbackLabel;

  /// No description provided for @managementSection.
  ///
  /// In en, this message translates to:
  /// **'Management'**
  String get managementSection;

  /// No description provided for @vendorPanelLabel.
  ///
  /// In en, this message translates to:
  /// **'Vendor Panel'**
  String get vendorPanelLabel;

  /// No description provided for @vendorPanelSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Manage your shop & orders'**
  String get vendorPanelSubtitle;

  /// No description provided for @adminPanelLabel.
  ///
  /// In en, this message translates to:
  /// **'Admin Panel'**
  String get adminPanelLabel;

  /// No description provided for @adminPanelSubtitle.
  ///
  /// In en, this message translates to:
  /// **'System administration'**
  String get adminPanelSubtitle;

  /// No description provided for @searchHistoryPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search order number, shop, product...'**
  String get searchHistoryPlaceholder;

  /// No description provided for @noHistoryFound.
  ///
  /// In en, this message translates to:
  /// **'No purchase history found'**
  String get noHistoryFound;

  /// No description provided for @noHistorySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Try modifying your filters or search query'**
  String get noHistorySubtitle;

  /// No description provided for @csvButtonLabel.
  ///
  /// In en, this message translates to:
  /// **'CSV'**
  String get csvButtonLabel;

  /// No description provided for @reportButtonLabel.
  ///
  /// In en, this message translates to:
  /// **'Report'**
  String get reportButtonLabel;

  /// No description provided for @noOrdersToExport.
  ///
  /// In en, this message translates to:
  /// **'No orders to export'**
  String get noOrdersToExport;

  /// No description provided for @csvCopiedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Purchase history CSV copied to clipboard! You can paste and save it as a file.'**
  String get csvCopiedSuccess;

  /// No description provided for @reportCopiedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Order history text report copied to clipboard! Ready to print or share.'**
  String get reportCopiedSuccess;

  /// No description provided for @totalLabel.
  ///
  /// In en, this message translates to:
  /// **'TOTAL'**
  String get totalLabel;

  /// No description provided for @viewDetailsButton.
  ///
  /// In en, this message translates to:
  /// **'View Details'**
  String get viewDetailsButton;

  /// No description provided for @searchPurchasesPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search purchases...'**
  String get searchPurchasesPlaceholder;

  /// No description provided for @sevenDaysFilter.
  ///
  /// In en, this message translates to:
  /// **'7 Days'**
  String get sevenDaysFilter;

  /// No description provided for @thirtyDaysFilter.
  ///
  /// In en, this message translates to:
  /// **'30 Days'**
  String get thirtyDaysFilter;

  /// No description provided for @ninetyDaysFilter.
  ///
  /// In en, this message translates to:
  /// **'90 Days'**
  String get ninetyDaysFilter;

  /// No description provided for @mostRecentSort.
  ///
  /// In en, this message translates to:
  /// **'Most Recent'**
  String get mostRecentSort;

  /// No description provided for @mostOrderedSort.
  ///
  /// In en, this message translates to:
  /// **'Most Ordered'**
  String get mostOrderedSort;

  /// No description provided for @noRecentPurchases.
  ///
  /// In en, this message translates to:
  /// **'No recent purchases'**
  String get noRecentPurchases;

  /// No description provided for @noRecentPurchasesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Start shopping to build your history'**
  String get noRecentPurchasesSubtitle;

  /// No description provided for @reorderButton.
  ///
  /// In en, this message translates to:
  /// **'Reorder'**
  String get reorderButton;

  /// No description provided for @outOfStockLabel.
  ///
  /// In en, this message translates to:
  /// **'Out Stock'**
  String get outOfStockLabel;

  /// No description provided for @searchShopsHint.
  ///
  /// In en, this message translates to:
  /// **'Search shops…'**
  String get searchShopsHint;

  /// No description provided for @searchForShopsLabel.
  ///
  /// In en, this message translates to:
  /// **'Search for shops'**
  String get searchForShopsLabel;

  /// No description provided for @recentSearchesTitle.
  ///
  /// In en, this message translates to:
  /// **'Recent'**
  String get recentSearchesTitle;

  /// No description provided for @clearButtonLabel.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get clearButtonLabel;

  /// No description provided for @noShopsFoundMessage.
  ///
  /// In en, this message translates to:
  /// **'No shops found'**
  String get noShopsFoundMessage;

  /// No description provided for @generalStoreFallback.
  ///
  /// In en, this message translates to:
  /// **'General Store'**
  String get generalStoreFallback;

  /// No description provided for @catalogTab.
  ///
  /// In en, this message translates to:
  /// **'Catalog'**
  String get catalogTab;

  /// No description provided for @reviewsTab.
  ///
  /// In en, this message translates to:
  /// **'Reviews'**
  String get reviewsTab;

  /// No description provided for @noItemsInShop.
  ///
  /// In en, this message translates to:
  /// **'No items in this shop'**
  String get noItemsInShop;

  /// No description provided for @noReviewsYet.
  ///
  /// In en, this message translates to:
  /// **'No reviews yet'**
  String get noReviewsYet;

  /// No description provided for @noReviewsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Be the first customer to review this shop.'**
  String get noReviewsSubtitle;

  /// No description provided for @writeFirstReviewButton.
  ///
  /// In en, this message translates to:
  /// **'Write First Review'**
  String get writeFirstReviewButton;

  /// No description provided for @reviewsTitle.
  ///
  /// In en, this message translates to:
  /// **'Reviews'**
  String get reviewsTitle;

  /// No description provided for @verifiedPurchaseBadge.
  ///
  /// In en, this message translates to:
  /// **'Verified Purchase'**
  String get verifiedPurchaseBadge;

  /// No description provided for @anonymousReviewer.
  ///
  /// In en, this message translates to:
  /// **'Anonymous'**
  String get anonymousReviewer;

  /// No description provided for @runPreparedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Run prepared successfully! Orders linked.'**
  String get runPreparedSuccess;

  /// No description provided for @runPreparedFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed to prepare run: {error}'**
  String runPreparedFailed(String error);

  /// No description provided for @runUpdatedMessage.
  ///
  /// In en, this message translates to:
  /// **'Run updated to: {status}'**
  String runUpdatedMessage(String status);

  /// No description provided for @runUpdatedFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed to update run: {error}'**
  String runUpdatedFailed(String error);

  /// No description provided for @deliveryRunsManagementTitle.
  ///
  /// In en, this message translates to:
  /// **'Delivery Runs Management'**
  String get deliveryRunsManagementTitle;

  /// No description provided for @runNotStarted.
  ///
  /// In en, this message translates to:
  /// **'Not Started'**
  String get runNotStarted;

  /// No description provided for @runPrepare.
  ///
  /// In en, this message translates to:
  /// **'Prepare Run'**
  String get runPrepare;

  /// No description provided for @runPacking.
  ///
  /// In en, this message translates to:
  /// **'Packing'**
  String get runPacking;

  /// No description provided for @runStartDelivery.
  ///
  /// In en, this message translates to:
  /// **'Start Delivery'**
  String get runStartDelivery;

  /// No description provided for @runOutForDelivery.
  ///
  /// In en, this message translates to:
  /// **'Out for Delivery'**
  String get runOutForDelivery;

  /// No description provided for @runComplete.
  ///
  /// In en, this message translates to:
  /// **'Complete Run'**
  String get runComplete;

  /// No description provided for @runCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get runCompleted;

  /// No description provided for @ordersCountLabel.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get ordersCountLabel;

  /// No description provided for @runValueLabel.
  ///
  /// In en, this message translates to:
  /// **'Value'**
  String get runValueLabel;

  /// No description provided for @viewOrdersButton.
  ///
  /// In en, this message translates to:
  /// **'View Orders'**
  String get viewOrdersButton;

  /// No description provided for @vendorPanelTitle.
  ///
  /// In en, this message translates to:
  /// **'Vendor Panel'**
  String get vendorPanelTitle;

  /// No description provided for @welcomeBackTo.
  ///
  /// In en, this message translates to:
  /// **'Welcome back to '**
  String get welcomeBackTo;

  /// No description provided for @viewMyShopButton.
  ///
  /// In en, this message translates to:
  /// **'View My Shop'**
  String get viewMyShopButton;

  /// No description provided for @quickActionsTitle.
  ///
  /// In en, this message translates to:
  /// **'Quick Actions'**
  String get quickActionsTitle;

  /// No description provided for @addNewProductAction.
  ///
  /// In en, this message translates to:
  /// **'Add New Product'**
  String get addNewProductAction;

  /// No description provided for @viewProductsAction.
  ///
  /// In en, this message translates to:
  /// **'View Products'**
  String get viewProductsAction;

  /// No description provided for @manageOrdersAction.
  ///
  /// In en, this message translates to:
  /// **'Manage Orders'**
  String get manageOrdersAction;

  /// No description provided for @commissionStatsAction.
  ///
  /// In en, this message translates to:
  /// **'Commission Stats'**
  String get commissionStatsAction;

  /// No description provided for @customerCreditAction.
  ///
  /// In en, this message translates to:
  /// **'Customer Credit'**
  String get customerCreditAction;

  /// No description provided for @shopSettingsAction.
  ///
  /// In en, this message translates to:
  /// **'Shop Settings'**
  String get shopSettingsAction;

  /// No description provided for @vendorPortalTitle.
  ///
  /// In en, this message translates to:
  /// **'Vendor Portal'**
  String get vendorPortalTitle;

  /// No description provided for @vendorDrawerDashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get vendorDrawerDashboard;

  /// No description provided for @vendorDrawerAllProducts.
  ///
  /// In en, this message translates to:
  /// **'All Products'**
  String get vendorDrawerAllProducts;

  /// No description provided for @vendorDrawerAddProduct.
  ///
  /// In en, this message translates to:
  /// **'Add Product'**
  String get vendorDrawerAddProduct;

  /// No description provided for @vendorDrawerOrders.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get vendorDrawerOrders;

  /// No description provided for @vendorDrawerCustomerCredit.
  ///
  /// In en, this message translates to:
  /// **'Customer Credit'**
  String get vendorDrawerCustomerCredit;

  /// No description provided for @vendorDrawerCommissions.
  ///
  /// In en, this message translates to:
  /// **'Commissions'**
  String get vendorDrawerCommissions;

  /// No description provided for @vendorDrawerMyShops.
  ///
  /// In en, this message translates to:
  /// **'My Shops'**
  String get vendorDrawerMyShops;

  /// No description provided for @backToMarketplace.
  ///
  /// In en, this message translates to:
  /// **'Back to Marketplace'**
  String get backToMarketplace;

  /// No description provided for @itemMarkedLive.
  ///
  /// In en, this message translates to:
  /// **'Product is now Live'**
  String get itemMarkedLive;

  /// No description provided for @itemMarkedHidden.
  ///
  /// In en, this message translates to:
  /// **'Product is now Hidden'**
  String get itemMarkedHidden;

  /// No description provided for @deleteProductDialogTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete Product'**
  String get deleteProductDialogTitle;

  /// No description provided for @deleteProductDialogMessage.
  ///
  /// In en, this message translates to:
  /// **'Permanently delete \"{name}\"? This cannot be undone.'**
  String deleteProductDialogMessage(String name);

  /// No description provided for @productDeletedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Product deleted successfully'**
  String get productDeletedSuccess;

  /// No description provided for @manageProductsTitle.
  ///
  /// In en, this message translates to:
  /// **'Manage Products'**
  String get manageProductsTitle;

  /// No description provided for @searchProductsPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search products by name...'**
  String get searchProductsPlaceholder;

  /// No description provided for @filterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get filterAll;

  /// No description provided for @filterLive.
  ///
  /// In en, this message translates to:
  /// **'Live'**
  String get filterLive;

  /// No description provided for @filterDraft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get filterDraft;

  /// No description provided for @filterInactive.
  ///
  /// In en, this message translates to:
  /// **'Inactive'**
  String get filterInactive;

  /// No description provided for @noProductsFound.
  ///
  /// In en, this message translates to:
  /// **'No products found'**
  String get noProductsFound;

  /// No description provided for @statusDraft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get statusDraft;

  /// No description provided for @statusIncomplete.
  ///
  /// In en, this message translates to:
  /// **'Incomplete'**
  String get statusIncomplete;

  /// No description provided for @statusReady.
  ///
  /// In en, this message translates to:
  /// **'Ready'**
  String get statusReady;

  /// No description provided for @statusHidden.
  ///
  /// In en, this message translates to:
  /// **'Hidden'**
  String get statusHidden;

  /// No description provided for @statusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get statusRejected;

  /// No description provided for @statusOutOfStock.
  ///
  /// In en, this message translates to:
  /// **'Out Of Stock'**
  String get statusOutOfStock;

  /// No description provided for @deactivateTooltip.
  ///
  /// In en, this message translates to:
  /// **'Deactivate'**
  String get deactivateTooltip;

  /// No description provided for @goLiveTooltip.
  ///
  /// In en, this message translates to:
  /// **'Go Live'**
  String get goLiveTooltip;

  /// No description provided for @vendorManageOrdersTitle.
  ///
  /// In en, this message translates to:
  /// **'Manage Orders'**
  String get vendorManageOrdersTitle;

  /// No description provided for @resetDateButton.
  ///
  /// In en, this message translates to:
  /// **'Reset Date'**
  String get resetDateButton;

  /// No description provided for @allStatusesFilter.
  ///
  /// In en, this message translates to:
  /// **'All Statuses'**
  String get allStatusesFilter;

  /// No description provided for @vendorDeliverOnLabel.
  ///
  /// In en, this message translates to:
  /// **'Deliver on: {date}'**
  String vendorDeliverOnLabel(String date);

  /// No description provided for @vendorNoOrders.
  ///
  /// In en, this message translates to:
  /// **'No orders yet'**
  String get vendorNoOrders;

  /// No description provided for @vendorNoStatusOrders.
  ///
  /// In en, this message translates to:
  /// **'No {status} orders found'**
  String vendorNoStatusOrders(String status);

  /// No description provided for @orderTimelineTitle.
  ///
  /// In en, this message translates to:
  /// **'Order Timeline'**
  String get orderTimelineTitle;

  /// No description provided for @orderedItemsTitle.
  ///
  /// In en, this message translates to:
  /// **'Ordered Items'**
  String get orderedItemsTitle;

  /// No description provided for @totalFinalPriceTitle.
  ///
  /// In en, this message translates to:
  /// **'Total Final Price'**
  String get totalFinalPriceTitle;

  /// No description provided for @cancelOrderButton.
  ///
  /// In en, this message translates to:
  /// **'Cancel Order'**
  String get cancelOrderButton;

  /// No description provided for @shopCreatedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Shop created successfully!'**
  String get shopCreatedSuccess;

  /// No description provided for @shopCreatedFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed to create shop: {error}'**
  String shopCreatedFailed(String error);

  /// No description provided for @vendorShopsTitle.
  ///
  /// In en, this message translates to:
  /// **'Shop Settings'**
  String get vendorShopsTitle;

  /// No description provided for @shopProfileSection.
  ///
  /// In en, this message translates to:
  /// **'Shop Profile'**
  String get shopProfileSection;

  /// No description provided for @manageShopSettingsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Manage your shop details and settings'**
  String get manageShopSettingsSubtitle;

  /// No description provided for @setupShopSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Set up your shop to start selling'**
  String get setupShopSubtitle;

  /// No description provided for @yourShopsTitle.
  ///
  /// In en, this message translates to:
  /// **'Your Shops'**
  String get yourShopsTitle;

  /// No description provided for @orderNotificationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Order notifications'**
  String get orderNotificationsTitle;

  /// No description provided for @orderNotificationsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enabled for all order updates'**
  String get orderNotificationsSubtitle;

  /// No description provided for @appVersionTitle.
  ///
  /// In en, this message translates to:
  /// **'App version'**
  String get appVersionTitle;

  /// No description provided for @failedToAddToCart.
  ///
  /// In en, this message translates to:
  /// **'Failed to add to cart'**
  String get failedToAddToCart;

  /// No description provided for @failedToLoadOrderDetails.
  ///
  /// In en, this message translates to:
  /// **'Failed to load order details: {error}'**
  String failedToLoadOrderDetails(String error);

  /// No description provided for @failedToLoadHistory.
  ///
  /// In en, this message translates to:
  /// **'Failed to load history: {error}'**
  String failedToLoadHistory(String error);

  /// No description provided for @failedToSubmitFeedback.
  ///
  /// In en, this message translates to:
  /// **'Failed to submit feedback: {error}'**
  String failedToSubmitFeedback(String error);

  /// No description provided for @failedToLoadReviews.
  ///
  /// In en, this message translates to:
  /// **'Failed to load reviews: {error}'**
  String failedToLoadReviews(String error);

  /// No description provided for @waitingUserConfirmation.
  ///
  /// In en, this message translates to:
  /// **'Waiting for user confirmation'**
  String get waitingUserConfirmation;

  /// No description provided for @authWelcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get authWelcomeBack;

  /// No description provided for @authSignInSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to your Angadi account'**
  String get authSignInSubtitle;

  /// No description provided for @authPhoneLogin.
  ///
  /// In en, this message translates to:
  /// **'Phone Login'**
  String get authPhoneLogin;

  /// No description provided for @authEmailLogin.
  ///
  /// In en, this message translates to:
  /// **'Email Login'**
  String get authEmailLogin;

  /// No description provided for @authForgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get authForgotPassword;

  /// No description provided for @authSignIn.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get authSignIn;

  /// No description provided for @authCreateAccount.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get authCreateAccount;

  /// No description provided for @authJoinSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Join Angadi — enter details to get started'**
  String get authJoinSubtitle;

  /// No description provided for @authUsePhone.
  ///
  /// In en, this message translates to:
  /// **'Use Phone Number'**
  String get authUsePhone;

  /// No description provided for @authUseEmail.
  ///
  /// In en, this message translates to:
  /// **'Use Email Address'**
  String get authUseEmail;

  /// No description provided for @authRegister.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get authRegister;

  /// No description provided for @authResetPassword.
  ///
  /// In en, this message translates to:
  /// **'Reset password'**
  String get authResetPassword;

  /// No description provided for @authResetPwInstructions.
  ///
  /// In en, this message translates to:
  /// **'Enter your details to receive password reset instructions'**
  String get authResetPwInstructions;

  /// No description provided for @authCheckInboxReset.
  ///
  /// In en, this message translates to:
  /// **'Check your inbox for a reset link'**
  String get authCheckInboxReset;

  /// No description provided for @authEmailAccounts.
  ///
  /// In en, this message translates to:
  /// **'Email Accounts'**
  String get authEmailAccounts;

  /// No description provided for @authPhoneAccounts.
  ///
  /// In en, this message translates to:
  /// **'Phone Accounts'**
  String get authPhoneAccounts;

  /// No description provided for @authSendResetLink.
  ///
  /// In en, this message translates to:
  /// **'Send Reset Link'**
  String get authSendResetLink;

  /// No description provided for @authGoToLogin.
  ///
  /// In en, this message translates to:
  /// **'Go to Login'**
  String get authGoToLogin;

  /// No description provided for @authRememberPw.
  ///
  /// In en, this message translates to:
  /// **'Remember your password?'**
  String get authRememberPw;

  /// No description provided for @authSignInLink.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get authSignInLink;

  /// No description provided for @authResetLinkSentTo.
  ///
  /// In en, this message translates to:
  /// **'A password reset link has been successfully sent to {email}. Please check your inbox and spam folders.'**
  String authResetLinkSentTo(String email);

  /// No description provided for @authCompleteRegistration.
  ///
  /// In en, this message translates to:
  /// **'Complete registration'**
  String get authCompleteRegistration;

  /// No description provided for @authFewDetailsSetup.
  ///
  /// In en, this message translates to:
  /// **'Just a few details to set up your account'**
  String get authFewDetailsSetup;

  /// No description provided for @authPreferredLanguage.
  ///
  /// In en, this message translates to:
  /// **'Preferred Language'**
  String get authPreferredLanguage;

  /// No description provided for @authVillageLocation.
  ///
  /// In en, this message translates to:
  /// **'Village / Location'**
  String get authVillageLocation;

  /// No description provided for @authCompleteSetup.
  ///
  /// In en, this message translates to:
  /// **'Complete Setup'**
  String get authCompleteSetup;

  /// No description provided for @authLoadingLocations.
  ///
  /// In en, this message translates to:
  /// **'Loading locations...'**
  String get authLoadingLocations;

  /// No description provided for @authFullName.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get authFullName;

  /// No description provided for @authEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get authEmail;

  /// No description provided for @authPhone.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get authPhone;

  /// No description provided for @authPassword.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get authPassword;

  /// No description provided for @securityTitle.
  ///
  /// In en, this message translates to:
  /// **'Security Settings'**
  String get securityTitle;

  /// No description provided for @securityChangePhone.
  ///
  /// In en, this message translates to:
  /// **'Change Phone Number'**
  String get securityChangePhone;

  /// No description provided for @securityPhoneSuccess.
  ///
  /// In en, this message translates to:
  /// **'Phone number updated successfully!'**
  String get securityPhoneSuccess;

  /// No description provided for @securityActivePhone.
  ///
  /// In en, this message translates to:
  /// **'Active Phone Number'**
  String get securityActivePhone;

  /// No description provided for @securityRequestPhoneChange.
  ///
  /// In en, this message translates to:
  /// **'Request Phone Change'**
  String get securityRequestPhoneChange;

  /// No description provided for @securitySending.
  ///
  /// In en, this message translates to:
  /// **'Sending...'**
  String get securitySending;

  /// No description provided for @securityEnterVerificationCode.
  ///
  /// In en, this message translates to:
  /// **'Enter Verification Code sent to {phone}'**
  String securityEnterVerificationCode(String phone);

  /// No description provided for @securityDidntReceiveCode.
  ///
  /// In en, this message translates to:
  /// **'Didn\'t receive code?'**
  String get securityDidntReceiveCode;

  /// No description provided for @securityResendIn.
  ///
  /// In en, this message translates to:
  /// **'Resend in {countdown}s'**
  String securityResendIn(String countdown);

  /// No description provided for @securityResendOtp.
  ///
  /// In en, this message translates to:
  /// **'Resend OTP'**
  String get securityResendOtp;

  /// No description provided for @securityCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get securityCancel;

  /// No description provided for @securityVerifyChange.
  ///
  /// In en, this message translates to:
  /// **'Verify & Change'**
  String get securityVerifyChange;

  /// No description provided for @securityVerifying.
  ///
  /// In en, this message translates to:
  /// **'Verifying...'**
  String get securityVerifying;

  /// No description provided for @securityChangePassword.
  ///
  /// In en, this message translates to:
  /// **'Change Account Password'**
  String get securityChangePassword;

  /// No description provided for @securityPasswordSuccess.
  ///
  /// In en, this message translates to:
  /// **'Password updated successfully!'**
  String get securityPasswordSuccess;

  /// No description provided for @securityNewPassword.
  ///
  /// In en, this message translates to:
  /// **'New Password'**
  String get securityNewPassword;

  /// No description provided for @securityConfirmNewPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm New Password'**
  String get securityConfirmNewPassword;

  /// No description provided for @securityUpdatePassword.
  ///
  /// In en, this message translates to:
  /// **'Update Password'**
  String get securityUpdatePassword;

  /// No description provided for @securitySaving.
  ///
  /// In en, this message translates to:
  /// **'Saving...'**
  String get securitySaving;

  /// No description provided for @securityDangerZone.
  ///
  /// In en, this message translates to:
  /// **'Danger Zone'**
  String get securityDangerZone;

  /// No description provided for @securityDangerZoneDesc.
  ///
  /// In en, this message translates to:
  /// **'Logging out from all devices will terminate all your active sessions across web browsers, mobile apps, and other logged-in clients.'**
  String get securityDangerZoneDesc;

  /// No description provided for @securitySignOutAll.
  ///
  /// In en, this message translates to:
  /// **'Sign Out From All Devices'**
  String get securitySignOutAll;

  /// No description provided for @securityLoggingOut.
  ///
  /// In en, this message translates to:
  /// **'Logging out...'**
  String get securityLoggingOut;

  /// No description provided for @securityConfirmSignOutAll.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to sign out from all devices? You will need to log in again on all your active devices.'**
  String get securityConfirmSignOutAll;

  /// No description provided for @authNoAccountPrompt.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account? '**
  String get authNoAccountPrompt;

  /// No description provided for @authAlreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? '**
  String get authAlreadyHaveAccount;

  /// No description provided for @authAccountType.
  ///
  /// In en, this message translates to:
  /// **'Account Type'**
  String get authAccountType;

  /// No description provided for @authCustomerRole.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get authCustomerRole;

  /// No description provided for @authShopOwnerRole.
  ///
  /// In en, this message translates to:
  /// **'Shop Owner'**
  String get authShopOwnerRole;

  /// No description provided for @authVerifyPhone.
  ///
  /// In en, this message translates to:
  /// **'Verify Phone Number'**
  String get authVerifyPhone;

  /// No description provided for @authVerifyCode.
  ///
  /// In en, this message translates to:
  /// **'Verify Code'**
  String get authVerifyCode;

  /// No description provided for @authVerificationCodeResent.
  ///
  /// In en, this message translates to:
  /// **'Verification code resent!'**
  String get authVerificationCodeResent;

  /// No description provided for @selectLocationTitle.
  ///
  /// In en, this message translates to:
  /// **'Select Location'**
  String get selectLocationTitle;

  /// No description provided for @searchLocationsHint.
  ///
  /// In en, this message translates to:
  /// **'Search locations…'**
  String get searchLocationsHint;

  /// No description provided for @allLocationsOption.
  ///
  /// In en, this message translates to:
  /// **'All Locations'**
  String get allLocationsOption;

  /// No description provided for @failedToLoadLocations.
  ///
  /// In en, this message translates to:
  /// **'Failed to load locations: {error}'**
  String failedToLoadLocations(String error);

  /// No description provided for @noLocationsMatch.
  ///
  /// In en, this message translates to:
  /// **'No locations match your search.'**
  String get noLocationsMatch;

  /// No description provided for @vendorFooterDashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get vendorFooterDashboard;

  /// No description provided for @vendorFooterOrders.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get vendorFooterOrders;

  /// No description provided for @vendorFooterProducts.
  ///
  /// In en, this message translates to:
  /// **'Products'**
  String get vendorFooterProducts;

  /// No description provided for @vendorFooterCredit.
  ///
  /// In en, this message translates to:
  /// **'Credit'**
  String get vendorFooterCredit;

  /// No description provided for @vendorFooterExit.
  ///
  /// In en, this message translates to:
  /// **'Exit'**
  String get vendorFooterExit;

  /// No description provided for @vendorEditProduct.
  ///
  /// In en, this message translates to:
  /// **'Edit Product'**
  String get vendorEditProduct;

  /// No description provided for @vendorUserCreditDetail.
  ///
  /// In en, this message translates to:
  /// **'User Credit Detail'**
  String get vendorUserCreditDetail;

  /// No description provided for @tutorialSkip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get tutorialSkip;

  /// No description provided for @tutorialNext.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get tutorialNext;

  /// No description provided for @tutorialFinish.
  ///
  /// In en, this message translates to:
  /// **'Finish'**
  String get tutorialFinish;

  /// No description provided for @tutorialHomeLocationTitle.
  ///
  /// In en, this message translates to:
  /// **'Select Location'**
  String get tutorialHomeLocationTitle;

  /// No description provided for @tutorialHomeLocationDesc.
  ///
  /// In en, this message translates to:
  /// **'Tap here to change your village or marketplace location.'**
  String get tutorialHomeLocationDesc;

  /// No description provided for @tutorialHomeSearchTitle.
  ///
  /// In en, this message translates to:
  /// **'Search Shops'**
  String get tutorialHomeSearchTitle;

  /// No description provided for @tutorialHomeSearchDesc.
  ///
  /// In en, this message translates to:
  /// **'Find your favorite local shops by typing here.'**
  String get tutorialHomeSearchDesc;

  /// No description provided for @tutorialHomeCategoryTitle.
  ///
  /// In en, this message translates to:
  /// **'Categories'**
  String get tutorialHomeCategoryTitle;

  /// No description provided for @tutorialHomeCategoryDesc.
  ///
  /// In en, this message translates to:
  /// **'Filter fresh groceries and items by category.'**
  String get tutorialHomeCategoryDesc;

  /// No description provided for @tutorialHomeShopCardTitle.
  ///
  /// In en, this message translates to:
  /// **'Explore Shops'**
  String get tutorialHomeShopCardTitle;

  /// No description provided for @tutorialHomeShopCardDesc.
  ///
  /// In en, this message translates to:
  /// **'Tap on any shop to see its available items.'**
  String get tutorialHomeShopCardDesc;

  /// No description provided for @tutorialShopFilterTitle.
  ///
  /// In en, this message translates to:
  /// **'Filter by Category'**
  String get tutorialShopFilterTitle;

  /// No description provided for @tutorialShopFilterDesc.
  ///
  /// In en, this message translates to:
  /// **'Tap a category to quickly filter and find specific items.'**
  String get tutorialShopFilterDesc;

  /// No description provided for @tutorialShopProductTitle.
  ///
  /// In en, this message translates to:
  /// **'View Products'**
  String get tutorialShopProductTitle;

  /// No description provided for @tutorialShopProductDesc.
  ///
  /// In en, this message translates to:
  /// **'See prices, images, and details of all available items.'**
  String get tutorialShopProductDesc;

  /// No description provided for @tutorialShopOpenTitle.
  ///
  /// In en, this message translates to:
  /// **'Open Product'**
  String get tutorialShopOpenTitle;

  /// No description provided for @tutorialShopOpenDesc.
  ///
  /// In en, this message translates to:
  /// **'Tap on any item card to see more details and add it to your bag.'**
  String get tutorialShopOpenDesc;

  /// No description provided for @shopOwnersTitle.
  ///
  /// In en, this message translates to:
  /// **'Shop Owners'**
  String get shopOwnersTitle;

  /// No description provided for @addCoOwner.
  ///
  /// In en, this message translates to:
  /// **'Add Co-Owner'**
  String get addCoOwner;

  /// No description provided for @removeCoOwner.
  ///
  /// In en, this message translates to:
  /// **'Remove Co-Owner'**
  String get removeCoOwner;

  /// No description provided for @maxOwnersLimit.
  ///
  /// In en, this message translates to:
  /// **'Max 3 Limit'**
  String get maxOwnersLimit;

  /// No description provided for @deleteShop.
  ///
  /// In en, this message translates to:
  /// **'Delete Shop'**
  String get deleteShop;

  /// No description provided for @primaryOwner.
  ///
  /// In en, this message translates to:
  /// **'Primary Owner'**
  String get primaryOwner;

  /// No description provided for @coOwner.
  ///
  /// In en, this message translates to:
  /// **'Co-Owner'**
  String get coOwner;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en', 'hi', 'ml'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
    case 'ml':
      return AppLocalizationsMl();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
