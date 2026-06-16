import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../theme/theme_service.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/orders')) return 1;
    if (location.startsWith('/cart')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0; // Home
  }

  @override
  Widget build(BuildContext context) {
    final idx = _currentIndex(context);
    final isDark = ThemeService.instance.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
      body: child,
      // Stack for custom bottom navigation
      bottomNavigationBar: Container(
        height: 80,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.black.withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.04),
              blurRadius: 40,
              offset: const Offset(0, -10),
            )
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: 0,
              right: 0,
              top: 0,
              bottom: 12,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(context, icon: HugeIcons.strokeRoundedHome01, activeIcon: HugeIcons.strokeRoundedHome01, label: 'Home', index: 0, currentIndex: idx, path: '/home', isDark: isDark),
                  _buildNavItem(context, icon: HugeIcons.strokeRoundedCrop, activeIcon: HugeIcons.strokeRoundedCrop, label: 'Orders', index: 1, currentIndex: idx, path: '/orders', isDark: isDark),
                  _buildNavItem(context, icon: HugeIcons.strokeRoundedShoppingBag01, activeIcon: HugeIcons.strokeRoundedShoppingBag01, label: 'Bag', index: 2, currentIndex: idx, path: '/cart', isBag: true, isDark: isDark),
                  _buildNavItem(context, icon: HugeIcons.strokeRoundedUser, activeIcon: HugeIcons.strokeRoundedUser, label: 'Profile', index: 3, currentIndex: idx, path: '/profile', isDark: isDark),
                ],
              ),
            ),
            
            // Bottom handle indicator
            Positioned(
              bottom: 8,
              left: MediaQuery.of(context).size.width / 2 - 65,
              child: Container(
                width: 130,
                height: 5,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.black.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required List<List<dynamic>> icon,
    required List<List<dynamic>> activeIcon,
    required String label,
    required int index,
    required int currentIndex,
    required String path,
    bool isBag = false,
    required bool isDark,
  }) {
    final isActive = index == currentIndex;
    
    // Any active icon scales up to 1.33. Inactive is 1.0.
    final double targetScale = isActive ? 1.33 : 1.0;
    
    // Any active icon floats up by 18px.
    final Matrix4 transform = isActive
        ? (Matrix4.identity()..translate(0.0, -18.0))
        : Matrix4.identity();
 
    return GestureDetector(
      onTap: () => context.go(path),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedScale(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutBack,
            scale: targetScale,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOutBack,
              transform: transform,
              transformAlignment: Alignment.center,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOut,
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: isActive
                        ? [const Color(0xFF4CD964), const Color(0xFF32B84A)]
                        : [Colors.transparent, Colors.transparent],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: const Color(0xFF4CD964).withValues(alpha: 0.5),
                            blurRadius: 28,
                            offset: const Offset(0, 10),
                          ),
                        ]
                      : [],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  clipBehavior: Clip.none,
                  children: [
                    HugeIcon(
                      icon: isActive ? activeIcon : icon,
                      size: 22,
                      color: isActive ? Colors.white : (isDark ? const Color(0xFF64748B) : const Color(0xFF999999)),
                    ),
                    if (isBag)
                      Positioned(
                        top: 10,
                        right: 10,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF4757),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isActive ? const Color(0xFF32B84A) : (isDark ? const Color(0xFF1E293B) : Colors.white),
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 200),
            style: TextStyle(
              fontSize: 10,
              fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
              color: isActive
                  ? (isDark ? const Color(0xFF4CD964) : const Color(0xFF2B5A2B))
                  : (isDark ? const Color(0xFF64748B) : const Color(0xFF999999)),
            ),
            child: Text(label),
          ),
        ],
      ),
    );
  }
}
