import 'package:flutter/foundation.dart';

/// Helper to resolve and sanitize image URLs.
/// On Flutter Web, external cross-origin images must be routed via `/proxy?url=...`
/// to prevent browser CORS blocks and CanvasKit / Skia canvas tainting.
String resolveImageUrl(String? url) {
  if (url == null) return '';
  final trimmed = url.trim();
  if (trimmed.isEmpty) return '';

  // If a URL has leftover /proxy?url= prefix, unwrap it to the clean direct URL
  if (trimmed.startsWith('/proxy?url=')) {
    try {
      return Uri.decodeComponent(trimmed.substring('/proxy?url='.length));
    } catch (_) {
      return trimmed;
    }
  }

  return trimmed;
}
