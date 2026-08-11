import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../theme/theme_service.dart';
import '../../widgets/directional_huge_icon.dart';

class AdminDrawer extends StatelessWidget {
  final String currentRoute;
  const AdminDrawer({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    
    // Theme colors matching Next.js slate aesthetics
    final kBg = isDark ? const Color(0xFF09090B) : const Color(0xFFF8FAFC);
    final kText = isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
    final kSubText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final kDivider = isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);
    
    return Drawer(
      backgroundColor: kBg,
      child: SafeArea(
        child: Column(
          children: [
            // Branding Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
              child: Row(
                children: [
                  Image.asset(
                    isDark ? 'assets/images/logo_dark.png' : 'assets/images/logo_light.png',
                    height: 36,
                    fit: BoxFit.contain,
                  ),

                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'ADMIN',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF8B5CF6),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            Divider(color: kDivider, height: 1),
            
            // Sidebar Menu
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                children: [
                  _buildSectionHeader('Overview', kSubText),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedDashboardSquare01,
                    label: 'Dashboard',
                    route: '/admin/dashboard',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  
                  _buildSectionHeader('Catalog', kSubText),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedGrid,
                    label: 'Categories',
                    route: '/admin/categories',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedRuler,
                    label: 'Units',
                    route: '/admin/units',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedLink01,
                    label: 'Category-Unit Map',
                    route: '/admin/category-units',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedTask01,
                    label: 'Demo Templates',
                    route: '/admin/demos',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  
                  _buildSectionHeader('Marketplace', kSubText),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedStore01,
                    label: 'Shops',
                    route: '/admin/shops',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedLocation01,
                    label: 'Locations',
                    route: '/admin/locations',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedUserGroup,
                    label: 'Users',
                    route: '/admin/users',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedPackage,
                    label: 'Orders',
                    route: '/admin/orders',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  
                  _buildSectionHeader('Finance', kSubText),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedWallet01,
                    label: 'Credit Monitor',
                    route: '/admin/credit',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedMoney03,
                    label: 'Commission Management',
                    route: '/admin/commission',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  

                  _buildSectionHeader('System', kSubText),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedWorkHistory,
                    label: 'Activity Logs',
                    route: '/admin/logs',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedChat01,
                    label: 'Platform Feedbacks',
                    route: '/admin/feedbacks',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedAlertCircle,
                    label: 'Disputes',
                    route: '/admin/disputes',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedSettings01,
                    label: 'Settings',
                    route: '/admin/settings',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: HugeIcons.strokeRoundedNotification01,
                    label: 'Notifications',
                    route: '/admin/notifications',
                    kText: kText,
                    kSubText: kSubText,
                  ),
                ],
              ),
            ),
            
            // Footer Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Column(
                children: [
                  Divider(color: kDivider, height: 1),
                  const SizedBox(height: 8),
                  
                  // Theme Toggle
                  ListTile(
                    onTap: () {
                      ThemeService.instance.toggleTheme();
                      Navigator.pop(context);
                    },
                    leading: HugeIcon(
                      icon: isDark
                          ? HugeIcons.strokeRoundedSun01
                          : HugeIcons.strokeRoundedMoon,
                      color: kSubText,
                      size: 20,
                    ),
                    title: Text(
                      isDark ? 'Light Mode' : 'Dark Mode',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: kSubText,
                      ),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  
                  // Back to Shop / Marketplace
                  ListTile(
                    onTap: () {
                      context.go('/home');
                    },
                    leading: DirectionalHugeIcon(
                      icon: HugeIcons.strokeRoundedArrowLeft01,
                      color: kSubText,
                      size: 20,
                    ),
                    title: Text(
                      'Back to Shop',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: kSubText,
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

  Widget _buildSectionHeader(String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 16, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color.withValues(alpha: 0.8),
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required BuildContext context,
    required List<List<dynamic>> icon,
    required String label,
    required String route,
    required Color kText,
    required Color kSubText,
    bool isImplemented = true,
  }) {
    final isActive = currentRoute == route;
    
    // Purple active theme matching Next.js sidebar
    final activeBgColor = const Color(0xFF8B5CF6).withValues(alpha: 0.12);
    const activeTextColor = Color(0xFFC084FC);

    return Container(
      margin: const EdgeInsets.only(bottom: 2),
      child: ListTile(
        onTap: () {
          Navigator.pop(context);
          if (!isImplemented) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$label is coming soon to the mobile console!'),
                behavior: SnackBarBehavior.floating,
                duration: const Duration(seconds: 2),
              ),
            );
            return;
          }
          if (currentRoute != route) {
            context.go(route);
          }
        },
        leading: HugeIcon(
          icon: icon,
          color: isActive ? activeTextColor : kSubText,
          size: 20,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
            color: isActive ? activeTextColor : kText,
          ),
        ),
        tileColor: isActive ? activeBgColor : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: isActive
              ? const BorderSide(color: Color(0x338B5CF6), width: 1)
              : BorderSide.none,
        ),
      ),
    );
  }
}
