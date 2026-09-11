import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../core/image_utils.dart';

/// A high-performance, memory-efficient cached image widget.
/// 
/// Downsamples decoded images in memory using [memCacheWidth] and [memCacheHeight]
/// to prevent out-of-memory spikes, lag, and GC stuttering on mobile devices.
/// Also caches images on disk to eliminate repeated network downloads on scroll.
/// On Flutter Web, seamlessly routes through the local CORS proxy to prevent
/// CanvasKit canvas tainting.
class AppCachedImage extends StatelessWidget {
  final String imageUrl;
  final BoxFit fit;
  final double? width;
  final double? height;
  final int memCacheWidth;
  final int memCacheHeight;
  final Widget? placeholder;
  final Widget? errorWidget;
  final BorderRadius? borderRadius;

  const AppCachedImage({
    super.key,
    required this.imageUrl,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.memCacheWidth = 350,
    this.memCacheHeight = 350,
    this.placeholder,
    this.errorWidget,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final cleanUrl = resolveImageUrl(imageUrl);
    if (cleanUrl.isEmpty) {
      return errorWidget ?? const SizedBox();
    }

    Widget image;

    if (kIsWeb) {
      // On Flutter Web, Image.network directly creates an HTML image element
      // or integrates cleanly with the web engine without XMLHttpRequest CORS blocks.
      image = Image.network(
        cleanUrl,
        width: width,
        height: height,
        fit: fit,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return placeholder ??
              Container(
                width: width,
                height: height,
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF1E293B)
                    : const Color(0xFFF1F5F9),
                child: Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: const Color(0xFF4CD964).withValues(alpha: 0.6),
                    ),
                  ),
                ),
              );
        },
        errorBuilder: (context, error, stackTrace) =>
            errorWidget ??
            Container(
              width: width,
              height: height,
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF1E293B)
                  : const Color(0xFFF1F5F9),
              child: const Center(
                child: Icon(Icons.broken_image_outlined, size: 28, color: Colors.grey),
              ),
            ),
      );
    } else {
      // On Android / iOS, use CachedNetworkImage for persistent disk and memory caching
      image = CachedNetworkImage(
        imageUrl: cleanUrl,
        width: width,
        height: height,
        fit: fit,
        memCacheWidth: memCacheWidth,
        memCacheHeight: memCacheHeight,
        maxWidthDiskCache: 800,
        maxHeightDiskCache: 800,
        fadeInDuration: const Duration(milliseconds: 180),
        fadeOutDuration: const Duration(milliseconds: 180),
        placeholder: (context, url) =>
            placeholder ??
            Container(
              width: width,
              height: height,
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF1E293B)
                  : const Color(0xFFF1F5F9),
              child: Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: const Color(0xFF4CD964).withValues(alpha: 0.6),
                  ),
                ),
              ),
            ),
        errorWidget: (context, url, error) =>
            errorWidget ??
            Container(
              width: width,
              height: height,
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF1E293B)
                  : const Color(0xFFF1F5F9),
              child: const Center(
                child: Icon(Icons.broken_image_outlined, size: 28, color: Colors.grey),
              ),
            ),
      );
    }

    if (borderRadius != null) {
      return ClipRRect(
        borderRadius: borderRadius!,
        child: image,
      );
    }

    return image;
  }
}
