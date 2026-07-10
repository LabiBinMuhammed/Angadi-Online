import 'package:flutter/material.dart';
import '../../theme/theme_service.dart';

// ─── Design Tokens (Vendor Premium Theme) ────────────────────────────────────
Color get kVendorBg => ThemeService.instance.isDarkMode ? const Color(0xFF09090B) : const Color(0xFFF8FAFC);
Color get kVendorText => ThemeService.instance.isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
Color get kVendorSubText => ThemeService.instance.isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

Color get kVendorCardBg => ThemeService.instance.isDarkMode ? const Color(0x06FFFFFF) : Colors.white;      // ~2% white / solid white
Color get kVendorCardBorder => ThemeService.instance.isDarkMode ? const Color(0x14FFFFFF) : const Color(0xFFE2E8F0);  // ~8% white / light border
Color get kVendorInputBg => ThemeService.instance.isDarkMode ? const Color(0x0DFFFFFF) : const Color(0xFFF1F5F9);     // ~5% white / light grey
Color get kVendorDivider => ThemeService.instance.isDarkMode ? const Color(0x14FFFFFF) : const Color(0xFFE2E8F0);
Color get kVendorDialogBg => ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : Colors.white;
Color get kVendorFocusedBorder => ThemeService.instance.isDarkMode ? const Color(0x33FFFFFF) : const Color(0x33000000);
Color get kVendorTransparentBg => ThemeService.instance.isDarkMode ? const Color(0x0AFFFFFF) : const Color(0x0A000000);
Color get kVendorTransparentBorder => ThemeService.instance.isDarkMode ? const Color(0x14FFFFFF) : const Color(0x14000000);

BoxDecoration vendorCardDecoration({double radius = 24}) {
  return BoxDecoration(
    color: kVendorCardBg,
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(color: kVendorCardBorder),
  );
}

// ─── Input Decoration ─────────────────────────────────────────────────────────
InputDecoration vendorInputDecoration({
  String? hintText,
  String? labelText,
  Widget? prefixIcon,
  Widget? suffixIcon,
}) {
  return InputDecoration(
    hintText: hintText,
    labelText: labelText,
    prefixIcon: prefixIcon,
    suffixIcon: suffixIcon,
    filled: true,
    fillColor: kVendorInputBg,
    labelStyle: TextStyle(color: kVendorSubText, fontSize: 14),
    hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0x33FFFFFF), width: 1),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0x4DF87171), width: 1),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFF87171), width: 1.5),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );
}

// ─── Reusable Widgets ────────────────────────────────────────────────────────

/// Premium Gradient Button (Blue to Purple)
class VendorGradientButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final double? width;
  final double height;
  final bool loading;

  const VendorGradientButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.width,
    this.height = 48,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: disabled
            ? null
            : const LinearGradient(
                colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
        color: disabled ? Colors.white.withOpacity(0.1) : null,
        boxShadow: disabled
            ? []
            : [
                BoxShadow(
                  color: const Color(0xFF6366F1).withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: ElevatedButton(
        onPressed: disabled ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          shadowColor: Colors.transparent,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : child,
      ),
    );
  }
}

/// Premium Outline Button
class VendorOutlineButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final double? width;
  final double height;
  final Color? borderColor;
  final bool loading;

  const VendorOutlineButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.width,
    this.height = 48,
    this.borderColor,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    return SizedBox(
      width: width,
      height: height,
      child: OutlinedButton(
        onPressed: disabled ? null : onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: ThemeService.instance.isDarkMode ? Colors.white.withValues(alpha: 0.03) : Colors.black.withValues(alpha: 0.03),
          foregroundColor: ThemeService.instance.isDarkMode ? Colors.white : const Color(0xFF0F172A),
          side: BorderSide(
            color: borderColor ?? (ThemeService.instance.isDarkMode ? Colors.white.withValues(alpha: 0.15) : Colors.black.withValues(alpha: 0.15)),
            width: 1,
          ),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : child,
      ),
    );
  }
}

/// Premium Badge / Tag Capsule
enum VendorBadgeType { success, warning, danger, info, neutral }

class VendorBadge extends StatelessWidget {
  final String label;
  final VendorBadgeType type;

  const VendorBadge({
    super.key,
    required this.label,
    this.type = VendorBadgeType.neutral,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Color border;

    final isDark = ThemeService.instance.isDarkMode;
    switch (type) {
      case VendorBadgeType.success:
        bg = isDark ? const Color(0x2622C55E) : const Color(0xFFDCFCE7);
        fg = isDark ? const Color(0xFF4ADE80) : const Color(0xFF15803D);
        border = isDark ? const Color(0x3322C55E) : const Color(0xFFBBF7D0);
        break;
      case VendorBadgeType.warning:
        bg = isDark ? const Color(0x26EAB308) : const Color(0xFFFEF3C7);
        fg = isDark ? const Color(0xFFFACC15) : const Color(0xFFB45309);
        border = isDark ? const Color(0x33EAB308) : const Color(0xFFFDE68A);
        break;
      case VendorBadgeType.danger:
        bg = isDark ? const Color(0x26EF4444) : const Color(0xFFFEE2E2);
        fg = isDark ? const Color(0xFFF87171) : const Color(0xFFB91C1C);
        border = isDark ? const Color(0x33EF4444) : const Color(0xFFFCA5A5);
        break;
      case VendorBadgeType.info:
        bg = isDark ? const Color(0x263B82F6) : const Color(0xFFDBEAFE);
        fg = isDark ? const Color(0xFF60A5FA) : const Color(0xFF1D4ED8);
        border = isDark ? const Color(0x333B82F6) : const Color(0xFFBFDBFE);
        break;
      case VendorBadgeType.neutral:
        bg = isDark ? const Color(0x2694A3B8) : const Color(0xFFF1F5F9);
        fg = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569);
        border = isDark ? const Color(0x3394A3B8) : const Color(0xFFE2E8F0);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: border),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
