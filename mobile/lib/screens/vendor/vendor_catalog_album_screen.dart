import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/supabase_client.dart';
import '../../core/image_utils.dart';
import '../../theme/theme_service.dart';
import 'vendor_single_image_uploader.dart';
import 'vendor_theme_helper.dart';

class VendorCatalogAlbumScreen extends StatefulWidget {
  final String categoryId;
  const VendorCatalogAlbumScreen({super.key, required this.categoryId});

  @override
  State<VendorCatalogAlbumScreen> createState() => _VendorCatalogAlbumScreenState();
}

class _VendorCatalogAlbumScreenState extends State<VendorCatalogAlbumScreen> {
  bool _loading = true;
  String? _shopId;
  Map<String, dynamic>? _category;
  List<Map<String, dynamic>> _demoItems = [];
  List<Map<String, dynamic>> _demoConfigs = [];
  List<Map<String, dynamic>> _demoVariants = [];
  List<Map<String, dynamic>> _units = [];
  Map<String, Map<String, dynamic>> _shopItemsMap = {}; // demo_item_id -> shop item

  int _currentIndex = 0;
  bool _isSaving = false;
  bool _isSavedJustNow = false;
  bool _isCompleted = false;
  int _skippedCount = 0;

  // Form controllers & state
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _descCtrl = TextEditingController();
  final TextEditingController _basePriceCtrl = TextEditingController();
  final List<TextEditingController> _variantPriceCtrls = [];
  final List<TextEditingController> _variantLabelCtrls = [];
  final List<Map<String, dynamic>> _currentVariants = [];

  String _customImageUrl = '';
  String? _selectedUnitId;
  int _confidence = 5; // 1 to 5 stars
  bool _isNotAvailable = false;
  bool _isDirty = false;

  final Map<int, String> _starLabels = {
    1: 'Rarely available',
    2: 'Sometimes available',
    3: 'Usually available',
    4: 'Almost always available',
    5: 'Always available',
  };

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _basePriceCtrl.dispose();
    for (final c in _variantPriceCtrls) {
      c.dispose();
    }
    for (final c in _variantLabelCtrls) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final user = supabase.auth.currentUser;
      if (user == null) {
        if (mounted) context.go('/auth/login');
        return;
      }

      // Shop
      final ownersRes = await supabase
          .from('shop_owners')
          .select('shop_id')
          .eq('user_id', user.id);

      if ((ownersRes as List).isEmpty) {
        if (mounted) setState(() => _loading = false);
        return;
      }
      _shopId = ownersRes.first['shop_id'] as String;

      // Category
      final catRes = await supabase
          .from('categories')
          .select('*')
          .eq('id', widget.categoryId)
          .single();
      _category = catRes;

      // Demo items
      final demoRes = await supabase
          .from('demo_items')
          .select('*')
          .eq('category_id', widget.categoryId)
          .order('display_order', ascending: true);
      _demoItems = (demoRes as List).cast<Map<String, dynamic>>();

      final demoIds = _demoItems.map((d) => d['id'] as String).toList();

      // Demo configs & variants
      if (demoIds.isNotEmpty) {
        final cfgRes = await supabase
            .from('demo_sell_config')
            .select('*')
            .inFilter('demo_item_id', demoIds);
        _demoConfigs = (cfgRes as List).cast<Map<String, dynamic>>();

        final varRes = await supabase
            .from('demo_variants')
            .select('*')
            .inFilter('demo_item_id', demoIds)
            .order('display_order', ascending: true);
        _demoVariants = (varRes as List).cast<Map<String, dynamic>>();
      }

      // Units
      final unitsRes = await supabase.from('units').select('*');
      _units = (unitsRes as List).cast<Map<String, dynamic>>();

      // Existing shop items for this category
      final shopItemsRes = await supabase
          .from('items')
          .select('*, item_sell_config(*), item_variants(*)')
          .eq('shop_id', _shopId!)
          .eq('category_id', widget.categoryId)
          .isFilter('deleted_at', null);

      _shopItemsMap = {};
      for (final item in (shopItemsRes as List)) {
        final dId = item['demo_item_id'] as String?;
        if (dId != null) {
          _shopItemsMap[dId] = item as Map<String, dynamic>;
        }
      }

      if (_demoItems.isNotEmpty) {
        _initProductForm(0);
      }

      if (mounted) {
        setState(() => _loading = false);
      }
    } catch (e, stack) {
      debugPrint('Error loading album data: $e\n$stack');
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  void _initProductForm(int index) {
    if (index < 0 || index >= _demoItems.length) return;
    final demo = _demoItems[index];
    final demoId = demo['id'] as String;
    final existing = _shopItemsMap[demoId];

    final cfg = _demoConfigs.firstWhere(
      (c) => c['demo_item_id'] == demoId,
      orElse: () => {},
    );
    final vars = _demoVariants.where((v) => v['demo_item_id'] == demoId).toList();

    // Name
    _nameCtrl.text = existing?['name'] ?? demo['name'] ?? '';
    _descCtrl.text = existing?['description'] ?? '';

    // Image
    final existingImg = existing?['image_url'] as String?;
    final defaultImg = demo['default_image'] as String?;
    if (existingImg != null && existingImg != defaultImg && existingImg.isNotEmpty) {
      _customImageUrl = existingImg;
    } else {
      _customImageUrl = '';
    }

    // Availability
    final conf = existing?['availability_confidence'] as int? ?? 5;
    _confidence = conf.clamp(1, 5);
    final isActive = existing?['is_active'] as bool? ?? true;
    final status = existing?['status'] as String? ?? 'published';
    _isNotAvailable = existing != null && (!isActive || status == 'hidden');

    // Variants and Prices
    for (final c in _variantPriceCtrls) {
      c.dispose();
    }
    _variantPriceCtrls.clear();
    for (final c in _variantLabelCtrls) {
      c.dispose();
    }
    _variantLabelCtrls.clear();
    _currentVariants.clear();

    final isWeightBased = (demo['sell_mode'] as String?)?.toLowerCase() == 'manual';
    final isDynamic = (demo['sell_mode'] as String?)?.toLowerCase() == 'dynamic';

    if (!isWeightBased) {
      final existingVars = existing?['item_variants'] as List?;
      if (existingVars != null && existingVars.isNotEmpty) {
        for (final ev in existingVars) {
          final pCtrl = TextEditingController(text: ev['price']?.toString() ?? '0');
          final lCtrl = TextEditingController(text: ev['label']?.toString() ?? 'Pack');
          _variantPriceCtrls.add(pCtrl);
          _variantLabelCtrls.add(lCtrl);
          _currentVariants.add(Map<String, dynamic>.from(ev));
        }
      } else if (vars.isNotEmpty) {
        for (final v in vars) {
          final pCtrl = TextEditingController(text: v['price']?.toString() ?? '0');
          final lCtrl = TextEditingController(text: v['label']?.toString() ?? 'Pack');
          _variantPriceCtrls.add(pCtrl);
          _variantLabelCtrls.add(lCtrl);
          _currentVariants.add(Map<String, dynamic>.from(v));
        }
      } else if (isDynamic) {
        final defDyn = [
          {'label': 'Quarter', 'value': 0.25, 'is_default': false},
          {'label': 'Half', 'value': 0.5, 'is_default': false},
          {'label': 'Small', 'value': 1.0, 'is_default': true},
          {'label': 'Large', 'value': 2.0, 'is_default': false},
        ];
        for (final d in defDyn) {
          final pCtrl = TextEditingController(text: '0');
          final lCtrl = TextEditingController(text: d['label'] as String);
          _variantPriceCtrls.add(pCtrl);
          _variantLabelCtrls.add(lCtrl);
          _currentVariants.add({
            'label': d['label'],
            'price': 0,
            'variant_type': 'Dynamic',
            'unit_id': demo['unit_id'],
            'value': d['value'],
            'is_default': d['is_default'],
            'is_active': true,
          });
        }
      }
    }

    // Base Price
    final existingCfg = existing?['item_sell_config'];
    Map<String, dynamic>? sc;
    if (existingCfg is List && existingCfg.isNotEmpty) {
      sc = existingCfg.first as Map<String, dynamic>;
    } else if (existingCfg is Map<String, dynamic>) {
      sc = existingCfg;
    }

    if (sc != null && sc['price_per_base_unit'] != null) {
      _basePriceCtrl.text = sc['price_per_base_unit'].toString();
    } else if (cfg.isNotEmpty && cfg['price_per_base_unit'] != null) {
      _basePriceCtrl.text = cfg['price_per_base_unit'].toString();
    } else if (vars.isNotEmpty && vars.first['price'] != null) {
      _basePriceCtrl.text = vars.first['price'].toString();
    } else if (_currentVariants.length == 1) {
      _basePriceCtrl.text = _currentVariants.first['price']?.toString() ?? '';
    } else {
      _basePriceCtrl.text = '';
    }

    // Base Unit
    final existingUnitId = sc?['base_unit_id'] as String? ?? existing?['unit_id'] as String?;
    final defaultUnitId = existingUnitId ?? (demo['unit_id'] as String?);
    if (defaultUnitId != null && _units.any((u) => u['id'] == defaultUnitId)) {
      _selectedUnitId = defaultUnitId;
    } else {
      final kgUnit = _units.firstWhere(
        (u) => (u['symbol'] as String?)?.toLowerCase() == 'kg',
        orElse: () => _units.isNotEmpty ? _units.first : {},
      );
      _selectedUnitId = kgUnit['id'] as String?;
    }

    _isDirty = false;
  }

  void _removeVariant(int index) {
    if (index < 0 || index >= _currentVariants.length) return;
    setState(() {
      _variantPriceCtrls[index].dispose();
      _variantPriceCtrls.removeAt(index);
      _variantLabelCtrls[index].dispose();
      _variantLabelCtrls.removeAt(index);
      _currentVariants.removeAt(index);
      _isDirty = true;
    });
  }

  void _addVariant({String? label, double? price}) {
    final demo = _demoItems[_currentIndex];
    final defaultLabel = label ?? (_currentVariants.isEmpty ? 'Regular' : 'Pack ${_currentVariants.length + 1}');
    final defaultPrice = price ?? 0.0;
    setState(() {
      final pCtrl = TextEditingController(text: defaultPrice > 0 ? defaultPrice.toString() : '');
      final lCtrl = TextEditingController(text: defaultLabel);
      _variantPriceCtrls.add(pCtrl);
      _variantLabelCtrls.add(lCtrl);
      _currentVariants.add({
        'label': defaultLabel,
        'price': defaultPrice,
        'variant_type': demo['sell_mode'] ?? 'Fixed',
        'unit_id': _selectedUnitId ?? demo['unit_id'],
        'value': 1,
        'is_default': _currentVariants.isEmpty,
        'is_active': true,
      });
      _isDirty = true;
    });
  }

  Future<bool> _promptUnsavedChanges() async {
    if (!_isDirty) return true;
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kVendorDialogBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const HugeIcon(icon: HugeIcons.strokeRoundedAlertCircle, color: Color(0xFFF59E0B), size: 22),
            const SizedBox(width: 8),
            Text('Unsaved Changes', style: TextStyle(color: kVendorText, fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'Are you sure you want to leave without saving your edits?',
          style: TextStyle(color: kVendorSubText, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Discard', style: TextStyle(color: Color(0xFFF87171), fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Stay', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Future<void> _handlePrevious() async {
    if (_currentIndex <= 0) return;
    final ok = await _promptUnsavedChanges();
    if (!ok) return;

    setState(() {
      _currentIndex--;
      _initProductForm(_currentIndex);
    });
  }

  Future<void> _handleNext() async {
    final ok = await _promptUnsavedChanges();
    if (!ok) return;

    if (_currentIndex < _demoItems.length - 1) {
      setState(() {
        _currentIndex++;
        _initProductForm(_currentIndex);
      });
    } else {
      setState(() => _isCompleted = true);
    }
  }

  Future<void> _handleSkip() async {
    final ok = await _promptUnsavedChanges();
    if (!ok) return;

    _skippedCount++;
    if (_currentIndex < _demoItems.length - 1) {
      setState(() {
        _currentIndex++;
        _initProductForm(_currentIndex);
      });
    } else {
      setState(() => _isCompleted = true);
    }
  }

  Future<void> _handleSaveAndNext() async {
    final currentDemo = _demoItems[_currentIndex];
    final demoId = currentDemo['id'] as String;
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Product name cannot be empty'), backgroundColor: Colors.redAccent),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      final existing = _shopItemsMap[demoId];
      final isPublished = !_isNotAvailable;
      final statusVal = isPublished ? 'published' : 'hidden';
      final defaultImg = currentDemo['default_image'] as String?;
      final targetImg = _customImageUrl.isNotEmpty ? _customImageUrl : defaultImg;
      final firstVariantPrice = _variantPriceCtrls.isNotEmpty
          ? (double.tryParse(_variantPriceCtrls.first.text.trim()) ?? 0.0)
          : 0.0;
      final parsedBasePrice = double.tryParse(_basePriceCtrl.text.trim()) ?? 0.0;
      final basePriceNum = parsedBasePrice > 0 ? parsedBasePrice : firstVariantPrice;
      final effectiveUnitId = _selectedUnitId ?? currentDemo['unit_id'];

      String? savedItemId = existing?['id'] as String?;

      if (existing != null) {
        // Update existing shop item
        final updateData = <String, dynamic>{
          'name': name,
          'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
          'image_url': targetImg,
          'is_active': isPublished,
          'status': statusVal,
          'availability_confidence': _confidence,
          'updated_at': DateTime.now().toIso8601String(),
        };

        try {
          await supabase.from('items').update(updateData).eq('id', existing['id']);
        } catch (e) {
          // If availability_confidence column not yet in DB, retry without it
          updateData.remove('availability_confidence');
          await supabase.from('items').update(updateData).eq('id', existing['id']);
        }

        // Upsert sell config with conflict resolution on item_id
        final existingCfg = existing['item_sell_config'];
        Map<String, dynamic>? sc;
        if (existingCfg is List && existingCfg.isNotEmpty) {
          sc = existingCfg.first as Map<String, dynamic>;
        } else if (existingCfg is Map<String, dynamic>) {
          sc = existingCfg;
        }

        final sellCfg = {
          if (sc != null && sc['id'] != null) 'id': sc['id'],
          'item_id': existing['id'],
          'sell_mode': currentDemo['sell_mode'] ?? 'Manual',
          'base_unit_id': effectiveUnitId,
          'price_per_base_unit': basePriceNum,
          'allow_custom_quantity': true,
          'max_price_increase_percent': 15,
          'max_price_limit': 0,
        };
        await supabase.from('item_sell_config').upsert(sellCfg, onConflict: 'item_id');

        // Update variants if applicable
        if (_currentVariants.isNotEmpty) {
          await supabase.from('item_variants').delete().eq('item_id', existing['id']);
          final varPayload = [];
          for (int i = 0; i < _currentVariants.length; i++) {
            final v = _currentVariants[i];
            final priceVal = double.tryParse(_variantPriceCtrls[i].text.trim()) ?? 0.0;
            final labelVal = _variantLabelCtrls[i].text.trim().isNotEmpty
                ? _variantLabelCtrls[i].text.trim()
                : (v['label']?.toString() ?? 'Pack');
            varPayload.add({
              'item_id': existing['id'],
              'variant_type': currentDemo['sell_mode'] ?? 'Manual',
              'label': labelVal,
              'price': priceVal,
              'value': v['value'] ?? 1,
              'unit_id': v['unit_id'] ?? effectiveUnitId,
              'is_default': i == 0,
              'is_active': isPublished,
            });
          }
          await supabase.from('item_variants').insert(varPayload);
        } else if ((currentDemo['sell_mode'] as String?)?.toLowerCase() == 'manual') {
          // For weight-based items, ensure only one default base variant exists
          await supabase.from('item_variants').delete().eq('item_id', existing['id']);
          await supabase.from('item_variants').insert([
            {
              'item_id': existing['id'],
              'variant_type': 'Manual',
              'label': 'Default',
              'price': basePriceNum,
              'value': 1,
              'unit_id': effectiveUnitId,
              'is_default': true,
              'is_active': isPublished,
            }
          ]);
        } else {
          // Non-manual item but all variants removed: clear old variants
          await supabase.from('item_variants').delete().eq('item_id', existing['id']);
        }
      } else {
        // Create new shop item via RPC
        final rpcPayload = <String, dynamic>{
          'shop_id': _shopId,
          'category_id': widget.categoryId,
          'demo_item_id': demoId,
          'name': name,
          'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
          'status': statusVal,
          'is_active': isPublished,
          'availability_confidence': _confidence,
          'has_variants': _currentVariants.isNotEmpty,
          'image_url': targetImg,
          'images': targetImg != null
              ? [{'image_url': targetImg, 'is_primary': true, 'sort_order': 0}]
              : [],
          'sell_config': {
            'sell_mode': currentDemo['sell_mode'] ?? 'Manual',
            'base_unit_id': effectiveUnitId,
            'price_per_base_unit': basePriceNum,
            'allow_custom_quantity': true,
            'max_price_increase_percent': 15,
            'max_price_limit': 0,
          },
          'variants': _currentVariants.isNotEmpty
              ? [
                  for (int i = 0; i < _currentVariants.length; i++)
                    {
                      'variant_type': currentDemo['sell_mode'] ?? 'Manual',
                      'label': _variantLabelCtrls[i].text.trim().isNotEmpty
                          ? _variantLabelCtrls[i].text.trim()
                          : (_currentVariants[i]['label']?.toString() ?? 'Pack'),
                      'unit_id': _currentVariants[i]['unit_id'] ?? effectiveUnitId,
                      'value': _currentVariants[i]['value'] ?? 1,
                      'price': double.tryParse(_variantPriceCtrls[i].text.trim()) ?? 0.0,
                      'is_default': i == 0,
                      'is_active': isPublished,
                    }
                ]
              : currentDemo['sell_mode'] == 'Manual'
                  ? [
                      {
                        'variant_type': 'Manual',
                        'label': 'Default',
                        'unit_id': effectiveUnitId,
                        'value': 1,
                        'price': basePriceNum,
                        'is_default': true,
                        'is_active': isPublished,
                      }
                    ]
                  : [],
        };

        try {
          final res = await supabase.rpc('create_shop_item_transaction', params: {'payload': rpcPayload});
          savedItemId = res['item_id'] as String?;
        } catch (rpcErr) {
          // If confidence column is unrecognized in RPC, retry without it
          rpcPayload.remove('availability_confidence');
          final retryRes = await supabase.rpc('create_shop_item_transaction', params: {'payload': rpcPayload});
          savedItemId = retryRes['item_id'] as String?;
        }
      }

      // Update map
      if (savedItemId != null) {
        _shopItemsMap[demoId] = {
          'id': savedItemId,
          'name': name,
          'shop_id': _shopId,
          'category_id': widget.categoryId,
          'demo_item_id': demoId,
          'is_active': isPublished,
          'status': statusVal,
          'image_url': targetImg,
          'availability_confidence': _confidence,
          'item_sell_config': [
            {
              'base_unit_id': effectiveUnitId,
              'price_per_base_unit': basePriceNum,
            }
          ],
          'item_variants': [
            for (int i = 0; i < _currentVariants.length; i++)
              {
                'id': _currentVariants[i]['id'],
                'variant_type': currentDemo['sell_mode'] ?? 'Manual',
                'label': _variantLabelCtrls[i].text.trim().isNotEmpty
                    ? _variantLabelCtrls[i].text.trim()
                    : (_currentVariants[i]['label']?.toString() ?? 'Pack'),
                'unit_id': _currentVariants[i]['unit_id'] ?? effectiveUnitId,
                'value': _currentVariants[i]['value'] ?? 1,
                'price': double.tryParse(_variantPriceCtrls[i].text.trim()) ?? 0.0,
                'is_default': i == 0,
                'is_active': isPublished,
              }
          ],
        };
      }

      setState(() {
        _isSavedJustNow = true;
        _isDirty = false;
      });

      await Future.delayed(const Duration(milliseconds: 600));

      if (mounted) {
        setState(() => _isSavedJustNow = false);
        if (_currentIndex < _demoItems.length - 1) {
          setState(() {
            _currentIndex++;
            _initProductForm(_currentIndex);
          });
        } else {
          setState(() => _isCompleted = true);
        }
      }
    } catch (e, stack) {
      debugPrint('Save product error: $e\n$stack');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save product: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _showImagePickerSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: kVendorDialogBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Product Image', style: TextStyle(color: kVendorText, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            VendorSingleImageUploader(
              label: 'Product Image',
              initialUrl: _customImageUrl.isNotEmpty ? _customImageUrl : null,
              onUrlChanged: (url) {
                setState(() {
                  _customImageUrl = url;
                  _isDirty = true;
                });
                Navigator.of(context).pop();
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ThemeService.instance,
      builder: (context, _) {
        if (_loading) {
          return Scaffold(
            backgroundColor: kVendorBg,
            appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        final catName = _category?['name'] as String? ?? 'Category';

    if (_demoItems.isEmpty) {
      return Scaffold(
        backgroundColor: kVendorBg,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: kVendorText, size: 20),
            onPressed: () => context.pop(),
          ),
          title: Text(catName, style: TextStyle(color: kVendorText, fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        body: Center(
          child: Text('No catalog products found in this category', style: TextStyle(color: kVendorSubText)),
        ),
      );
    }

    // Completion View
    if (_isCompleted) {
      final totalAdded = _shopItemsMap.length;
      return Scaffold(
        backgroundColor: kVendorBg,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0, automaticallyImplyLeading: false),
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: kVendorCardBg,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.3)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: HugeIcon(icon: HugeIcons.strokeRoundedCheckmarkCircle01, color: Color(0xFF22C55E), size: 36),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '✓ $catName completed',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kVendorText, fontSize: 22, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'All available templates in this category have been traversed.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kVendorSubText, fontSize: 14),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Column(
                        children: [
                          Text('$totalAdded', style: const TextStyle(color: Color(0xFF22C55E), fontSize: 24, fontWeight: FontWeight.w900)),
                          Text('Added', style: TextStyle(color: kVendorSubText, fontSize: 12)),
                        ],
                      ),
                      Container(width: 1, height: 36, color: kVendorDivider),
                      Column(
                        children: [
                          Text('$_skippedCount', style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 24, fontWeight: FontWeight.w900)),
                          Text('Skipped', style: TextStyle(color: kVendorSubText, fontSize: 12)),
                        ],
                      ),
                      Container(width: 1, height: 36, color: kVendorDivider),
                      Column(
                        children: [
                          Text('${_demoItems.length}', style: TextStyle(color: kVendorText, fontSize: 24, fontWeight: FontWeight.w900)),
                          Text('Total', style: TextStyle(color: kVendorSubText, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () => context.pop(),
                    icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 18),
                    label: const Text('Back to Categories', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final currentDemo = _demoItems[_currentIndex];
    final demoId = currentDemo['id'] as String;
    final existing = _shopItemsMap[demoId];
    final isAdded = existing != null;
    final isUnavailable = existing != null && (existing['is_active'] == false || existing['status'] == 'hidden');

    final activeImg = _customImageUrl.isNotEmpty
        ? _customImageUrl
        : (currentDemo['default_image'] as String? ?? '');

    final progressVal = (_currentIndex + 1) / _demoItems.length;

    return PopScope(
      canPop: !_isDirty,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final ok = await _promptUnsavedChanges();
        if (ok && context.mounted) {
          context.pop();
        }
      },
      child: Scaffold(
        backgroundColor: kVendorBg,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          toolbarHeight: 46,
          leading: IconButton(
            icon: HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: kVendorText, size: 20),
            onPressed: () async {
              final ok = await _promptUnsavedChanges();
              if (ok && context.mounted) context.pop();
            },
          ),
          title: Text(
            catName,
            style: TextStyle(color: kVendorText, fontSize: 16, fontWeight: FontWeight.bold),
            overflow: TextOverflow.ellipsis,
          ),
          actions: [
            // Status Badge
            Padding(
              padding: const EdgeInsets.only(right: 6.0),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: isAdded
                        ? (isUnavailable ? const Color(0xFFF59E0B).withValues(alpha: 0.15) : const Color(0xFF22C55E).withValues(alpha: 0.15))
                        : Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isAdded ? (isUnavailable ? '— Not available' : '✓ Added') : '○ Not added',
                    style: TextStyle(
                      color: isAdded ? (isUnavailable ? const Color(0xFFF59E0B) : const Color(0xFF22C55E)) : kVendorSubText,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
            // Counter
            Padding(
              padding: const EdgeInsets.only(right: 12.0),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: kVendorInputBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${_currentIndex + 1} / ${_demoItems.length}',
                    style: TextStyle(color: kVendorText, fontSize: 12, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(3),
            child: LinearProgressIndicator(
              value: progressVal,
              minHeight: 3,
              backgroundColor: Colors.white.withValues(alpha: 0.06),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF3B82F6)),
            ),
          ),
        ),
        bottomNavigationBar: SafeArea(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: kVendorBg,
              border: Border(top: BorderSide(color: kVendorDivider.withValues(alpha: 0.5), width: 1)),
            ),
            child: Row(
              children: [
                // Previous
                Expanded(
                  flex: 2,
                  child: SizedBox(
                    height: 42,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        side: BorderSide(color: kVendorCardBorder),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _currentIndex > 0 ? _handlePrevious : null,
                      icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 15),
                      label: const Text('Previous', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Skip
                Expanded(
                  flex: 2,
                  child: SizedBox(
                    height: 42,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        side: BorderSide(color: kVendorCardBorder),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _handleSkip,
                      child: Text('Skip →', style: TextStyle(color: kVendorSubText, fontSize: 12)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Save & Next (Primary CTA)
                Expanded(
                  flex: 3,
                  child: SizedBox(
                    height: 42,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isSavedJustNow ? const Color(0xFF22C55E) : const Color(0xFF3B82F6),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 1,
                      ),
                      onPressed: _isSaving ? null : _handleSaveAndNext,
                      child: _isSaving
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : _isSavedJustNow
                              ? const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.check, color: Colors.white, size: 15),
                                    SizedBox(width: 4),
                                    Text('Saved!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                  ],
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      _currentIndex < _demoItems.length - 1 ? 'Save & Next' : 'Save & Finish',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                    const SizedBox(width: 4),
                                    const HugeIcon(icon: HugeIcons.strokeRoundedArrowRight01, color: Colors.white, size: 14),
                                  ],
                                ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        body: GestureDetector(
          // Swipe gestures scoped to horizontal drag
          onHorizontalDragEnd: (details) {
            final velocity = details.primaryVelocity ?? 0;
            if (velocity < -300) {
              _handleNext();
            } else if (velocity > 300) {
              _handlePrevious();
            }
          },
          child: LayoutBuilder(
            builder: (context, constraints) {
              final availH = constraints.maxHeight;
              final keyboardOpen = MediaQuery.of(context).viewInsets.bottom > 0;
              // Responsive image height: ~24% of available height, clamped 105px - 150px
              final imgHeight = (availH * 0.24).clamp(105.0, 150.0);

              return SingleChildScrollView(
                physics: keyboardOpen ? const BouncingScrollPhysics() : const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: availH - 8,
                    maxHeight: keyboardOpen ? double.infinity : availH - 8,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. Product Image Container (Responsive, compact with floating upload overlay)
                      Container(
                        height: imgHeight,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: kVendorCardBorder),
                        ),
                        child: Stack(
                          children: [
                            Positioned.fill(
                              child: activeImg.isNotEmpty
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(15),
                                      child: Image.network(
                                        resolveImageUrl(activeImg),
                                        fit: BoxFit.contain,
                                        errorBuilder: (_, __, ___) => Center(
                                          child: HugeIcon(icon: HugeIcons.strokeRoundedPackage, color: kVendorSubText, size: 40),
                                        ),
                                      ),
                                    )
                                  : Center(
                                      child: HugeIcon(icon: HugeIcons.strokeRoundedPackage, color: kVendorSubText, size: 40),
                                    ),
                            ),
                            // Floating Image Change / Upload Badge
                            Positioned(
                              bottom: 6,
                              right: 6,
                              child: InkWell(
                                onTap: () => _showImagePickerSheet(context),
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.65),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 12),
                                      const SizedBox(width: 4),
                                      Text(
                                        _customImageUrl.isNotEmpty ? 'Change' : 'Upload',
                                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                      if (_customImageUrl.isNotEmpty) ...[
                                        const SizedBox(width: 6),
                                        InkWell(
                                          onTap: () {
                                            setState(() {
                                              _customImageUrl = '';
                                              _isDirty = true;
                                            });
                                          },
                                          child: const Icon(Icons.close, color: Color(0xFFF87171), size: 12),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // 2. Combined Product Name + Description Card
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: kVendorCardBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: kVendorCardBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Product Name *', style: TextStyle(color: kVendorSubText, fontSize: 11, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 3),
                            SizedBox(
                              height: 38,
                              child: TextField(
                                controller: _nameCtrl,
                                onChanged: (_) => _isDirty = true,
                                style: TextStyle(color: kVendorText, fontSize: 13, fontWeight: FontWeight.w600),
                                decoration: vendorInputDecoration(hintText: 'Product name...').copyWith(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text('Description (Optional)', style: TextStyle(color: kVendorSubText, fontSize: 10, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 3),
                            SizedBox(
                              height: 32,
                              child: TextField(
                                controller: _descCtrl,
                                onChanged: (_) => _isDirty = true,
                                style: TextStyle(color: kVendorText, fontSize: 12),
                                decoration: vendorInputDecoration(hintText: 'Fresh crisp quality...').copyWith(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // 3. Price / Variants Card
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: kVendorCardBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: kVendorCardBorder),
                        ),
                        child: (currentDemo['sell_mode'] as String?)?.toLowerCase() == 'manual'
                            ? Row(
                                children: [
                                  Text('Price', style: TextStyle(color: kVendorSubText, fontSize: 12, fontWeight: FontWeight.bold)),
                                  const SizedBox(width: 10),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: kVendorInputBg,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text('₹', style: TextStyle(color: kVendorText, fontSize: 13, fontWeight: FontWeight.bold)),
                                  ),
                                  const SizedBox(width: 8),
                                  SizedBox(
                                    width: 85,
                                    height: 34,
                                    child: TextField(
                                      controller: _basePriceCtrl,
                                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                      onChanged: (_) => _isDirty = true,
                                      style: TextStyle(color: kVendorText, fontSize: 13, fontWeight: FontWeight.bold),
                                      decoration: vendorInputDecoration(hintText: '0').copyWith(
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text('/', style: TextStyle(color: kVendorSubText, fontSize: 13, fontWeight: FontWeight.bold)),
                                  const SizedBox(width: 6),
                                  Container(
                                    height: 34,
                                    padding: const EdgeInsets.symmetric(horizontal: 6),
                                    decoration: BoxDecoration(
                                      color: kVendorInputBg,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: kVendorCardBorder),
                                    ),
                                    child: DropdownButtonHideUnderline(
                                      child: DropdownButton<String>(
                                        value: _selectedUnitId != null && _units.any((u) => u['id'] == _selectedUnitId)
                                            ? _selectedUnitId
                                            : (_units.isNotEmpty ? _units.first['id'] as String : null),
                                        dropdownColor: kVendorCardBg,
                                        isDense: true,
                                        icon: Icon(Icons.arrow_drop_down, color: kVendorSubText, size: 18),
                                        style: TextStyle(color: kVendorText, fontSize: 12, fontWeight: FontWeight.bold),
                                        onChanged: (newUnitId) {
                                          if (newUnitId != null && newUnitId != _selectedUnitId) {
                                            setState(() {
                                              _selectedUnitId = newUnitId;
                                              _isDirty = true;
                                            });
                                          }
                                        },
                                        items: _units.map((u) {
                                          final uId = u['id'] as String;
                                          final uSym = u['symbol'] as String? ?? u['name'] as String? ?? uId;
                                          return DropdownMenuItem<String>(
                                            value: uId,
                                            child: Text(uSym, style: TextStyle(color: kVendorText, fontSize: 12, fontWeight: FontWeight.bold)),
                                          );
                                        }).toList(),
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Text('Price Variants', style: TextStyle(color: kVendorSubText, fontSize: 11, fontWeight: FontWeight.bold)),
                                          if (_currentVariants.isNotEmpty) ...[
                                            const SizedBox(width: 6),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                '${_currentVariants.length}',
                                                style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 10, fontWeight: FontWeight.bold),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                      InkWell(
                                        onTap: () => _addVariant(),
                                        borderRadius: BorderRadius.circular(6),
                                        child: const Padding(
                                          padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.add_circle_outline, size: 14, color: Color(0xFF3B82F6)),
                                              SizedBox(width: 4),
                                              Text(
                                                'Add Variant',
                                                style: TextStyle(color: Color(0xFF60A5FA), fontSize: 11, fontWeight: FontWeight.bold),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  if (_currentVariants.isEmpty)
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                                      decoration: BoxDecoration(
                                        color: kVendorInputBg.withValues(alpha: 0.5),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: kVendorCardBorder),
                                      ),
                                      child: Column(
                                        children: [
                                          Text(
                                            'No variants added yet.',
                                            style: TextStyle(color: kVendorSubText, fontSize: 12),
                                          ),
                                          const SizedBox(height: 6),
                                          ElevatedButton.icon(
                                            onPressed: () => _addVariant(),
                                            icon: const Icon(Icons.add, size: 14),
                                            label: const Text('Add First Variant', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFF3B82F6),
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  else
                                    ...List.generate(_currentVariants.length, (idx) {
                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 6.0),
                                        child: Row(
                                          children: [
                                            // Editable Variant Name
                                            Expanded(
                                              flex: 3,
                                              child: SizedBox(
                                                height: 34,
                                                child: TextField(
                                                  controller: _variantLabelCtrls[idx],
                                                  onChanged: (val) {
                                                    _currentVariants[idx]['label'] = val;
                                                    _isDirty = true;
                                                  },
                                                  style: TextStyle(color: kVendorText, fontSize: 12, fontWeight: FontWeight.w600),
                                                  decoration: vendorInputDecoration(hintText: 'e.g. 500g, 1L, Small...').copyWith(
                                                    contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            // Currency Badge
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
                                              decoration: BoxDecoration(
                                                color: kVendorInputBg,
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text('₹', style: TextStyle(color: kVendorText, fontSize: 12, fontWeight: FontWeight.bold)),
                                            ),
                                            const SizedBox(width: 6),
                                            // Price Field
                                            Expanded(
                                              flex: 2,
                                              child: SizedBox(
                                                height: 34,
                                                child: TextField(
                                                  controller: _variantPriceCtrls[idx],
                                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                                  onChanged: (_) => _isDirty = true,
                                                  style: TextStyle(color: kVendorText, fontSize: 12, fontWeight: FontWeight.bold),
                                                  decoration: vendorInputDecoration(hintText: '0').copyWith(
                                                    contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            // Remove Variant Button
                                            Tooltip(
                                              message: 'Remove variant',
                                              child: InkWell(
                                                onTap: () => _removeVariant(idx),
                                                borderRadius: BorderRadius.circular(6),
                                                child: const Padding(
                                                  padding: EdgeInsets.all(5),
                                                  child: Icon(Icons.delete_outline, color: Color(0xFFF87171), size: 18),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    }),
                                ],
                              ),
                      ),

                      // 4. Availability Stars & Not Available (Combined Compact Card)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: kVendorCardBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: kVendorCardBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'How often do you usually have this?',
                              style: TextStyle(color: kVendorSubText, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            // Stars row with confidence label
                            Row(
                              children: [
                                Opacity(
                                  opacity: _isNotAvailable ? 0.4 : 1.0,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: List.generate(5, (starIdx) {
                                      final starNum = starIdx + 1;
                                      final isFilled = starNum <= _confidence;
                                      return InkWell(
                                        onTap: () {
                                          setState(() {
                                            _confidence = starNum;
                                            _isDirty = true;
                                          });
                                        },
                                        borderRadius: BorderRadius.circular(6),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 2.0, vertical: 2.0),
                                          child: Icon(
                                            isFilled ? Icons.star : Icons.star_border,
                                            color: isFilled ? const Color(0xFFFBBF24) : Colors.white.withValues(alpha: 0.3),
                                            size: 24,
                                          ),
                                        ),
                                      );
                                    }),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _starLabels[_confidence] ?? '',
                                    style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 11, fontWeight: FontWeight.bold),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Divider(color: kVendorDivider, height: 1),
                            const SizedBox(height: 4),
                            // Not Available toggle
                            InkWell(
                              onTap: () {
                                setState(() {
                                  _isNotAvailable = !_isNotAvailable;
                                  _isDirty = true;
                                });
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 2.0),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 18,
                                      height: 18,
                                      decoration: BoxDecoration(
                                        color: _isNotAvailable ? const Color(0xFFF59E0B) : Colors.transparent,
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(
                                          color: _isNotAvailable ? const Color(0xFFF59E0B) : Colors.white.withValues(alpha: 0.35),
                                          width: 1.5,
                                        ),
                                      ),
                                      child: _isNotAvailable ? const Icon(Icons.check, size: 12, color: Colors.black) : null,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Not available',
                                      style: TextStyle(
                                        color: _isNotAvailable ? const Color(0xFFF59E0B) : kVendorText,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    if (_isNotAvailable) ...[
                                      const SizedBox(width: 6),
                                      Text(
                                        '(Hidden from customers)',
                                        style: TextStyle(color: const Color(0xFFFDE68A).withValues(alpha: 0.8), fontSize: 10),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  },
);
}
}
