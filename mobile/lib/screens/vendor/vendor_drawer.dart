import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import 'vendor_theme_helper.dart';
import '../../theme/theme_service.dart';
import '../../widgets/directional_huge_icon.dart';

class VendorDrawer extends StatelessWidget {
  final String currentRoute;
  const VendorDrawer({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;
    
    return Drawer(
      backgroundColor: kVendorBg,
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Header / Brand
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const HugeIcon(
                      icon: HugeIcons.strokeRoundedShield01,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    l10n.vendorPortalTitle,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: kVendorText,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
            
            Divider(color: kVendorDivider, height: 1),
            const SizedBox(height: 16),
            
            // Drawer Navigation Links
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedDashboardSquare01,
                    label: l10n.vendorDrawerDashboard,
                    route: '/vendor/dashboard',
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedPackage,
                    label: l10n.vendorDrawerAllProducts,
                    route: '/vendor/items',
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedAddCircle,
                    label: l10n.vendorDrawerAddProduct,
                    route: '/vendor/items/new',
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedShoppingBasket01,
                    label: l10n.vendorDrawerOrders,
                    route: '/vendor/orders',
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedCreditCard,
                    label: l10n.vendorDrawerCustomerCredit,
                    route: '/vendor/credit',
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedMoney03,
                    label: l10n.vendorDrawerCommissions,
                    route: '/vendor/commission',
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedStore01,
                    label: l10n.vendorDrawerMyShops,
                    route: '/vendor/shop',
                  ),
                ],
              ),
            ),
            
            // Footer section: Theme toggle and back to marketplace
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                children: [
                  Divider(color: kVendorDivider, height: 1),
                  const SizedBox(height: 12),
                  // Theme Toggle
                  ListTile(
                    onTap: () {
                      ThemeService.instance.toggleTheme();
                      // Close drawer
                      Navigator.pop(context);
                    },
                    leading: HugeIcon(
                      icon: isDark
                          ? HugeIcons.strokeRoundedSun01
                          : HugeIcons.strokeRoundedMoon,
                      color: kVendorSubText,
                      size: 20,
                    ),
                    title: Text(
                      isDark ? 'Light Mode' : 'Dark Mode',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: kVendorSubText,
                      ),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Back to Marketplace
                  ListTile(
                    onTap: () {
                      // Navigate back to marketplace /profile
                      context.go('/profile');
                    },
                    leading: DirectionalHugeIcon(
                      icon: HugeIcons.strokeRoundedArrowLeft01,
                      color: kVendorSubText,
                      size: 20,
                    ),
                    title: Text(
                      l10n.backToMarketplace,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: kVendorSubText,
                      ),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required BuildContext context,
    required List<List<dynamic>> icon,
    required String label,
    required String route,
  }) {
    final isActive = currentRoute == route;
    final activeBgColor = const Color(0xFF3B82F6).withValues(alpha: 0.12);
    const activeTextColor = Color(0xFF60A5FA);

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        onTap: () {
          // Close drawer
          Navigator.pop(context);
          if (currentRoute != route) {
            context.go(route);
          }
        },
        leading: HugeIcon(
          icon: icon,
          color: isActive ? activeTextColor : kVendorSubText,
          size: 20,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
            color: isActive ? activeTextColor : kVendorText,
          ),
        ),
        tileColor: isActive ? activeBgColor : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: isActive
              ? const BorderSide(color: Color(0x1F3B82F6), width: 1)
              : BorderSide.none,
        ),
      ),
    );
  }
}
