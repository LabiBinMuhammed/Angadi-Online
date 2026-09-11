import 'package:flutter/foundation.dart';

/// Helper to resolve and sanitize image URLs.
/// On Flutter Web, external cross-origin images must be routed via `/proxy?url=...`
/// to prevent browser CORS blocks and CanvasKit / Skia canvas tainting.
String resolveImageUrl(String? url) {
  if (url == null) return '';
  final trimmed = url.trim();
  if (trimmed.isEmpty) return '';

  if (kIsWeb && trimmed.startsWith('http')) {
    if (trimmed.startsWith('/proxy?url=')) return trimmed;
    return '/proxy?url=${Uri.encodeComponent(trimmed)}';
  }
  return trimmed;
}
