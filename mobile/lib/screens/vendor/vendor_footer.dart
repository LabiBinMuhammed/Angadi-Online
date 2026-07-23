import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../theme/theme_service.dart';

class VendorFooter extends StatelessWidget {
  final int currentIndex;
  const VendorFooter({super.key, required this.currentIndex});

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final l10n = AppLocalizations.of(context)!;
    final activeColor = isDark ? const Color(0xFF60A5FA) : const Color(0xFF3B82F6);
    final inactiveColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final bgColor = isDark ? const Color(0xFF101012) : const Color(0xFFFFFFFF);
    final borderColor = isDark ? const Color(0x14FFFFFF) : const Color(0xFFE2E8F0);

    final items = [
      _FooterItem(icon: HugeIcons.strokeRoundedDashboardSquare01, label: l10n.vendorFooterDashboard, route: '/vendor/dashboard'),
      _FooterItem(icon: HugeIcons.strokeRoundedReceiptText, label: l10n.vendorFooterOrders, route: '/vendor/orders'),
      _FooterItem(icon: HugeIcons.strokeRoundedPackage, label: l10n.vendorFooterProducts, route: '/vendor/items'),
      _FooterItem(icon: HugeIcons.strokeRoundedMoney03, label: l10n.vendorFooterCredit, route: '/vendor/credit'),
      _FooterItem(icon: HugeIcons.strokeRoundedLogout01, label: l10n.vendorFooterExit, route: '/profile'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        border: Border(
          top: BorderSide(color: borderColor, width: 1.5),
        ),
      ),
      padding: EdgeInsets.only(
        top: 10,
        bottom: 10 + MediaQuery.of(context).padding.bottom,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isSelected = index == currentIndex;

          return Expanded(
            child: GestureDetector(
              onTap: () {
                if (index != currentIndex) {
                  context.go(item.route);
                }
              },
              child: Container(
                color: Colors.transparent,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? activeColor.withOpacity(0.1) : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: HugeIcon(
                        icon: item.icon,
                        color: isSelected ? activeColor : inactiveColor,
                        size: 22,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.label,
                      style: TextStyle(
                        color: isSelected ? activeColor : inactiveColor,
                        fontSize: 10,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _FooterItem {
  final List<List<dynamic>> icon;
  final String label;
  final String route;
  const _FooterItem({required this.icon, required this.label, required this.route});
}
