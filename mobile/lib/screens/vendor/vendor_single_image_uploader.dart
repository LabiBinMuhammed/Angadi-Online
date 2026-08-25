import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../../widgets/image_source_picker_sheet.dart';
import 'vendor_theme_helper.dart';

class VendorSingleImageUploader extends StatefulWidget {
  final String label;
  final String? initialUrl;
  final ValueChanged<String> onUrlChanged;
  final bool isBanner;
  final String? helperText;

  const VendorSingleImageUploader({
    super.key,
    required this.label,
    required this.initialUrl,
    required this.onUrlChanged,
    this.isBanner = false,
    this.helperText,
  });

  @override
  State<VendorSingleImageUploader> createState() => _VendorSingleImageUploaderState();
}

class _VendorSingleImageUploaderState extends State<VendorSingleImageUploader> {
  String? _currentUrl;
  bool _uploading = false;
  String? _error;
  bool _showUrlInput = false;
  late TextEditingController _urlController;

  @override
  void initState() {
    super.initState();
    _currentUrl = widget.initialUrl;
    _urlController = TextEditingController(text: _currentUrl ?? '');
  }

  @override
  void didUpdateWidget(covariant VendorSingleImageUploader oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialUrl != oldWidget.initialUrl) {
      setState(() {
        _currentUrl = widget.initialUrl;
        if (_urlController.text != (widget.initialUrl ?? '')) {
          _urlController.text = widget.initialUrl ?? '';
        }
      });
    }
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImage() async {
    final source = await showImageSourcePicker(context);
    if (source == null) return;

    setState(() {
      _uploading = true;
      _error = null;
    });

    try {
      final picker = ImagePicker();
      final XFile? file = await picker.pickImage(
        source: source,
        maxWidth: widget.isBanner ? 1600 : 900,
        imageQuality: 88,
      );

      if (file == null) {
        setState(() => _uploading = false);
        return;
      }

      final bytes = await file.readAsBytes();
      final fileExt = file.name.contains('.') ? file.name.split('.').last : 'jpg';
      final randomSuffix = math.Random().nextInt(999999).toString().padLeft(6, '0');
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$randomSuffix.$fileExt';
      final path = 'shops/$fileName';

      final contentType = fileExt.toLowerCase() == 'png'
          ? 'image/png'
          : fileExt.toLowerCase() == 'webp'
              ? 'image/webp'
              : 'image/jpeg';

      await supabase.storage.from('item-images').uploadBinary(
        path,
        bytes,
        fileOptions: FileOptions(
          contentType: contentType,
          upsert: true,
        ),
      );

      final publicUrl = supabase.storage.from('item-images').getPublicUrl(path);

      setState(() {
        _currentUrl = publicUrl;
        _urlController.text = publicUrl;
      });
      widget.onUrlChanged(publicUrl);
    } catch (e) {
      debugPrint('Error uploading shop image: $e');
      setState(() {
        _error = 'Failed to upload image: ${e.toString()}';
      });
    } finally {
      if (mounted) {
        setState(() => _uploading = false);
      }
    }
  }

  void _removeImage() {
    setState(() {
      _currentUrl = '';
      _urlController.clear();
      _error = null;
    });
    widget.onUrlChanged('');
  }

  @override
  Widget build(BuildContext context) {
    final double boxHeight = widget.isBanner ? 160 : 140;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label & Badge Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              widget.label,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText),
            ),
            if (widget.helperText != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
                ),
                child: Text(
                  widget.helperText!,
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFFBBF24)),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),

        // Error message container if upload fails
        if (_error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.redAccent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.redAccent, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],

        // Main Dropzone / Preview Container
        if (_currentUrl != null && _currentUrl!.trim().isNotEmpty)
          // PREVIEW STATE
          Container(
            height: boxHeight,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFF18181B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.4), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(15),
              child: Stack(
                children: [
                  // Image Display
                  Positioned.fill(
                    child: Image.network(
                      _currentUrl!,
                      fit: widget.isBanner ? BoxFit.cover : BoxFit.contain,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return const Center(
                          child: CircularProgressIndicator(color: Color(0xFF60A5FA), strokeWidth: 2),
                        );
                      },
                      errorBuilder: (_, __, ___) => Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.broken_image_rounded, color: Colors.white38, size: 36),
                            const SizedBox(height: 4),
                            Text('Image link invalid', style: TextStyle(color: kVendorSubText, fontSize: 11)),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Top Gradient Overlay with Status Chip
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle, color: Color(0xFF4CD964), size: 12),
                          SizedBox(width: 4),
                          Text('Uploaded', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),

                  // Bottom Gradient Action Bar
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.black.withValues(alpha: 0.85),
                            Colors.black.withValues(alpha: 0.4),
                          ],
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          ElevatedButton.icon(
                            onPressed: _uploading ? null : _pickAndUploadImage,
                            icon: const Icon(Icons.cloud_upload_outlined, size: 14, color: Colors.black),
                            label: const Text('Change Photo', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              elevation: 2,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: _removeImage,
                            icon: const Icon(Icons.delete_outline, size: 14, color: Colors.white),
                            label: const Text('Remove', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.redAccent,
                              elevation: 2,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          // DROPZONE UPLOAD STATE
          InkWell(
            onTap: _uploading ? null : _pickAndUploadImage,
            borderRadius: BorderRadius.circular(16),
            child: Ink(
              height: boxHeight,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.35),
                  width: 1.5,
                ),
              ),
              child: _uploading
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const CircularProgressIndicator(color: Color(0xFF60A5FA), strokeWidth: 3),
                          const SizedBox(height: 12),
                          Text(
                            'Uploading image file...',
                            style: TextStyle(color: kVendorText, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Please wait a moment',
                            style: TextStyle(color: kVendorSubText, fontSize: 11),
                          ),
                        ],
                      ),
                    )
                  : Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  const Color(0xFF3B82F6).withValues(alpha: 0.25),
                                  const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFF60A5FA).withValues(alpha: 0.4)),
                            ),
                            child: const HugeIcon(
                              icon: HugeIcons.strokeRoundedImageAdd01,
                              color: Color(0xFF60A5FA),
                              size: 26,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Tap to upload ${widget.label}',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kVendorText),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Supports JPG, PNG, WEBP files (Max 5MB)',
                            style: TextStyle(fontSize: 11, color: kVendorSubText),
                          ),
                        ],
                      ),
                    ),
            ),
          ),

        // Manual URL toggle
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton.icon(
            onPressed: () => setState(() => _showUrlInput = !_showUrlInput),
            icon: Icon(_showUrlInput ? Icons.keyboard_arrow_up : Icons.link, size: 14, color: const Color(0xFF94A3B8)),
            label: Text(
              _showUrlInput ? 'Hide manual link input' : 'Or paste URL link manually',
              style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8), decoration: TextDecoration.underline),
            ),
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
        ),

        if (_showUrlInput) ...[
          const SizedBox(height: 6),
          TextFormField(
            controller: _urlController,
            style: TextStyle(color: kVendorText, fontSize: 13),
            decoration: vendorInputDecoration(
              hintText: 'https://example.com/image.jpg',
              prefixIcon: Icon(Icons.link, color: kVendorSubText, size: 18),
            ),
            onChanged: (val) {
              setState(() => _currentUrl = val);
              widget.onUrlChanged(val);
            },
          ),
        ],
      ],
    );
  }
}
