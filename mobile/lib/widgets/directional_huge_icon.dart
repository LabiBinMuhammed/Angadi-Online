import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

class DirectionalHugeIcon extends StatelessWidget {
  final List<List<dynamic>> icon;
  final Color? color;
  final double? size;
  final bool mirror; // Allows manually overriding mirroring behavior if needed

  const DirectionalHugeIcon({
    super.key,
    required this.icon,
    this.color,
    this.size,
    this.mirror = true,
  });

  @override
  Widget build(BuildContext context) {
    final isRtl = Directionality.of(context) == TextDirection.rtl;

    if (isRtl && mirror) {
      return Transform.scale(
        scaleX: -1.0,
        child: HugeIcon(
          icon: icon,
          color: color ?? Theme.of(context).iconTheme.color ?? Colors.black,
          size: size ?? 24.0,
        ),
      );
    }

    return HugeIcon(
      icon: icon,
      color: color ?? Theme.of(context).iconTheme.color ?? Colors.black,
      size: size ?? 24.0,
    );
  }
}
