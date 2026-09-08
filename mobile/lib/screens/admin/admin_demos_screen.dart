import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:desktop_drop/desktop_drop.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import 'admin_drawer.dart';

class AdminDemosScreen extends StatefulWidget {
  const AdminDemosScreen({super.key});

  @override
  State<AdminDemosScreen> createState() => _AdminDemosScreenState();
}

class _AdminDemosScreenState extends State<AdminDemosScreen> {
  List<Map<String, dynamic>> _demos = [];
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _units = [];
  bool _loading = true;

  // Search & Filters
  String _searchQuery = '';
  String _selectedCategoryFilter = 'all';
  String _selectedSellModeFilter = 'all';
  bool _isGridView = true;

  static const List<String> _sellModes = ['Manual', 'Fixed', 'Dynamic', 'Portion'];

  // Curated Preset Image URLs for quick selection
  static const Map<String, String> _presetImages = {
    'Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
    'Grains & Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    'Spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
    'Dairy': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    'Beverages': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await Future.wait([
        supabase
            .from('demo_items')
            .select('id, name, sell_mode, default_image, category_id, unit_id, code, display_order')
            .order('name'),
        supabase
            .from('categories')
            .select('id, name, display_order')
            .eq('is_active', true)
            .order('display_order'),
        supabase
            .from('units')
            .select('id, name, symbol')
            .order('name'),
      ]);

      if (mounted) {
        setState(() {
          _demos = (res[0] as List).cast<Map<String, dynamic>>();
          _categories = (res[1] as List).cast<Map<String, dynamic>>();
          _units = (res[2] as List).cast<Map<String, dynamic>>();
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading demos data: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  // Filtered Demos
  List<Map<String, dynamic>> get _filteredDemos {
    return _demos.where((d) {
      // Category filter
      if (_selectedCategoryFilter != 'all') {
        if (d['category_id'] != _selectedCategoryFilter) return false;
      }

      // Sell mode filter
      if (_selectedSellModeFilter != 'all') {
        if (d['sell_mode'] != _selectedSellModeFilter) return false;
      }

      // Search query filter
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase().trim();
        final name = (d['name'] as String? ?? '').toLowerCase();
        final code = (d['code'] as String? ?? '').toLowerCase();
        if (!name.contains(q) && !code.contains(q)) return false;
      }

      return true;
    }).toList();
  }

  // ─────────────────────────────────────────────────────────────
  // OPEN ADD / EDIT TEMPLATE MODAL SHEET
  // ─────────────────────────────────────────────────────────────
  void _openTemplateEditor([Map<String, dynamic>? item]) async {
    final isEditing = item != null;
    final nameCtrl = TextEditingController(text: isEditing ? (item['name'] ?? '') : '');
    final codeCtrl = TextEditingController(text: isEditing ? (item['code'] ?? '') : '');
    final imageCtrl = TextEditingController(text: isEditing ? (item['default_image'] ?? '') : '');
    final orderCtrl = TextEditingController(text: isEditing && item['display_order'] != null ? item['display_order'].toString() : '');
    final mlCtrl = TextEditingController();

    String selectedSellMode = isEditing ? (item['sell_mode'] ?? 'Fixed') : 'Fixed';
    String? selectedCategoryId = isEditing ? item['category_id'] : (_categories.isNotEmpty ? _categories.first['id'] : null);
    String? selectedUnitId = isEditing ? item['unit_id'] : (_units.isNotEmpty ? _units.first['id'] : null);
    bool isSaving = false;
    bool isUploadingImage = false;
    bool isDraggingImage = false;
    String? uploadError;

    // Fetch existing Malayalam translation if editing
    if (isEditing) {
      try {
        final trans = await supabase
            .from('demo_item_translations')
            .select('name')
            .eq('demo_item_id', item['id'])
            .eq('language_code', 'ml')
            .maybeSingle();
        if (trans != null && trans['name'] != null) {
          mlCtrl.text = trans['name'] as String;
        }
      } catch (_) {}
    }

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final previewImage = imageCtrl.text.trim();

            Future<void> uploadAndApplyImage(Uint8List bytes, String originalName) async {
              setModalState(() {
                isUploadingImage = true;
                uploadError = null;
              });
              try {
                final fileExt = originalName.contains('.') ? originalName.split('.').last : 'jpg';
                final randomSuffix = math.Random().nextInt(999999).toString().padLeft(6, '0');
                final fileName = 'demo_${DateTime.now().millisecondsSinceEpoch}_$randomSuffix.$fileExt';
                final path = 'demos/$fileName';

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
                setModalState(() {
                  imageCtrl.text = publicUrl;
                  isUploadingImage = false;
                });
              } catch (e) {
                debugPrint('Error uploading image: $e');
                setModalState(() {
                  uploadError = 'Upload failed: $e';
                  isUploadingImage = false;
                });
              }
            }

            return DropTarget(
              onDragEntered: (_) => setModalState(() => isDraggingImage = true),
              onDragExited: (_) => setModalState(() => isDraggingImage = false),
              onDragDone: (detail) async {
                setModalState(() => isDraggingImage = false);
                if (detail.files.isNotEmpty) {
                  final file = detail.files.first;
                  final bytes = await file.readAsBytes();
                  await uploadAndApplyImage(bytes, file.name);
                }
              },
              child: Stack(
                children: [
                  Container(
                    padding: EdgeInsets.only(
                      bottom: MediaQuery.of(context).viewInsets.bottom,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(context).scaffoldBackgroundColor,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                      boxShadow: const [
                        BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, -4)),
                      ],
                    ),
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Handle Bar
                          Center(
                            child: Container(
                              width: 44,
                              height: 5,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade400,
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Title
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                isEditing ? 'Edit Blueprint Template' : 'Add Master Template',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close, size: 20),
                                onPressed: () => Navigator.pop(ctx),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // ─── Cover Image Drag & Drop / Upload Box ───
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isDraggingImage
                                  ? kWaTeal.withValues(alpha: 0.12)
                                  : Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDraggingImage
                                ? kWaTeal
                                : Colors.grey.withValues(alpha: 0.2),
                            width: isDraggingImage ? 2 : 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Interactive Preview / Upload Box
                                InkWell(
                                  onTap: isUploadingImage
                                      ? null
                                      : () async {
                                          final picker = ImagePicker();
                                          final XFile? file = await picker.pickImage(
                                            source: ImageSource.gallery,
                                            maxWidth: 1200,
                                            imageQuality: 88,
                                          );
                                          if (file != null) {
                                            final bytes = await file.readAsBytes();
                                            await uploadAndApplyImage(bytes, file.name);
                                          }
                                        },
                                  borderRadius: BorderRadius.circular(14),
                                  child: Stack(
                                    children: [
                                      Container(
                                        width: 92,
                                        height: 92,
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade100,
                                          borderRadius: BorderRadius.circular(14),
                                          border: Border.all(
                                            color: isDraggingImage ? kWaTeal : kWaTeal.withValues(alpha: 0.4),
                                            width: isDraggingImage ? 2 : 1.5,
                                          ),
                                        ),
                                        clipBehavior: Clip.antiAlias,
                                        child: isUploadingImage
                                            ? Center(
                                                child: Column(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    SizedBox(
                                                      width: 22,
                                                      height: 22,
                                                      child: CircularProgressIndicator(strokeWidth: 2, color: kWaTeal),
                                                    ),
                                                    const SizedBox(height: 6),
                                                    Text('Uploading...', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: kWaTeal)),
                                                  ],
                                                ),
                                              )
                                            : isDraggingImage
                                                ? Center(
                                                    child: Column(
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
                                                        Icon(Icons.file_download_outlined, color: kWaTeal, size: 30),
                                                        const SizedBox(height: 4),
                                                        Text('Drop Here', style: TextStyle(fontSize: 10, color: kWaTeal, fontWeight: FontWeight.w800)),
                                                      ],
                                                    ),
                                                  )
                                                : previewImage.isNotEmpty
                                                    ? CachedNetworkImage(
                                                        imageUrl: previewImage,
                                                        fit: BoxFit.cover,
                                                        placeholder: (_, __) => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                                                        errorWidget: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.grey),
                                                      )
                                                    : Center(
                                                        child: Column(
                                                          mainAxisSize: MainAxisSize.min,
                                                          children: [
                                                            Icon(Icons.cloud_upload_outlined, color: kWaTeal, size: 30),
                                                            const SizedBox(height: 4),
                                                            Text('Tap to Upload', style: TextStyle(fontSize: 10, color: kWaTeal, fontWeight: FontWeight.w700)),
                                                          ],
                                                        ),
                                                      ),
                                      ),
                                      if (previewImage.isNotEmpty && !isUploadingImage && !isDraggingImage)
                                        Positioned(
                                          bottom: 0,
                                          left: 0,
                                          right: 0,
                                          child: Container(
                                            color: Colors.black54,
                                            padding: const EdgeInsets.symmetric(vertical: 2),
                                            child: const Text(
                                              'Change',
                                              textAlign: TextAlign.center,
                                              style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      // Upload Image Action Button
                                      ElevatedButton.icon(
                                        onPressed: isUploadingImage
                                            ? null
                                            : () async {
                                                final picker = ImagePicker();
                                                final XFile? file = await picker.pickImage(
                                                  source: ImageSource.gallery,
                                                  maxWidth: 1200,
                                                  imageQuality: 88,
                                                );
                                                if (file != null) {
                                                  final bytes = await file.readAsBytes();
                                                  await uploadAndApplyImage(bytes, file.name);
                                                }
                                              },
                                        icon: isUploadingImage
                                            ? const SizedBox(
                                                width: 14,
                                                height: 14,
                                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                              )
                                            : const Icon(Icons.photo_camera_back_outlined, size: 16),
                                        label: Text(
                                          isUploadingImage
                                              ? 'Uploading File...'
                                              : (previewImage.isNotEmpty ? 'Replace Photo' : 'Upload Image File'),
                                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                                        ),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: kWaTeal,
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          elevation: 0,
                                        ),
                                      ),
                                      const SizedBox(height: 8),

                                      // URL Input
                                      TextField(
                                        controller: imageCtrl,
                                        onChanged: (_) => setModalState(() {}),
                                        decoration: InputDecoration(
                                          labelText: 'Or Paste Image URL',
                                          hintText: 'https://images.unsplash.com/...',
                                          isDense: true,
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                          suffixIcon: previewImage.isNotEmpty
                                              ? IconButton(
                                                  icon: const Icon(Icons.clear, size: 16),
                                                  onPressed: () {
                                                    imageCtrl.clear();
                                                    setModalState(() {});
                                                  },
                                                )
                                              : null,
                                        ),
                                      ),
                                      const SizedBox(height: 6),

                                      // Quick Presets
                                      SingleChildScrollView(
                                        scrollDirection: Axis.horizontal,
                                        child: Row(
                                          children: _presetImages.entries.map((entry) {
                                            return Padding(
                                              padding: const EdgeInsets.only(right: 6),
                                              child: ActionChip(
                                                padding: EdgeInsets.zero,
                                                label: Text(entry.key, style: const TextStyle(fontSize: 10)),
                                                onPressed: () {
                                                  imageCtrl.text = entry.value;
                                                  setModalState(() {});
                                                },
                                              ),
                                            );
                                          }).toList(),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            // Drag and Drop Indicator Banner (also clickable to browse)
                            InkWell(
                              onTap: isUploadingImage
                                  ? null
                                  : () async {
                                      final picker = ImagePicker();
                                      final XFile? file = await picker.pickImage(
                                        source: ImageSource.gallery,
                                        maxWidth: 1200,
                                        imageQuality: 88,
                                      );
                                      if (file != null) {
                                        final bytes = await file.readAsBytes();
                                        await uploadAndApplyImage(bytes, file.name);
                                      }
                                    },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                                decoration: BoxDecoration(
                                  color: isDraggingImage
                                      ? kWaTeal.withValues(alpha: 0.2)
                                      : Colors.grey.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isDraggingImage
                                        ? kWaTeal
                                        : Colors.grey.withValues(alpha: 0.25),
                                    style: BorderStyle.solid,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      isDraggingImage
                                          ? Icons.file_download_done_rounded
                                          : Icons.file_download_outlined,
                                      size: 16,
                                      color: isDraggingImage ? kWaTeal : Colors.grey.shade600,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      isDraggingImage
                                          ? '⚡ Drop Image to Upload Instantly'
                                          : 'Drag & Drop Image Here to Upload to Input',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: isDraggingImage ? FontWeight.w800 : FontWeight.w600,
                                        color: isDraggingImage ? kWaTeal : Colors.grey.shade700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (uploadError != null) ...[
                      const SizedBox(height: 6),
                      Text(uploadError!, style: const TextStyle(color: Colors.red, fontSize: 11)),
                    ],
                    const SizedBox(height: 16),

                    // English Name
                    TextField(
                      controller: nameCtrl,
                      decoration: InputDecoration(
                        labelText: 'Product Name (English) *',
                        hintText: 'e.g. Turmeric Powder',
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Malayalam Name
                    TextField(
                      controller: mlCtrl,
                      decoration: InputDecoration(
                        labelText: 'മലയാളം പേര് (Malayalam Translation)',
                        hintText: 'e.g. മഞ്ഞൾപ്പൊടി',
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Category & Base Unit Dropdowns
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: selectedCategoryId,
                            decoration: InputDecoration(
                              labelText: 'Category',
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            items: _categories.map((c) {
                              return DropdownMenuItem<String>(
                                value: c['id'] as String,
                                child: Text(c['name'] ?? '', overflow: TextOverflow.ellipsis),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) setModalState(() => selectedCategoryId = val);
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: selectedUnitId,
                            decoration: InputDecoration(
                              labelText: 'Base Unit',
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            items: _units.map((u) {
                              return DropdownMenuItem<String>(
                                value: u['id'] as String,
                                child: Text('${u['name']} (${u['symbol']})', overflow: TextOverflow.ellipsis),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) setModalState(() => selectedUnitId = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Code & Display Order
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextField(
                            controller: codeCtrl,
                            decoration: InputDecoration(
                              labelText: 'Blueprint Code',
                              hintText: 'e.g. ANG-SPI-0022',
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          flex: 1,
                          child: TextField(
                            controller: orderCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Order',
                              hintText: '1',
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Selling Mode Selector Pills
                    const Text('Selling Mode Blueprint', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      children: _sellModes.map((m) {
                        final isSel = selectedSellMode == m;
                        final icon = m == 'Manual' ? '⚖️' : m == 'Fixed' ? '📦' : m == 'Dynamic' ? '⚡' : '🍰';
                        return ChoiceChip(
                          label: Text('$icon $m'),
                          selected: isSel,
                          selectedColor: kWaTeal.withValues(alpha: 0.15),
                          labelStyle: TextStyle(
                            color: isSel ? kWaTeal : Colors.black87,
                            fontWeight: isSel ? FontWeight.w800 : FontWeight.w500,
                          ),
                          onSelected: (_) => setModalState(() => selectedSellMode = m),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    // Save Button
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kWaTeal,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      onPressed: isSaving ? null : () async {
                        final name = nameCtrl.text.trim();
                        final image = imageCtrl.text.trim();
                        final code = codeCtrl.text.trim();
                        final order = int.tryParse(orderCtrl.text.trim());
                        final mlName = mlCtrl.text.trim();

                        if (name.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Item name is required.')),
                          );
                          return;
                        }

                        final messenger = ScaffoldMessenger.of(context);
                        setModalState(() => isSaving = true);

                        try {
                          final payload = {
                            'name': name,
                            'sell_mode': selectedSellMode,
                            'category_id': selectedCategoryId,
                            'unit_id': selectedUnitId,
                            'default_image': image.isEmpty ? null : image,
                            'code': code.isEmpty ? null : code,
                            'display_order': order,
                          };

                          if (isEditing) {
                            // Update
                            await supabase.from('demo_items').update(payload).eq('id', item['id']);

                            // Upsert Malayalam translation
                            if (mlName.isNotEmpty) {
                              await supabase.from('demo_item_translations').upsert({
                                'demo_item_id': item['id'],
                                'language_code': 'ml',
                                'name': mlName,
                              }, onConflict: 'demo_item_id,language_code');
                            }

                            if (mounted) {
                              setState(() {
                                final idx = _demos.indexWhere((d) => d['id'] == item['id']);
                                if (idx != -1) {
                                  _demos[idx] = { ..._demos[idx], ...payload };
                                }
                              });
                            }
                          } else {
                            // Insert
                            final inserted = await supabase.from('demo_items').insert(payload).select().single();

                            // Upsert Malayalam translation
                            if (mlName.isNotEmpty && inserted['id'] != null) {
                              await supabase.from('demo_item_translations').upsert({
                                'demo_item_id': inserted['id'],
                                'language_code': 'ml',
                                'name': mlName,
                              }, onConflict: 'demo_item_id,language_code');
                            }

                            if (mounted) {
                              setState(() {
                                _demos.add(inserted);
                                _demos.sort((a, b) => (a['name'] as String).compareTo(b['name'] as String));
                              });
                            }
                          }

                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          messenger.showSnackBar(
                            SnackBar(content: Text(isEditing ? 'Template updated!' : 'Template added!')),
                          );
                        } catch (err) {
                          debugPrint('Error saving template: $err');
                          if (mounted) {
                            setModalState(() => isSaving = false);
                          }
                          messenger.showSnackBar(
                            SnackBar(content: Text('Error: $err')),
                          );
                        }
                      },
                      child: isSaving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(
                              isEditing ? 'Save Template Changes' : 'Create Template',
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                            ),
                    ),
                  ],
                ),
              ),
            ),
            if (isDraggingImage)
              Positioned.fill(
                child: IgnorePointer(
                  ignoring: true,
                  child: Container(
                    decoration: BoxDecoration(
                      color: kWaTeal.withValues(alpha: 0.92),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.cloud_upload_rounded, color: Colors.white, size: 60),
                          SizedBox(height: 12),
                          Text(
                            'Drop Image to Upload',
                            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: 6),
                          Text(
                            'Release file anywhere inside modal to upload',
                            style: TextStyle(color: Colors.white70, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      );
    },
  );
},
);
}

  // ─────────────────────────────────────────────────────────────
  // DELETE BLUEPRINT TEMPLATE
  // ─────────────────────────────────────────────────────────────
  Future<void> _delete(Map<String, dynamic> demo) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.red),
              SizedBox(width: 8),
              Text('Delete Blueprint'),
            ],
          ),
          content: Text(
            'Are you sure you want to delete "${demo['name']}" (${demo['code'] ?? 'No Code'})?\n\n'
            'This removes the master blueprint template, configs, and variants.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Confirm Delete', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    try {
      // 1. Delete associated child records
      await supabase.from('demo_variants').delete().eq('demo_item_id', demo['id']);
      await supabase.from('demo_sell_config').delete().eq('demo_item_id', demo['id']);
      await supabase.from('demo_item_translations').delete().eq('demo_item_id', demo['id']);

      // 2. Delete demo_items
      await supabase.from('demo_items').delete().eq('id', demo['id']);

      if (mounted) {
        setState(() {
          _demos.removeWhere((d) => d['id'] == demo['id']);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Demo "${demo['name']}" deleted.')),
        );
      }
    } catch (e) {
      debugPrint('Error deleting demo: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // BUILD METHOD
  // ─────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final catMap = {for (var c in _categories) c['id'] as String: c['name'] as String};
    final unitMap = {for (var u in _units) u['id'] as String: u['symbol'] as String};
    final displayedDemos = _filteredDemos;

    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/demos'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Master Blueprint Catalog', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            Text('${_demos.length} Canonical Templates', style: const TextStyle(fontSize: 11, color: Colors.white70)),
          ],
        ),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
        actions: [
          IconButton(
            icon: Icon(_isGridView ? Icons.view_list_rounded : Icons.grid_view_rounded, color: Colors.white),
            tooltip: _isGridView ? 'Switch to List' : 'Switch to Grid',
            onPressed: () => setState(() => _isGridView = !_isGridView),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            tooltip: 'Refresh',
            onPressed: () {
              setState(() => _loading = true);
              _load();
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        onPressed: () => _openTemplateEditor(),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add Template', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: Column(
        children: [
          // Search & Filter Header Container
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            color: Theme.of(context).cardColor,
            child: Column(
              children: [
                // Search Input Box
                TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: 'Search by template name or code (e.g. ANG-)...',
                    hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
                    prefixIcon: const Icon(Icons.search, size: 20, color: Colors.grey),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    filled: true,
                    fillColor: Colors.grey.withValues(alpha: 0.08),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // ─── 2 Dropdowns: Category & Selling Mode Filters (Admin Only) ───
                Row(
                  children: [
                    // 1. Category Dropdown
                    Expanded(
                      flex: 6,
                      child: DropdownButtonFormField<String>(
                        value: _categories.any((c) => c['id'] == _selectedCategoryFilter) || _selectedCategoryFilter == 'all'
                            ? _selectedCategoryFilter
                            : 'all',
                        isDense: true,
                        isExpanded: true,
                        icon: const Icon(Icons.arrow_drop_down, size: 20),
                        decoration: InputDecoration(
                          labelText: 'Category',
                          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          prefixIcon: const Icon(Icons.category_outlined, size: 17),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          filled: true,
                          fillColor: _selectedCategoryFilter != 'all'
                              ? kWaTeal.withValues(alpha: 0.08)
                              : Colors.grey.withValues(alpha: 0.08),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: _selectedCategoryFilter != 'all'
                                ? BorderSide(color: kWaTeal.withValues(alpha: 0.5), width: 1.5)
                                : BorderSide.none,
                          ),
                        ),
                        items: [
                          DropdownMenuItem<String>(
                            value: 'all',
                            child: Text(
                              'All Categories (${_demos.length})',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          ..._categories.map((c) {
                            final catId = c['id'] as String;
                            final count = _demos.where((d) => d['category_id'] == catId).length;
                            return DropdownMenuItem<String>(
                              value: catId,
                              child: Text(
                                '${c['name']} ($count)',
                                style: const TextStyle(fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedCategoryFilter = val);
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 8),

                    // 2. Selling Mode Dropdown
                    Expanded(
                      flex: 4,
                      child: DropdownButtonFormField<String>(
                        value: _sellModes.contains(_selectedSellModeFilter) || _selectedSellModeFilter == 'all'
                            ? _selectedSellModeFilter
                            : 'all',
                        isDense: true,
                        isExpanded: true,
                        icon: const Icon(Icons.arrow_drop_down, size: 20),
                        decoration: InputDecoration(
                          labelText: 'Selling Mode',
                          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          prefixIcon: const Icon(Icons.tune_rounded, size: 17),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          filled: true,
                          fillColor: _selectedSellModeFilter != 'all'
                              ? kWaTeal.withValues(alpha: 0.08)
                              : Colors.grey.withValues(alpha: 0.08),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: _selectedSellModeFilter != 'all'
                                ? BorderSide(color: kWaTeal.withValues(alpha: 0.5), width: 1.5)
                                : BorderSide.none,
                          ),
                        ),
                        items: [
                          const DropdownMenuItem<String>(
                            value: 'all',
                            child: Text(
                              'All Modes',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          ..._sellModes.map((m) {
                            final icon = m == 'Manual' ? '⚖️' : m == 'Fixed' ? '📦' : m == 'Dynamic' ? '⚡' : '🍰';
                            return DropdownMenuItem<String>(
                              value: m,
                              child: Text(
                                '$icon $m',
                                style: const TextStyle(fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedSellModeFilter = val);
                          }
                        },
                      ),
                    ),

                    // Clear Filters Button (shows when either filter is active)
                    if (_selectedCategoryFilter != 'all' || _selectedSellModeFilter != 'all')
                      Padding(
                        padding: const EdgeInsets.only(left: 4),
                        child: IconButton(
                          icon: const Icon(Icons.filter_alt_off_rounded, size: 20, color: Colors.redAccent),
                          tooltip: 'Reset Filters',
                          onPressed: () {
                            setState(() {
                              _selectedCategoryFilter = 'all';
                              _selectedSellModeFilter = 'all';
                            });
                          },
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Main Content View
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : displayedDemos.isEmpty
                  ? Expanded(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.search_off_rounded, size: 54, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text(
                              _searchQuery.isNotEmpty ? 'No templates matching "$_searchQuery"' : 'No templates found',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Expanded(
                      child: _isGridView
                          ? GridView.builder(
                              padding: const EdgeInsets.fromLTRB(14, 14, 14, 80),
                              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                                maxCrossAxisExtent: 220,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                                childAspectRatio: 0.68,
                              ),
                              itemCount: displayedDemos.length,
                              itemBuilder: (context, i) {
                                final d = displayedDemos[i];
                                return _buildTemplateCard(d, catMap, unitMap);
                              },
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.fromLTRB(12, 12, 12, 80),
                              itemCount: displayedDemos.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (context, i) {
                                final d = displayedDemos[i];
                                return _buildTemplateListTile(d, catMap, unitMap);
                              },
                            ),
                    ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CARDS GRID ITEM WIDGET
  // ─────────────────────────────────────────────────────────────
  Widget _buildTemplateCard(
    Map<String, dynamic> d,
    Map<String, String> catMap,
    Map<String, String> unitMap,
  ) {
    final catName = d['category_id'] != null ? catMap[d['category_id']] ?? 'General' : 'General';
    final unitSymbol = d['unit_id'] != null ? unitMap[d['unit_id']] ?? 'unit' : 'unit';
    final imgUrl = d['default_image'] as String?;
    final mode = d['sell_mode'] as String? ?? 'Fixed';
    final hasImg = imgUrl != null && imgUrl.isNotEmpty;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.15)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Image Cover with Badges
          Expanded(
            flex: 5,
            child: Stack(
              fit: StackFit.expand,
              children: [
                hasImg
                    ? CachedNetworkImage(
                        imageUrl: imgUrl,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(color: Colors.grey.shade200),
                        errorWidget: (_, __, ___) => Container(
                          color: Colors.grey.shade100,
                          child: const Icon(Icons.broken_image, color: Colors.grey),
                        ),
                      )
                    : Container(
                        color: const Color(0xFFF1F5F9),
                        child: Center(
                          child: Icon(Icons.inventory_2_outlined, color: Colors.grey.shade400, size: 40),
                        ),
                      ),

                // Top Bar Badges
                Positioned(
                  top: 6,
                  left: 6,
                  right: 6,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Mode Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: (mode == 'Manual' ? Colors.blue : Colors.green).withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          mode == 'Manual' ? '⚖️ By Weight' : '📦 Packed',
                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800),
                        ),
                      ),

                      // Code Badge
                      if (d['code'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            d['code'],
                            style: const TextStyle(color: Colors.white, fontSize: 8, fontFamily: 'monospace', fontWeight: FontWeight.w700),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Details Body
          Expanded(
            flex: 5,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        d['name'] ?? '—',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, height: 1.2),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        catName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 10.5, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),

                  // Unit & Action Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.grey.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Base: $unitSymbol',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
                        ),
                      ),
                      Row(
                        children: [
                          InkWell(
                            onTap: () => _openTemplateEditor(d),
                            child: Padding(
                              padding: const EdgeInsets.all(4),
                              child: Icon(Icons.edit_outlined, size: 17, color: kWaTeal),
                            ),
                          ),
                          InkWell(
                            onTap: () => _delete(d),
                            child: const Padding(
                              padding: EdgeInsets.all(4),
                              child: Icon(Icons.delete_outline_rounded, size: 17, color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LIST TILE ITEM WIDGET
  // ─────────────────────────────────────────────────────────────
  Widget _buildTemplateListTile(
    Map<String, dynamic> d,
    Map<String, String> catMap,
    Map<String, String> unitMap,
  ) {
    final catName = d['category_id'] != null ? catMap[d['category_id']] ?? 'General' : 'General';
    final unitSymbol = d['unit_id'] != null ? unitMap[d['unit_id']] ?? 'unit' : 'unit';
    final imgUrl = d['default_image'] as String?;
    final mode = d['sell_mode'] as String? ?? 'Fixed';
    final hasImg = imgUrl != null && imgUrl.isNotEmpty;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.15)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(8),
          ),
          clipBehavior: Clip.antiAlias,
          child: hasImg
              ? CachedNetworkImage(
                  imageUrl: imgUrl,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => const Icon(Icons.broken_image, size: 20),
                )
              : const Center(child: Icon(Icons.inventory_2_outlined, size: 24, color: Colors.grey)),
        ),
        title: Text(d['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        subtitle: Row(
          children: [
            Text(catName, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
            const Text(' · ', style: TextStyle(color: Colors.grey)),
            Text(mode, style: TextStyle(fontSize: 11, color: mode == 'Manual' ? Colors.blue : Colors.green, fontWeight: FontWeight.w700)),
            const Text(' · ', style: TextStyle(color: Colors.grey)),
            Text(unitSymbol, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(Icons.edit_outlined, size: 18, color: kWaTeal),
              onPressed: () => _openTemplateEditor(d),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.red),
              onPressed: () => _delete(d),
            ),
          ],
        ),
      ),
    );
  }
}
