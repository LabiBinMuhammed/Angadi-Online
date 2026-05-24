import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: child,
      // Stack for custom bottom navigation
      bottomNavigationBar: Container(
        height: 80,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 40, offset: const Offset(0, -10))],
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
                  _buildNavItem(context, icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Home', index: 0, currentIndex: idx, path: '/home'),
                  _buildNavItem(context, icon: Icons.crop_free_rounded, activeIcon: Icons.crop_free_rounded, label: 'Orders', index: 1, currentIndex: idx, path: '/orders'),
                  _buildNavItem(context, icon: Icons.shopping_bag_outlined, activeIcon: Icons.shopping_bag_rounded, label: 'Bag', index: 2, currentIndex: idx, path: '/cart', isBag: true),
                  _buildNavItem(context, icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile', index: 3, currentIndex: idx, path: '/profile'),
                ],
              ),
            ),
            
            // Bottom handle indicator
            Positioned(
              bottom: 8,
              left: MediaQuery.of(context).size.width / 2 - 65,
              child: Container(width: 130, height: 5, decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(10))),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required int index,
    required int currentIndex,
    required String path,
    bool isBag = false,
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
                    Icon(
                      isActive ? activeIcon : icon,
                      size: 22,
                      color: isActive ? Colors.white : const Color(0xFF999999),
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
                              color: isActive ? const Color(0xFF32B84A) : Colors.white,
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
              color: isActive ? const Color(0xFF2B5A2B) : const Color(0xFF999999),
            ),
            child: Text(label),
          ),
        ],
      ),
    );
  }
}
