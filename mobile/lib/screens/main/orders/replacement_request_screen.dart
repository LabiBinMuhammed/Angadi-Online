import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';
import '../../../widgets/image_source_picker_sheet.dart';

class ReplacementRequestScreen extends StatefulWidget {
  final String orderId;
  const ReplacementRequestScreen({super.key, required this.orderId});

  @override
  State<ReplacementRequestScreen> createState() => _ReplacementRequestScreenState();
}

class _ReplacementRequestScreenState extends State<ReplacementRequestScreen> {
  late Future<_Data> _future;
  final Map<String, int> _selectedItems = {};
  String _reason = 'wrong_item';
  final TextEditingController _descController = TextEditingController();
  final List<XFile> _selectedImages = [];
  bool _submitting = false;
  String? _errorMsg;
  bool _success = false;

  static const _reasons = [
    {'value': 'wrong_item', 'label': 'Wrong Item Received'},
    {'value': 'damaged', 'label': 'Damaged / Broken Item'},
    {'value': 'expired', 'label': 'Expired Product'},
    {'value': 'missing_item', 'label': 'Missing Item'},
    {'value': 'quality_issue', 'label': 'Quality Issue'},
    {'value': 'other', 'label': 'Other Reason'},
  ];

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    if (_selectedImages.length >= 4) return;
    final source = await showImageSourcePicker(context);
    if (source == null) return;

    final picker = ImagePicker();
    try {
      final image = await picker.pickImage(source: source, imageQuality: 85);
      if (image != null) {
        setState(() {
          _selectedImages.add(image);
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Future<_Data> _fetch() async {
    final results = await Future.wait<dynamic>([
      supabase
          .from('orders')
          .select('*, shops(name, return_window_hours, replacement_policy)')
          .eq('id', widget.orderId)
          .eq('user_id', supabase.auth.currentUser!.id)
          .single(),
      supabase
          .from('order_items')
          .select('*, items(name), item_variants:vw_item_variants_with_fallback(label, price)')
          .eq('order_id', widget.orderId),
    ]);

    return _Data(
      order: results[0] as Map<String, dynamic>,
      items: List<Map<String, dynamic>>.from(results[1] as List),
    );
  }

  Future<void> _submit(String shopId) async {
    if (_selectedItems.isEmpty) {
      setState(() => _errorMsg = 'Please select at least one item for replacement.');
      return;
    }

    setState(() {
      _submitting = true;
      _errorMsg = null;
    });

    try {
      final userId = supabase.auth.currentUser!.id;

      String dbReason = 'Other';
      if (_reason == 'wrong_item') dbReason = 'Wrong Item';
      if (_reason == 'damaged') dbReason = 'Damaged';
      if (_reason == 'quality_issue') dbReason = 'Poor Quality';
      if (_reason == 'expired') dbReason = 'Expired';
      if (_reason == 'missing_item') dbReason = 'Missing Item';

      // Upload evidence photos if any
      List<String> imageUrls = [];
      for (final img in _selectedImages) {
        try {
          final bytes = await img.readAsBytes();
          final ext = img.name.contains('.') ? img.name.split('.').last : 'jpg';
          final filename = '${DateTime.now().millisecondsSinceEpoch}_${img.name.replaceAll(RegExp(r'[^a-zA-Z0-9.]'), '_')}';
          final path = 'replacements/${widget.orderId}/$filename';
          try {
            await supabase.storage.from('item-images').uploadBinary(
              path,
              bytes,
              fileOptions: FileOptions(contentType: 'image/$ext', upsert: true),
            );
            final url = supabase.storage.from('item-images').getPublicUrl(path);
            imageUrls.add(url);
          } catch (e) {
            await supabase.storage.from('replacements').uploadBinary(
              path,
              bytes,
              fileOptions: FileOptions(contentType: 'image/$ext', upsert: true),
            );
            final url = supabase.storage.from('replacements').getPublicUrl(path);
            imageUrls.add(url);
          }
        } catch (e) {
          debugPrint('Error uploading evidence image: $e');
        }
      }

      // 1. Insert replacement request
      final reqRes = await supabase
          .from('replacement_requests')
          .insert({
            'order_id': widget.orderId,
            'user_id': userId,
            'shop_id': shopId,
            'reason': dbReason,
            'description': _descController.text.trim().isEmpty ? null : _descController.text.trim(),
            'status': 'Pending',
            'customer_images': imageUrls,
          })
          .select()
          .single();

      final requestId = reqRes['id'] as String;

      // 2. Insert replacement items
      final itemsData = _selectedItems.entries.map((e) => {
        'replacement_request_id': requestId,
        'order_item_id': e.key,
        'quantity': e.value,
      }).toList();

      await supabase.from('replacement_items').insert(itemsData);

      if (mounted) {
        setState(() {
          _submitting = false;
          _success = true;
        });

        Future.delayed(const Duration(milliseconds: 1500), () {
          if (mounted) {
            context.pop(true);
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMsg = e.toString();
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final bgBase = isDark ? kNeutral900 : const Color(0xFFF0F2F5);
    final surface = isDark ? kNeutral800 : Colors.white;
    final border = isDark ? kNeutral700 : kNeutral200;
    final textBase = isDark ? Colors.white : kNeutral900;
    final textMuted = isDark ? kNeutral400 : kNeutral500;
    final textLight = isDark ? kNeutral400 : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: bgBase,
      body: SafeArea(
        child: FutureBuilder<_Data>(
          future: _future,
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final d = snapshot.data!;
            final order = d.order;
            final shop = order['shops'] as Map<String, dynamic>?;
            final shopName = shop?['name'] ?? 'Shop';
            final returnWindowHours = shop?['return_window_hours'] ?? 24;
            final shopId = order['shop_id'] as String;

            if (_success) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: const BoxDecoration(
                          color: Color(0xFFDCFCE7),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check_circle_rounded, color: Color(0xFF22C55E), size: 56),
                      ),
                      const SizedBox(height: 20),
                      Text('Replacement Requested!',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: textBase)),
                      const SizedBox(height: 8),
                      Text('Your request has been submitted to $shopName. You can track the status on your order page.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, color: textMuted)),
                    ],
                  ),
                ),
              );
            }

            return Column(
              children: [
                // ─── Header ─────────────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: surface, shape: BoxShape.circle,
                            border: Border.all(color: border),
                          ),
                          child: Icon(Icons.arrow_back_rounded, color: textBase, size: 20),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Request Replacement',
                              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: textBase, letterSpacing: -0.5)),
                            Text(shopName,
                              style: TextStyle(fontSize: 13, color: textMuted, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ─── Shop Return Policy Banner ────────────────────────
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFBFDBFE)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline_rounded, color: Color(0xFF3B82F6), size: 22),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Replacements are accepted within $returnWindowHours hours of delivery for damaged or wrong items.',
                                  style: TextStyle(fontSize: 13, color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF), fontWeight: FontWeight.w500),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // ─── Step 1: Select Items ─────────────────────────────
                        Text('1. Select items for replacement:',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textBase)),
                        const SizedBox(height: 10),

                        ...d.items.map((oi) {
                          final itemId = oi['id'] as String;
                          final itemName = (oi['items'] as Map?)?['name'] ?? 'Item';
                          final variantLabel = (oi['item_variants'] as Map?)?['label'] ?? '';
                          final maxQty = (oi['requested_value'] as num?)?.toInt() ?? 1;
                          final isSelected = _selectedItems.containsKey(itemId);
                          final currentQty = _selectedItems[itemId] ?? 1;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: isSelected ? const Color(0xFFF59E0B) : border, width: isSelected ? 2 : 1),
                            ),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: isSelected,
                                  activeColor: const Color(0xFFF59E0B),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                  onChanged: (val) {
                                    setState(() {
                                      if (val == true) {
                                        _selectedItems[itemId] = 1;
                                      } else {
                                        _selectedItems.remove(itemId);
                                      }
                                    });
                                  },
                                ),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(itemName, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textBase)),
                                      if (variantLabel.isNotEmpty)
                                        Text(variantLabel, style: TextStyle(fontSize: 13, color: textMuted)),
                                    ],
                                  ),
                                ),
                                if (isSelected) ...[
                                  Row(
                                    children: [
                                      IconButton(
                                        iconSize: 20,
                                        icon: const Icon(Icons.remove_circle_outline_rounded),
                                        onPressed: currentQty > 1 ? () {
                                          setState(() {
                                            _selectedItems[itemId] = currentQty - 1;
                                          });
                                        } : null,
                                      ),
                                      Text('$currentQty', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textBase)),
                                      IconButton(
                                        iconSize: 20,
                                        icon: const Icon(Icons.add_circle_outline_rounded),
                                        onPressed: currentQty < maxQty ? () {
                                          setState(() {
                                            _selectedItems[itemId] = currentQty + 1;
                                          });
                                        } : null,
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          );
                        }),

                        const SizedBox(height: 20),

                        // ─── Step 2: Select Reason ─────────────────────────────
                        Text('2. Reason for replacement:',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textBase)),
                        const SizedBox(height: 10),

                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _reasons.map((r) {
                            final selected = _reason == r['value'];
                            return ChoiceChip(
                              label: Text(r['label']!),
                              selected: selected,
                              selectedColor: const Color(0xFFF59E0B),
                              backgroundColor: surface,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: BorderSide(color: selected ? const Color(0xFFF59E0B) : border),
                              ),
                              labelStyle: TextStyle(
                                color: selected ? Colors.white : textBase,
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                              onSelected: (val) {
                                if (val) setState(() => _reason = r['value']!);
                              },
                            );
                          }).toList(),
                        ),

                        const SizedBox(height: 20),

                        // ─── Step 3: Description ──────────────────────────────
                        Text('3. Describe the problem:',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textBase)),
                        const SizedBox(height: 10),

                        TextField(
                          controller: _descController,
                          maxLines: 4,
                          style: TextStyle(color: textBase, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Please provide details about what went wrong (e.g. damaged packaging, missing quantity)...',
                            hintStyle: TextStyle(color: textLight, fontSize: 13),
                            filled: true,
                            fillColor: surface,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: border)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: border)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: Color(0xFFF59E0B), width: 2)),
                          ),
                        ),

                        const SizedBox(height: 20),

                        // ─── Step 4: Attach Photos ─────────────────────────────
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('4. Attach Evidence Photos (Optional):',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textBase)),
                            Text('${_selectedImages.length}/4',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textLight)),
                          ],
                        ),
                        const SizedBox(height: 10),

                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              ...List.generate(_selectedImages.length, (index) {
                                final img = _selectedImages[index];
                                return Container(
                                  margin: const EdgeInsets.only(right: 12),
                                  width: 84,
                                  height: 84,
                                  child: Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(16),
                                        child: FutureBuilder<Uint8List>(
                                          future: img.readAsBytes(),
                                          builder: (context, snapshot) {
                                            if (snapshot.hasData) {
                                              return Image.memory(snapshot.data!, width: 84, height: 84, fit: BoxFit.cover);
                                            }
                                            return Container(width: 84, height: 84, color: surface);
                                          },
                                        ),
                                      ),
                                      Positioned(
                                        top: 4,
                                        right: 4,
                                        child: GestureDetector(
                                          onTap: () => _removeImage(index),
                                          child: Container(
                                            padding: const EdgeInsets.all(4),
                                            decoration: const BoxDecoration(
                                              color: Colors.black87,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),

                              if (_selectedImages.length < 4)
                                GestureDetector(
                                  onTap: _pickImage,
                                  child: Container(
                                    width: 84,
                                    height: 84,
                                    decoration: BoxDecoration(
                                      color: surface,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: border, style: BorderStyle.solid),
                                    ),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.add_a_photo_rounded, color: Color(0xFFF59E0B), size: 24),
                                        const SizedBox(height: 4),
                                        Text('Add Photo', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textLight)),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),

                        if (_errorMsg != null) ...[
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFFCA5A5)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 20),
                                const SizedBox(width: 8),
                                Expanded(child: Text(_errorMsg!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13, fontWeight: FontWeight.w600))),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 28),

                        // ─── Submit Button ────────────────────────────────────
                        GestureDetector(
                          onTap: _submitting ? null : () => _submit(shopId),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                )
                              ],
                            ),
                            child: Center(
                              child: _submitting
                                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('Submit Replacement Request',
                                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Data {
  final Map<String, dynamic> order;
  final List<Map<String, dynamic>> items;
  _Data({required this.order, required this.items});
}
