import 'package:flutter/material.dart';

// ─── Design Tokens (Vendor Premium Theme) ────────────────────────────────────
const Color kVendorBg = Color(0xFF09090B);
const Color kVendorText = Color(0xFFF8FAFC);
const Color kVendorSubText = Color(0xFF94A3B8);

const Color kVendorCardBg = Color(0x06FFFFFF);      // ~2% white
const Color kVendorCardBorder = Color(0x14FFFFFF);  // ~8% white
const Color kVendorInputBg = Color(0x0DFFFFFF);     // ~5% white

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
    labelStyle: const TextStyle(color: kVendorSubText, fontSize: 14),
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
          backgroundColor: Colors.white.withOpacity(0.03),
          foregroundColor: Colors.white,
          side: BorderSide(
            color: borderColor ?? Colors.white.withOpacity(0.15),
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

    switch (type) {
      case VendorBadgeType.success:
        bg = const Color(0x2622C55E); // 15% opacity success
        fg = const Color(0xFF4ADE80);
        border = const Color(0x3322C55E);
        break;
      case VendorBadgeType.warning:
        bg = const Color(0x26EAB308);
        fg = const Color(0xFFFACC15);
        border = const Color(0x33EAB308);
        break;
      case VendorBadgeType.danger:
        bg = const Color(0x26EF4444);
        fg = const Color(0xFFF87171);
        border = const Color(0x33EF4444);
        break;
      case VendorBadgeType.info:
        bg = const Color(0x263B82F6);
        fg = const Color(0xFF60A5FA);
        border = const Color(0x333B82F6);
        break;
      case VendorBadgeType.neutral:
        bg = const Color(0x2694A3B8);
        fg = const Color(0xFFCBD5E1);
        border = const Color(0x3394A3B8);
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
