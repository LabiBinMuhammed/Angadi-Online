import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/complete_registration_screen.dart';
import '../screens/auth/otp_verification_screen.dart';
import '../screens/main/profile/security_screen.dart';
import '../screens/main/home/home_screen.dart';
import '../screens/main/search/search_screen.dart';
import '../screens/main/shop/shop_screen.dart';
import '../screens/main/shop/shop_category_screen.dart';
import '../screens/main/item/item_detail_screen.dart';
import '../screens/main/cart/cart_screen.dart';
import '../screens/main/checkout/checkout_screen.dart';
import '../screens/main/checkout/order_success_screen.dart';
import '../screens/main/orders/orders_screen.dart';
import '../screens/main/orders/order_detail_screen.dart';
import '../screens/main/profile/profile_screen.dart';
import '../screens/main/profile/addresses_screen.dart';
import '../screens/main/profile/add_edit_address_screen.dart';
import '../screens/main/notifications/notifications_screen.dart';
import '../screens/main/settings/settings_screen.dart';
import '../screens/vendor/vendor_dashboard_screen.dart';
import '../screens/vendor/vendor_commission_screen.dart';
import '../screens/vendor/vendor_items_screen.dart';
import '../screens/vendor/vendor_add_edit_item_screen.dart';
import '../screens/vendor/vendor_orders_screen.dart';
import '../screens/vendor/vendor_order_processing_screen.dart';
import '../screens/vendor/vendor_credit_screen.dart';
import '../screens/vendor/vendor_user_credit_screen.dart';
import '../screens/vendor/vendor_shops_screen.dart';
import '../screens/vendor/vendor_shop_detail_screen.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import '../screens/admin/admin_screens.dart';
import '../screens/admin/admin_user_detail_screen.dart';
import '../screens/admin/admin_order_detail_screen.dart';
import '../screens/admin/admin_categories_screen.dart';
import '../screens/admin/admin_units_screen.dart';
import '../screens/admin/admin_commission_screen.dart';
import '../screens/admin/admin_shops_billing_screen.dart';
import '../shell/main_shell.dart';
import '../screens/main/categories/categories_screen.dart';
import '../screens/main/profile/feedback_screen.dart';
import '../screens/main/orders/leave_review_screen.dart';
import '../screens/admin/admin_feedbacks_screen.dart';
import '../screens/main/profile/pinned_shops_screen.dart';
import '../screens/main/profile/recent_purchases_screen.dart';
import '../screens/main/profile/purchase_history_screen.dart';
import '../screens/main/profile/favorites_screen.dart';

final _rootNavigatorKey  = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

GoRouter buildRouter() {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',

    // ── Redirect based on auth state ─────────────────────────────────────
    redirect: (context, state) {
      final session    = Supabase.instance.client.auth.currentSession;
      final isLoggedIn = session != null;
      final path       = state.matchedLocation;

      final publicPaths = ['/login', '/signup', '/splash', '/forgot-password', '/otp-verification'];
      final isPublic    = publicPaths.any((p) => path.startsWith(p));

      if (!isLoggedIn && !isPublic) return '/login';
      if (isLoggedIn  &&  isPublic && path != '/splash') return '/home';
      return null;
    },

    // ── Refresh on auth state changes ────────────────────────────────────
    refreshListenable: GoRouterRefreshStream(
      Supabase.instance.client.auth.onAuthStateChange,
    ),

    routes: [
      // ── Splash ────────────────────────────────────────────────────────
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),

      // ── Auth routes (no shell) ────────────────────────────────────────
      GoRoute(path: '/login',  builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),
      GoRoute(
        path: '/otp-verification',
        builder: (_, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return OtpVerificationScreen(
            phone: extra['phone'] as String? ?? '',
            flow: extra['flow'] as String? ?? 'login',
            newPhone: extra['newPhone'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (_, __) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/complete-registration',
        builder: (_, __) => const CompleteRegistrationScreen(),
      ),

      // ── Full-screen routes (above shell) ─────────────────────────────
      GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),

      // ── Vendor routes ─────────────────────────────────────────────────
      GoRoute(path: '/vendor/dashboard',  builder: (_, __) => const VendorDashboardScreen()),
      GoRoute(path: '/vendor/commission', builder: (_, __) => const VendorCommissionScreen()),
      GoRoute(path: '/vendor/items',      builder: (_, __) => const VendorItemsScreen()),
      GoRoute(path: '/vendor/items/new',  builder: (_, __) => const VendorAddEditItemScreen()),
      GoRoute(
        path: '/vendor/items/:itemId',
        builder: (_, state) => VendorAddEditItemScreen(itemId: state.pathParameters['itemId']),
      ),
      GoRoute(
        path: '/vendor/orders',
        builder: (_, state) => VendorOrdersScreen(
          date: state.uri.queryParameters['date'],
          slot: state.uri.queryParameters['slot'],
        ),
      ),
      GoRoute(
        path: '/vendor/orders/:orderId',
        builder: (_, state) => VendorOrderProcessingScreen(orderId: state.pathParameters['orderId']!),
      ),
      GoRoute(path: '/vendor/credit',     builder: (_, __) => const VendorCreditScreen()),
      GoRoute(
        path: '/vendor/credit/:userId',
        builder: (_, state) => VendorUserCreditScreen(userId: state.pathParameters['userId']!),
      ),
      GoRoute(path: '/vendor/shop',       builder: (_, __) => const VendorShopsScreen()),
      GoRoute(
        path: '/vendor/shop/:shopId',
        builder: (_, state) => VendorShopDetailScreen(shopId: state.pathParameters['shopId']!),
      ),

      // ── Admin routes ──────────────────────────────────────────────────
      GoRoute(path: '/admin/dashboard',   builder: (_, __) => const AdminDashboardScreen()),
      GoRoute(path: '/admin/shops',       builder: (_, __) => const AdminShopsScreen()),
      GoRoute(path: '/admin/users',       builder: (_, __) => const AdminUsersScreen()),
      GoRoute(
        path: '/admin/users/:userId',
        builder: (_, state) => AdminUserDetailScreen(userId: state.pathParameters['userId']!),
      ),
      GoRoute(path: '/admin/orders',      builder: (_, __) => const AdminOrdersScreen()),
      GoRoute(
        path: '/admin/orders/:orderId',
        builder: (_, state) => AdminOrderDetailScreen(orderId: state.pathParameters['orderId']!),
      ),
      GoRoute(path: '/admin/categories',  builder: (_, __) => const AdminCategoriesScreen()),
      GoRoute(path: '/admin/units',       builder: (_, __) => const AdminUnitsScreen()),
      GoRoute(path: '/admin/commission',  builder: (_, __) => const AdminCommissionScreen()),
      GoRoute(path: '/admin/commission/shops', builder: (_, __) => const AdminShopsBillingScreen()),
      GoRoute(path: '/admin/logs',        builder: (_, __) => const AdminLogsScreen()),
      GoRoute(path: '/admin/settings',    builder: (_, __) => const AdminSettingsScreen()),
      GoRoute(path: '/admin/credit',      builder: (_, __) => const AdminCreditScreen()),
      GoRoute(path: '/admin/feedbacks',   builder: (_, __) => const AdminFeedbacksScreen()),

      // ── Main shell (bottom nav) ───────────────────────────────────────
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          // Tab 0 — Home
          GoRoute(
            path: '/home',
            builder: (_, __) => const HomeScreen(),
            routes: [
              GoRoute(
                path: 'shop/:shopId',
                builder: (_, state) => ShopScreen(
                  shopId: state.pathParameters['shopId']!,
                  initialTab: state.uri.queryParameters['tab'],
                ),
                routes: [
                  GoRoute(
                    path: 'category/:categoryId',
                    builder: (_, state) => ShopCategoryScreen(
                      shopId:     state.pathParameters['shopId']!,
                      categoryId: state.pathParameters['categoryId']!,
                    ),
                  ),
                ],
              ),
              GoRoute(
                path: 'item/:itemId',
                builder: (_, state) => ItemDetailScreen(itemId: state.pathParameters['itemId']!),
              ),
            ],
          ),

          // Tab 1 — Categories
          GoRoute(
            path: '/categories',
            builder: (_, __) => const CategoriesScreen(),
          ),

          // Tab 1 — Cart
          GoRoute(
            path: '/cart',
            builder: (_, __) => const CartScreen(),
            routes: [
              GoRoute(
                path: 'checkout',
                builder: (_, __) => const CheckoutScreen(),
                routes: [
                  GoRoute(
                    path: 'success',
                    builder: (_, state) => OrderSuccessScreen(
                      orderId: state.uri.queryParameters['orderId'] ?? '',
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Tab 2 — Orders
          GoRoute(
            path: '/orders',
            builder: (_, __) => const OrdersScreen(),
            routes: [
              GoRoute(
                path: ':orderId',
                builder: (_, state) => OrderDetailScreen(
                  orderId: state.pathParameters['orderId']!,
                ),
                routes: [
                  GoRoute(
                    path: 'review',
                    builder: (_, state) => LeaveReviewScreen(
                      orderId: state.pathParameters['orderId']!,
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Tab 3 — Notifications
          GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),

          // Tab 4 — Profile
          GoRoute(
            path: '/profile',
            builder: (_, __) => const ProfileScreen(),
            routes: [
              GoRoute(path: 'addresses', builder: (_, __) => const AddressesScreen()),
              GoRoute(path: 'addresses/new', builder: (_, __) => const AddEditAddressScreen()),
              GoRoute(
                path: 'addresses/:addressId',
                builder: (_, state) => AddEditAddressScreen(addressId: state.pathParameters['addressId']),
              ),
              GoRoute(path: 'settings', builder: (_, __) => const SettingsScreen()),
              GoRoute(path: 'security', builder: (_, __) => const SecurityScreen()),
              GoRoute(path: 'feedback', builder: (_, __) => const FeedbackScreen()),
              GoRoute(path: 'pinned-shops', builder: (_, __) => const PinnedShopsScreen()),
              GoRoute(path: 'recent-purchases', builder: (_, __) => const RecentPurchasesScreen()),
              GoRoute(path: 'purchase-history', builder: (_, __) => const PurchaseHistoryScreen()),
              GoRoute(path: 'favorites', builder: (_, __) => const FavoritesScreen()),
            ],
          ),
        ],
      ),
    ],
  );
}

// Converts Supabase auth stream to a Listenable for GoRouter
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _sub = stream.listen((_) => notifyListeners());
  }
  late final dynamic _sub;

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}
