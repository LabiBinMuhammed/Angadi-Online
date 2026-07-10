import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';

extension StringExtension on String? {
  bool get notFoundOrEmpty => this == null || this!.trim().isEmpty;
}

class VendorAddEditItemScreen extends StatefulWidget {
  final String? itemId;
  const VendorAddEditItemScreen({super.key, this.itemId});

  @override
  State<VendorAddEditItemScreen> createState() => _VendorAddEditItemScreenState();
}

class _VendorAddEditItemScreenState extends State<VendorAddEditItemScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _manualUnitCtrl = TextEditingController(text: '1kg');
  final _manualPriceCtrl = TextEditingController();
  final _newOptMeasureCtrl = TextEditingController();
  final _newOptPriceCtrl = TextEditingController();

  bool _isActive = true;
  bool _loading = false;
  bool _saving = false;
  String? _shopId;
  String? _categoryId;
  String? _demoItemId;
  String _sellMode = 'Manual'; // Manual, Fixed, Portion, Dynamic
  String? _baseUnitId;
  String _pricePerBaseUnit = '';
  
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _demoItems = [];
  List<Map<String, dynamic>> _units = [];
  List<Map<String, dynamic>> _demoConfigs = [];
  List<Map<String, dynamic>> _demoVariants = [];
  
  List<dynamic> _imageSources = []; // Can contain String (URLs) or XFile (local files)
  List<Map<String, dynamic>> _variants = []; // Map representing variants
  
  int _step = 1;

  bool get _isEdit => widget.itemId != null;

  bool get _isComplete {
    final nameOk = _nameCtrl.text.trim().isNotEmpty;
    final catOk = _categoryId != null;
    final imgOk = _imageSources.isNotEmpty;
    
    if (!nameOk || !catOk || !imgOk) return false;
    
    if (_sellMode == 'Manual') {
      final hasBaseConfig = _baseUnitId != null && 
          _pricePerBaseUnit.trim().isNotEmpty && 
          (double.tryParse(_pricePerBaseUnit) ?? 0) > 0;
      return hasBaseConfig;
    } else if (_sellMode == 'Dynamic' || _sellMode == 'Portion') {
      final hasVars = _variants.isNotEmpty;
      final hasBaseConfig = _baseUnitId != null && 
          _pricePerBaseUnit.trim().isNotEmpty && 
          (double.tryParse(_pricePerBaseUnit) ?? 0) > 0;
      return hasVars && hasBaseConfig;
    } else {
      return _variants.isNotEmpty;
    }
  }

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _manualUnitCtrl.dispose();
    _manualPriceCtrl.dispose();
    _newOptMeasureCtrl.dispose();
    _newOptPriceCtrl.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    setState(() => _loading = true);
    try {
      final uid = supabase.auth.currentUser!.id;

      final ownerRes = await supabase.from('shop_owners').select('shop_id').eq('user_id', uid).maybeSingle();
      _shopId = ownerRes?['shop_id'] as String?;

      // Parallel data fetching matching Next.js
      final results = await Future.wait([
        supabase.from('categories').select('id, name').eq('is_active', true),
        supabase.from('demo_items').select('*'),
        supabase.from('units').select('*'),
        supabase.from('demo_sell_config').select('*'),
        supabase.from('demo_variants').select('*'),
      ]);

      _categories = List<Map<String, dynamic>>.from(results[0] as List);
      _demoItems = List<Map<String, dynamic>>.from(results[1] as List);
      _units = List<Map<String, dynamic>>.from(results[2] as List);
      _demoConfigs = List<Map<String, dynamic>>.from(results[3] as List);
      _demoVariants = List<Map<String, dynamic>>.from(results[4] as List);

      if (_isEdit) {
        _step = 3;
        final item = await supabase.from('items').select('*').eq('id', widget.itemId!).single();
        _nameCtrl.text = item['name'] ?? '';
        _descCtrl.text = item['description'] ?? '';
        _isActive = item['is_active'] as bool? ?? true;
        _categoryId = item['category_id'] as String?;
        _demoItemId = item['demo_item_id'] as String?;

        // Load all images for this item ordered by sort_order
        final imgRes = await supabase
            .from('item_images')
            .select('image_url')
            .eq('item_id', widget.itemId!)
            .order('sort_order', ascending: true);

        if (imgRes != null) {
          _imageSources = (imgRes as List).map((img) => img['image_url'] as String).toList();
        }
        
        // Fetch existing sell config and variants to show in card preview
        final configRes = await supabase
            .from('item_sell_config')
            .select('*')
            .eq('item_id', widget.itemId!)
            .maybeSingle();
        if (configRes != null) {
          _sellMode = configRes['sell_mode'] ?? 'Manual';
          _baseUnitId = configRes['base_unit_id'];
          _pricePerBaseUnit = configRes['price_per_base_unit']?.toString() ?? '';

          if (_sellMode == 'Manual' || _sellMode == 'Dynamic' || _sellMode == 'Portion') {
            final unit = _units.firstWhere((u) => u['id'] == _baseUnitId, orElse: () => {});
            if (unit.isNotEmpty) {
              _manualUnitCtrl.text = '1${unit['symbol']}';
            }
            _manualPriceCtrl.text = _pricePerBaseUnit;
          }
        }

        final varsRes = await supabase
            .from('item_variants')
            .select('*')
            .eq('item_id', widget.itemId!)
            .order('id', ascending: true);
        if (varsRes != null) {
          _variants = (varsRes as List).map((v) => {
            'variant_type': v['variant_type'],
            'label': v['label'] ?? '',
            'unit_id': v['unit_id'],
            'value': v['value']?.toString() ?? '',
            'price': v['price']?.toString() ?? '',
            'min_value': v['min_value'],
            'max_value': v['max_value'],
            'is_default': v['is_default'] ?? false,
            'is_active': v['is_active'] ?? true,
            'image_url': v['image_url'],
            'image_source': v['image_url'],
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('Initialization error: $e');
    }

    if (mounted) setState(() => _loading = false);
  }

  Future<void> _pickImage() async {
    if (_imageSources.length >= 4) return;
    final picker = ImagePicker();
    try {
      final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (image != null) {
        setState(() {
          _imageSources.add(image);
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  Future<void> _pickVariantImage(int index) async {
    final picker = ImagePicker();
    try {
      final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (image != null) {
        setState(() {
          _variants[index]['image_source'] = image;
        });
      }
    } catch (e) {
      debugPrint('Error picking variant image: $e');
    }
  }

  Widget _buildVariantImagePreview(Map<String, dynamic> v) {
    final src = v['image_source'];
    if (src == null) {
      return Icon(Icons.add_a_photo_outlined, size: 16, color: kVendorSubText);
    }
    if (src is String && src.isNotEmpty) {
      return Image.network(src, fit: BoxFit.cover);
    }
    if (src is XFile) {
      return FutureBuilder<Uint8List>(
        future: src.readAsBytes(),
        builder: (context, snapshot) {
          if (snapshot.hasData) {
            return Image.memory(snapshot.data!, fit: BoxFit.cover);
          }
          return const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA), strokeWidth: 2));
        },
      );
    }
    return Icon(Icons.add_a_photo_outlined, size: 16, color: kVendorSubText);
  }

  Future<String?> _uploadImage(XFile image) async {
    try {
      final bytes = await image.readAsBytes();
      final fileExt = image.name.split('.').last;
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_${image.name}';
      final path = _shopId != null ? 'items/$_shopId/$fileName' : 'items/custom/$fileName';

      await supabase.storage.from('item-images').uploadBinary(
        path,
        bytes,
        fileOptions: FileOptions(contentType: 'image/$fileExt'),
      );

      final publicUrl = supabase.storage.from('item-images').getPublicUrl(path);
      return publicUrl;
    } catch (e) {
      debugPrint('Upload error: $e');
      rethrow;
    }
  }

  void _selectDemoItem(Map<String, dynamic> demo) {
    final demoId = demo['id'] as String;
    final config = _demoConfigs.firstWhere((c) => c['demo_item_id'] == demoId, orElse: () => {});
    final vars = _demoVariants.where((v) => v['demo_item_id'] == demoId).toList();

    setState(() {
      _demoItemId = demoId;
      _nameCtrl.text = demo['name'] ?? '';
      _sellMode = demo['sell_mode'] ?? 'Manual';
      
      if (config.isNotEmpty) {
        _baseUnitId = config['base_unit_id'] ?? demo['unit_id'];
        _pricePerBaseUnit = config['price_per_base_unit']?.toString() ?? '';
      } else {
        _baseUnitId = demo['unit_id'];
        _pricePerBaseUnit = '';
      }

      if (_sellMode == 'Manual' || _sellMode == 'Dynamic' || _sellMode == 'Portion') {
        final unit = _units.firstWhere((u) => u['id'] == _baseUnitId, orElse: () => {});
        if (unit.isNotEmpty) {
          _manualUnitCtrl.text = '1${unit['symbol']}';
        } else {
          _manualUnitCtrl.text = '1kg';
        }
        _manualPriceCtrl.text = _pricePerBaseUnit;
      }

      if (vars.isNotEmpty) {
        _variants = vars.map((v) => {
          'variant_type': demo['sell_mode'],
          'label': v['label'] ?? '',
          'unit_id': v['unit_id'] ?? demo['unit_id'],
          'value': v['value']?.toString() ?? '',
          'price': v['price']?.toString() ?? '',
          'min_value': v['min_value'],
          'max_value': v['max_value'],
          'is_default': v['is_default'] ?? false,
          'is_active': v['is_active'] ?? true,
          'image_url': '',
          'image_source': null,
        }).toList();
      } else {
        _variants = [];
      }

      _imageSources.clear();
      if (demo['default_image'] != null) {
        _imageSources.add(demo['default_image'] as String);
      }
      _step = 3;
    });
  }

  void _skipDemo() {
    setState(() {
      _demoItemId = null;
      _step = 3;
    });
  }

  void _addVariant() {
    if (_variants.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 5 variants allowed'), backgroundColor: Color(0xFFEF4444)),
      );
      return;
    }
    setState(() {
      _variants.add({
        'variant_type': _sellMode,
        'label': '',
        'unit_id': _baseUnitId ?? '',
        'value': '',
        'price': '',
        'is_default': _variants.isEmpty,
        'is_active': true,
        'size': '',
        'image_url': '',
        'image_source': null,
      });
    });
  }

  void _removeVariant(int index) {
    setState(() {
      final wasDefault = _variants[index]['is_default'] ?? false;
      _variants.removeAt(index);
      if (_variants.isNotEmpty && wasDefault) {
        _variants[0]['is_default'] = true;
      }
    });
  }

  void _handleBaseUnitChange(String? unitId) {
    setState(() {
      _baseUnitId = unitId;
      if (unitId == null) return;
      
      final unit = _units.firstWhere((u) => u['id'] == unitId, orElse: () => {});
      final symbol = unit['symbol'] ?? '';
      
      if (_sellMode == 'Manual' && (symbol == 'g' || symbol == 'kg')) {
        _variants = [
          { 'label': '250g', 'value': '250', 'price': '', 'is_default': false, 'is_active': true, 'variant_type': 'Manual', 'unit_id': unitId, 'image_url': '', 'image_source': null },
          { 'label': '500g', 'value': '500', 'price': '', 'is_default': true,  'is_active': true, 'variant_type': 'Manual', 'unit_id': unitId, 'image_url': '', 'image_source': null },
          { 'label': '1kg',  'value': '1000', 'price': '', 'is_default': false, 'is_active': true, 'variant_type': 'Manual', 'unit_id': unitId, 'image_url': '', 'image_source': null }
        ];
        _recalculatePrices();
      } else if (_sellMode == 'Dynamic') {
        _variants = _variants.map((v) {
          final size = v['size'] ?? 'Size';
          final weight = double.tryParse(v['value']?.toString() ?? '') ?? 0.0;
          v['label'] = '$size (est. ${weight.toStringAsFixed(weight.truncateToDouble() == weight ? 0 : 1)}$symbol)';
          return v;
        }).toList();
      } else {
        _variants = [];
      }
    });
  }

  void _recalculatePrices() {
    final basePrice = double.tryParse(_pricePerBaseUnit) ?? 0.0;
    if (basePrice <= 0) return;
    
    setState(() {
      _variants = _variants.map((v) {
        if (_sellMode == 'Manual') {
          if (v['label'] == '250g') v['price'] = (basePrice * 0.25).toStringAsFixed(2);
          if (v['label'] == '500g') v['price'] = (basePrice * 0.50).toStringAsFixed(2);
          if (v['label'] == '1kg') v['price'] = basePrice.toStringAsFixed(2);
        } else if (_sellMode == 'Dynamic' || _sellMode == 'Portion') {
          final val = double.tryParse(v['value']?.toString() ?? '') ?? 0.0;
          if (val > 0) {
            v['price'] = (val * basePrice).toStringAsFixed(2);
          }
        }
        return v;
      }).toList();
    });
  }

  void _handleDynamicVariantChange(int index, String field, String val) {
    setState(() {
      final v = _variants[index];
      v[field] = val;
      
      final weight = double.tryParse(field == 'value' ? val : (v['value']?.toString() ?? '')) ?? 0.0;
      final basePrice = double.tryParse(_pricePerBaseUnit) ?? 0.0;
      
      if (weight > 0 && basePrice > 0) {
        v['price'] = (weight * basePrice).toStringAsFixed(2);
      } else {
        v['price'] = '';
      }
      
      final size = v['size'] ?? 'Size';
      final unit = _units.firstWhere((u) => u['id'] == _baseUnitId, orElse: () => {});
      final symbol = unit['symbol'] ?? '';
      
      v['label'] = '$size (est. ${weight.toStringAsFixed(weight.truncateToDouble() == weight ? 0 : 1)}$symbol)';
    });
  }

  Map<String, dynamic>? parseManualUnitAndPrice(String unitText, String priceText, List<Map<String, dynamic>> unitsList) {
    final cleanUnit = unitText.trim();
    final cleanPrice = double.tryParse(priceText.trim()) ?? 0.0;
    if (cleanPrice <= 0) return null;

    final regExp = RegExp(r'^\s*([\d.]+)?\s*([a-zA-Z&]+)\s*$');
    final match = regExp.firstMatch(cleanUnit);
    if (match == null) return null;

    final valStr = match.group(1);
    final double value = valStr != null ? (double.tryParse(valStr) ?? 1.0) : 1.0;
    final symbol = match.group(2)!.toLowerCase();

    String targetSymbol = symbol;
    if (symbol == 'piece') targetSymbol = 'pcs';

    final matchedUnit = unitsList.firstWhere(
      (u) => (u['symbol'] as String).toLowerCase() == targetSymbol,
      orElse: () => {},
    );
    if (matchedUnit.isEmpty) return null;

    final pricePerBaseUnit = value > 0 ? cleanPrice / value : 0.0;

    return {
      'base_unit_id': matchedUnit['id'],
      'price_per_base_unit': pricePerBaseUnit,
      'value': value,
      'symbol': matchedUnit['symbol']
    };
  }

  void _updateManualPricing() {
    final parsed = parseManualUnitAndPrice(_manualUnitCtrl.text, _manualPriceCtrl.text, _units);
    if (parsed != null) {
      _baseUnitId = parsed['base_unit_id'] as String?;
      _pricePerBaseUnit = parsed['price_per_base_unit'].toString();
      _recalculatePrices();
    } else {
      _baseUnitId = null;
      _pricePerBaseUnit = '';
    }
  }

  void _handleAddFixedOption() {
    final measure = _newOptMeasureCtrl.text.trim();
    final priceStr = _newOptPriceCtrl.text.trim();

    if (measure.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter measure of pack (e.g. 250g)'), backgroundColor: Color(0xFFEF4444)),
      );
      return;
    }
    final price = double.tryParse(priceStr) ?? 0.0;
    if (price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid price'), backgroundColor: Color(0xFFEF4444)),
      );
      return;
    }

    final parsed = parseManualUnitAndPrice(measure, priceStr, _units);
    final String? unitId = parsed?['base_unit_id'] as String?;
    final String val = parsed?['value']?.toString() ?? '1.0';

    setState(() {
      _variants.add({
        'variant_type': 'Fixed',
        'label': measure,
        'unit_id': unitId,
        'value': val,
        'price': price.toString(),
        'is_default': _variants.isEmpty,
        'is_active': true,
        'image_url': '',
        'image_source': null,
      });
      _newOptMeasureCtrl.clear();
      _newOptPriceCtrl.clear();
    });
  }

  Future<void> _save({required String intendedStatus}) async {
    if (_shopId == null) return;
    setState(() => _saving = true);

    try {
      // 1. Upload any newly picked images
      final List<String> finalUrls = [];
      for (final src in _imageSources) {
        if (src is String) {
          finalUrls.add(src);
        } else if (src is XFile) {
          final url = await _uploadImage(src);
          if (url != null) {
            finalUrls.add(url);
          }
        }
      }

      // Upload variant images
      for (final v in _variants) {
        final src = v['image_source'];
        if (src is XFile) {
          final url = await _uploadImage(src);
          if (url != null) {
            v['image_url'] = url;
          }
        }
      }

      final isActive = intendedStatus == 'published';

      if (_isEdit) {
        // Direct update for edit mode
        final payload = {
          'name': _nameCtrl.text.trim(),
          'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
          'category_id': _categoryId,
          'is_active': isActive,
          'image_url': finalUrls.isNotEmpty ? finalUrls[0] : null,
        };

        await supabase.from('items').update(payload).eq('id', widget.itemId!);

        // Sync images
        await supabase.from('item_images').delete().eq('item_id', widget.itemId!);
        if (finalUrls.isNotEmpty) {
          final List<Map<String, dynamic>> imgPayloads = [];
          for (int i = 0; i < finalUrls.length; i++) {
            imgPayloads.add({
              'item_id': widget.itemId!,
              'image_url': finalUrls[i],
              'is_primary': i == 0,
              'sort_order': i,
            });
          }
          await supabase.from('item_images').insert(imgPayloads);
        }

        // 3. Upsert item_sell_config
        final double basePrice = double.tryParse(_pricePerBaseUnit) ?? 0.0;
        final sellConfigPayload = {
          'item_id': widget.itemId!,
          'sell_mode': _sellMode,
          'base_unit_id': _baseUnitId,
          'price_per_base_unit': basePrice,
          'allow_custom_quantity': true,
          'max_price_increase_percent': 15,
          'max_price_limit': 0,
        };
        await supabase.from('item_sell_config').upsert(sellConfigPayload);

        // 4. Sync item_variants
        await supabase.from('item_variants').delete().eq('item_id', widget.itemId!);
        if (_variants.isNotEmpty) {
          final List<Map<String, dynamic>> varPayloads = _variants.map((v) {
            final double val = double.tryParse(v['value']?.toString() ?? '') ?? 1.0;
            final double price = double.tryParse(v['price']?.toString() ?? '') ?? 0.0;
            return {
              'item_id': widget.itemId!,
              'variant_type': v['variant_type'] ?? _sellMode,
              'label': v['label'] ?? '',
              'unit_id': v['unit_id'],
              'value': val,
              'price': price,
              'is_default': v['is_default'] ?? false,
              'is_active': v['is_active'] ?? true,
              'min_value': v['min_value'],
              'max_value': v['max_value'],
              'image_url': (v['image_url'] as String?).notFoundOrEmpty ? null : v['image_url'],
            };
          }).toList();
          await supabase.from('item_variants').insert(varPayloads);
        }
      } else {
        // Create transactional insert for new items via RPC
        final config = _demoConfigs.firstWhere((c) => c['demo_item_id'] == _demoItemId, orElse: () => {});
        final allowCustomQty = config['allow_custom_quantity'] ?? true;
        final maxPriceIncrease = config['max_price_increase_percent'] ?? 15;
        final maxPriceLimit = config['max_price_limit'] ?? 0;

        final double basePrice = double.tryParse(_pricePerBaseUnit) ?? 0.0;

        final rpcPayload = {
          'shop_id': _shopId,
          'category_id': _categoryId,
          'demo_item_id': _demoItemId,
          'name': _nameCtrl.text.trim(),
          'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
          'status': intendedStatus,
          'is_active': isActive,
          'has_variants': _variants.isNotEmpty,
          'images': List.generate(finalUrls.length, (idx) => {
            'image_url': finalUrls[idx],
            'is_primary': idx == 0,
            'sort_order': idx,
          }),
          'sell_config': {
            'sell_mode': _sellMode,
            'base_unit_id': _baseUnitId,
            'price_per_base_unit': basePrice,
            'allow_custom_quantity': allowCustomQty,
            'max_price_increase_percent': maxPriceIncrease,
            'max_price_limit': maxPriceLimit,
          },
          'variants': _variants.map((v) {
            final double val = double.tryParse(v['value']?.toString() ?? '') ?? 1.0;
            final double price = double.tryParse(v['price']?.toString() ?? '') ?? 0.0;
            return {
              'variant_type': v['variant_type'],
              'label': v['label'] ?? '',
              'unit_id': v['unit_id'],
              'value': val,
              'price': price,
              'is_default': v['is_default'] ?? false,
              'is_active': v['is_active'] ?? true,
              'min_value': v['min_value'],
              'max_value': v['max_value'],
              'image_url': (v['image_url'] as String?).notFoundOrEmpty ? null : v['image_url'],
            };
          }).toList(),
        };

        final res = await supabase.rpc('create_shop_item_transaction', params: {
          'payload': rpcPayload,
        });

        final itemId = res is Map ? res['item_id'] as String? : null;
        if (itemId != null && finalUrls.isNotEmpty) {
          await supabase.from('items').update({
            'image_url': finalUrls[0],
          }).eq('id', itemId);
        }
      }

      if (mounted) {
        setState(() => _saving = false);
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: const Color(0xFFEF4444)),
        );
      }
    }
  }

  Widget _buildStepIndicator() {
    if (_isEdit) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Row(
        children: List.generate(4, (index) {
          final s = index + 1;
          final active = _step >= s;
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(
                left: index == 0 ? 0 : 4,
                right: index == 3 ? 0 : 4,
              ),
              height: 4,
              decoration: BoxDecoration(
                color: active ? const Color(0xFF3B82F6) : kVendorText.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '1. Choose a Category',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kVendorText),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.2,
          ),
          itemCount: _categories.length,
          itemBuilder: (context, index) {
            final cat = _categories[index];
            return InkWell(
              onTap: () {
                setState(() {
                  _categoryId = cat['id'] as String;
                  _step = 2;
                });
              },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: kVendorTransparentBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: kVendorTransparentBorder),
                ),
                alignment: Alignment.centerLeft,
                child: Text(
                  cat['name'] as String,
                  style: TextStyle(fontWeight: FontWeight.w600, color: kVendorText, fontSize: 13),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildStep2() {
    final filteredDemos = _demoItems.where((d) => d['category_id'] == _categoryId).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '2. Select Base Item',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kVendorText),
            ),
            VendorOutlineButton(
              height: 36,
              onPressed: () => setState(() => _step = 1),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.arrow_back, size: 14),
                  SizedBox(width: 4),
                  Text('Back', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (filteredDemos.isNotEmpty)
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.8,
            ),
            itemCount: filteredDemos.length,
            itemBuilder: (context, index) {
              final demo = filteredDemos[index];
              return InkWell(
                onTap: () => _selectDemoItem(demo),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0x1A3B82F6), // blue 10%
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0x4D3B82F6)), // blue 30%
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        demo['name'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF60A5FA), fontSize: 13),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Mode: ${demo['sell_mode'] ?? 'Manual'}',
                        style: TextStyle(fontSize: 10, color: kVendorSubText),
                      ),
                    ],
                  ),
                ),
              );
            },
          )
        else
          Text(
            'No templates found for this category.',
            style: TextStyle(color: kVendorSubText, fontSize: 14),
          ),
        const SizedBox(height: 24),
        Divider(color: kVendorDivider),
        const SizedBox(height: 16),
        VendorOutlineButton(
          width: double.infinity,
          onPressed: _skipDemo,
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Create Custom Item Instead', style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(width: 8),
              Icon(Icons.arrow_forward, size: 16),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMultiImagePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Product Images (up to 4)',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: kVendorSubText),
            ),
            Text(
              'First is primary',
              style: TextStyle(fontSize: 11, color: kVendorSubText),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: (_imageSources.length < 4) ? _imageSources.length + 1 : 4,
            itemBuilder: (context, index) {
              if (index == _imageSources.length) {
                // Add Image button
                return GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    width: 100,
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      color: kVendorTransparentBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: kVendorTransparentBorder,
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_photo_alternate_outlined, color: kVendorSubText.withValues(alpha: 0.8), size: 24),
                        const SizedBox(height: 4),
                        Text(
                          'Add Image',
                          style: TextStyle(color: kVendorSubText, fontSize: 10, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                );
              }

              final source = _imageSources[index];
              final isPrimary = index == 0;

              return Container(
                width: 100,
                margin: const EdgeInsets.only(right: 12),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: source is XFile
                          ? FutureBuilder<Uint8List>(
                              future: source.readAsBytes(),
                              builder: (context, snapshot) {
                                if (snapshot.hasData) {
                                  return Image.memory(snapshot.data!, fit: BoxFit.cover);
                                }
                                return const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA), strokeWidth: 2));
                              },
                            )
                          : Image.network(source as String, fit: BoxFit.cover),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [Colors.black.withValues(alpha: 0.6), Colors.transparent],
                        ),
                      ),
                    ),
                    if (isPrimary)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF3B82F6),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'PRIMARY',
                            style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    Positioned(
                      top: 6,
                      right: 6,
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _imageSources.removeAt(index);
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.6),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close_rounded, color: Colors.white, size: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSellModeSelection() {
    final sellModesList = [
      {'value': 'Manual', 'label': 'By Weight', 'desc': 'e.g. 250g, 500g, 1kg'},
      {'value': 'Fixed', 'label': 'Pre-Packed', 'desc': 'Fixed size & price'},
      {'value': 'Portion', 'label': 'By Piece', 'desc': 'Sold per item'},
      {'value': 'Dynamic', 'label': 'Dynamic Price', 'desc': 'Estimated price range'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Sell Mode',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: kVendorSubText),
        ),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.8,
          ),
          itemCount: sellModesList.length,
          itemBuilder: (context, index) {
            final mode = sellModesList[index];
            final isSelected = _sellMode == mode['value'];
            return InkWell(
              onTap: () {
                setState(() {
                  _sellMode = mode['value']!;
                  _variants = [];
                  _baseUnitId = null;
                  _pricePerBaseUnit = '';
                });
              },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0x1F3B82F6) : kVendorTransparentBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF3B82F6) : kVendorTransparentBorder,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      mode['label']!,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isSelected ? const Color(0xFF60A5FA) : kVendorText,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      mode['desc']!,
                      style: TextStyle(fontSize: 10, color: kVendorSubText),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildHealthValidation() {
    final imageUploaded = _imageSources.isNotEmpty;
    final nameSet = _nameCtrl.text.trim().isNotEmpty;
    final hasPriceOrVariants = _variants.isNotEmpty || 
        (_baseUnitId != null && _pricePerBaseUnit.trim().isNotEmpty && (double.tryParse(_pricePerBaseUnit) ?? 0) > 0);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kVendorTransparentBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kVendorTransparentBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Health Validation',
            style: TextStyle(fontWeight: FontWeight.bold, color: kVendorText, fontSize: 14),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                imageUploaded ? Icons.check_circle_outline : Icons.cancel_outlined,
                color: imageUploaded ? const Color(0xFF34D399) : const Color(0xFFFCA5A5),
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                'Image uploaded',
                style: TextStyle(
                  color: imageUploaded ? const Color(0xFF34D399) : const Color(0xFFFCA5A5),
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                nameSet ? Icons.check_circle_outline : Icons.cancel_outlined,
                color: nameSet ? const Color(0xFF34D399) : const Color(0xFFFCA5A5),
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                'Name set',
                style: TextStyle(
                  color: nameSet ? const Color(0xFF34D399) : const Color(0xFFFCA5A5),
                  fontSize: 13,
                ),
              ),
            ],
          ),
          if (_sellMode != 'Fixed') ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  hasPriceOrVariants ? Icons.check_circle_outline : Icons.cancel_outlined,
                  color: hasPriceOrVariants ? const Color(0xFF34D399) : const Color(0xFFFCA5A5),
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Base price or variants configured',
                    style: TextStyle(
                      color: hasPriceOrVariants ? const Color(0xFF34D399) : const Color(0xFFFCA5A5),
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStep3Actions() {
    final showDirectPublish = _sellMode == 'Manual';
    
    return Row(
      children: [
        Expanded(
          child: VendorOutlineButton(
            onPressed: () => context.pop(),
            child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: VendorGradientButton(
            loading: _saving,
            onPressed: () {
              if (_nameCtrl.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Display Name is required'), backgroundColor: Color(0xFFEF4444)),
                );
                return;
              }
              if (_sellMode == 'Manual' || _sellMode == 'Dynamic' || _sellMode == 'Portion') {
                final parsed = parseManualUnitAndPrice(_manualUnitCtrl.text, _manualPriceCtrl.text, _units);
                if (parsed == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a valid unit (e.g. 101g, 1kg) and a valid price'), backgroundColor: Color(0xFFEF4444)),
                  );
                  return;
                }
              }
              if (showDirectPublish) {
                _save(intendedStatus: 'published');
              } else {
                setState(() => _step = 4);
              }
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _isEdit 
                      ? 'Update Item' 
                      : (showDirectPublish ? 'Publish Item' : 'Next: Variants & Pricing'),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                if (!showDirectPublish) ...[
                  const SizedBox(width: 8),
                  const Icon(Icons.arrow_forward, size: 16),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep3() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: vendorCardDecoration(radius: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _isEdit ? 'Edit Item Details' : '3. Item Details',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: kVendorText, letterSpacing: -0.5),
              ),
              if (!_isEdit)
                VendorOutlineButton(
                  height: 36,
                  onPressed: () => setState(() => _step = 2),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.arrow_back, size: 14),
                      SizedBox(width: 4),
                      Text('Back', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),

          _buildMultiImagePicker(),
          const SizedBox(height: 20),

          TextFormField(
            controller: _nameCtrl,
            style: TextStyle(color: kVendorText),
            textInputAction: TextInputAction.next,
            onChanged: (val) {
              setState(() {});
            },
            decoration: vendorInputDecoration(
              labelText: 'Display Name *',
              hintText: 'e.g. Fresh Organic Tomatoes',
            ),
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _descCtrl,
            maxLines: 3,
            style: TextStyle(color: kVendorText),
            textInputAction: TextInputAction.newline,
            decoration: vendorInputDecoration(
              labelText: 'Description',
              hintText: 'Describe product benefits, source...',
            ),
          ),
          const SizedBox(height: 20),

          if (_sellMode == 'Manual' || _sellMode == 'Dynamic' || _sellMode == 'Portion') ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kVendorTransparentBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: kVendorTransparentBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Pricing & Unit',
                    style: TextStyle(fontWeight: FontWeight.bold, color: kVendorText, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _manualUnitCtrl,
                          style: TextStyle(color: kVendorText),
                          onChanged: (val) => setState(() => _updateManualPricing()),
                          decoration: vendorInputDecoration(
                            labelText: 'Unit/Measure (e.g. 101g, 1kg)',
                            hintText: 'e.g. 101g',
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _manualPriceCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: TextStyle(color: kVendorText),
                          onChanged: (val) => setState(() => _updateManualPricing()),
                          decoration: vendorInputDecoration(
                            labelText: 'Price (₹) *',
                            hintText: '0.00',
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_manualUnitCtrl.text.isNotEmpty && _manualPriceCtrl.text.isNotEmpty && parseManualUnitAndPrice(_manualUnitCtrl.text, _manualPriceCtrl.text, _units) != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'This means ₹${double.tryParse(_manualPriceCtrl.text)?.toStringAsFixed(2)} per ${_manualUnitCtrl.text}.',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF34D399), fontWeight: FontWeight.bold),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          if (_demoItemId == null && !_isEdit) ...[
            _buildSellModeSelection(),
            const SizedBox(height: 20),
          ],

          _buildHealthValidation(),
          const SizedBox(height: 24),

          _buildStep3Actions(),
        ],
      ),
    );
  }

  Widget _buildLiveCustomerPreview() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Live Customer Preview'.toUpperCase(),
            style: TextStyle(color: kVendorSubText, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: const Color(0xFF334155),
                  borderRadius: BorderRadius.circular(8),
                ),
                clipBehavior: Clip.antiAlias,
                child: _imageSources.isNotEmpty
                    ? (_imageSources[0] is XFile
                        ? FutureBuilder<Uint8List>(
                            future: (_imageSources[0] as XFile).readAsBytes(),
                            builder: (context, snapshot) {
                              if (snapshot.hasData) {
                                return Image.memory(snapshot.data!, fit: BoxFit.cover);
                              }
                              return const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA), strokeWidth: 2));
                            },
                          )
                        : Image.network(_imageSources[0] as String, fit: BoxFit.cover))
                    : Icon(Icons.shopping_bag_outlined, color: kVendorSubText),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _nameCtrl.text.isNotEmpty ? _nameCtrl.text : 'Item Name',
                      style: TextStyle(fontWeight: FontWeight.bold, color: kVendorText, fontSize: 15),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ..._variants.map((v) {
                            final isDefault = v['is_default'] ?? false;
                            final priceText = v['price'] != null && v['price'].toString().isNotEmpty
                                ? ' · ₹${v['price']}'
                                : '';
                            return Container(
                              margin: const EdgeInsets.only(right: 6),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: isDefault ? const Color(0xFF3B82F6) : kVendorTransparentBg,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                '${v['label']}$priceText',
                                style: TextStyle(color: isDefault ? Colors.white : kVendorText, fontSize: 11),
                              ),
                            );
                          }),
                          if (_variants.isEmpty && _sellMode == 'Manual' && _pricePerBaseUnit.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: kVendorTransparentBg,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                '₹$_pricePerBaseUnit',
                                style: TextStyle(color: kVendorText, fontSize: 11),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStep4() {
    final isFixed = _sellMode == 'Fixed';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: vendorCardDecoration(radius: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '4. Pricing & Variants',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: kVendorText, letterSpacing: -0.5),
                  ),
                  VendorOutlineButton(
                    height: 36,
                    onPressed: () => setState(() => _step = 3),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.arrow_back, size: 14, color: Colors.white),
                        SizedBox(width: 4),
                        Text('Back', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: kVendorTransparentBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: kVendorTransparentBg),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          isFixed ? 'Pre-Packed Options / Variants' : 'Demo Options',
                          style: TextStyle(fontWeight: FontWeight.bold, color: kVendorText, fontSize: 14),
                        ),
                        if (isFixed)
                          Text(
                            '${_variants.length} / 5 Max',
                            style: TextStyle(
                              fontSize: 11,
                              color: _variants.length >= 5 ? Color(0xFFF87171) : kVendorSubText,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (_variants.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        child: Center(
                          child: Text(
                            'No options configured yet.',
                            style: TextStyle(color: kVendorSubText, fontSize: 13),
                          ),
                        ),
                      )
                    else
                      ...List.generate(_variants.length, (index) {
                        final v = _variants[index];
                        final isDefault = v['is_default'] ?? false;

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: kVendorTransparentBg,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: kVendorTransparentBorder),
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: _buildVariantImagePreview(v),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          v['label'] ?? '',
                                          style: TextStyle(fontWeight: FontWeight.bold, color: kVendorText, fontSize: 14),
                                        ),
                                        if (isDefault) ...[
                                          const SizedBox(width: 6),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF3B82F6).withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(4),
                                              border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
                                            ),
                                            child: const Text(
                                              'DEFAULT',
                                              style: TextStyle(color: Color(0xFF60A5FA), fontSize: 8, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      v['price'] != null && v['price'].toString().isNotEmpty
                                          ? '₹${v['price']}'
                                          : 'Pricing dynamic',
                                      style: const TextStyle(color: Color(0xFF34D399), fontSize: 13, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                              if (isFixed || _sellMode == 'Dynamic' || _sellMode == 'Portion') ...[
                                if (!isDefault)
                                  VendorOutlineButton(
                                    height: 30,
                                    onPressed: () {
                                      setState(() {
                                        for (int i = 0; i < _variants.length; i++) {
                                          _variants[i]['is_default'] = (i == index);
                                        }
                                      });
                                    },
                                    child: const Text('Set Default', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                  ),
                                const SizedBox(width: 8),
                                IconButton(
                                  onPressed: () => _removeVariant(index),
                                  icon: const Icon(Icons.delete_outline, color: Color(0xFFEF4444)),
                                  constraints: const BoxConstraints(),
                                  padding: EdgeInsets.zero,
                                ),
                              ],
                            ],
                          ),
                        );
                      }),
                    if (isFixed && _variants.length < 5) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: kVendorDialogBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: kVendorTransparentBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Add New Option',
                              style: TextStyle(fontWeight: FontWeight.bold, color: kVendorText, fontSize: 13),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _newOptMeasureCtrl,
                                    style: TextStyle(color: kVendorText),
                                    decoration: vendorInputDecoration(
                                      labelText: 'Measure (e.g. 250g)',
                                      hintText: 'e.g. 250g',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextFormField(
                                    controller: _newOptPriceCtrl,
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    style: TextStyle(color: kVendorText),
                                    decoration: vendorInputDecoration(
                                      labelText: 'Price (₹)',
                                      hintText: '0.00',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                VendorGradientButton(
                                  height: 48,
                                  onPressed: _handleAddFixedOption,
                                  child: const Text('Add', style: TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),

              _buildLiveCustomerPreview(),
            ],
          ),
        ),
        const SizedBox(height: 20),

        Row(
          children: [
            Expanded(
              child: VendorOutlineButton(
                loading: _saving,
                onPressed: () => _save(intendedStatus: 'draft'),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.save_outlined, size: 16),
                    SizedBox(width: 6),
                    Text('Save Draft', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: VendorGradientButton(
                loading: _saving,
                onPressed: _isComplete ? () => _save(intendedStatus: 'published') : null,
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.publish_outlined, size: 16),
                    SizedBox(width: 6),
                    Text('Publish Item', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kVendorBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: Text(
          _isEdit ? 'Edit Product' : 'Add Product',
          style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5),
        ),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: kVendorText, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)))
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                children: [
                  _buildStepIndicator(),
                  if (_step == 1 && !_isEdit)
                    _buildStep1()
                  else if (_step == 2 && !_isEdit)
                    _buildStep2()
                  else if (_step == 3)
                    _buildStep3()
                  else if (_step == 4)
                    _buildStep4(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }
}
