import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';
import 'vendor_drawer.dart';
import 'vendor_single_image_uploader.dart';

class VendorShopsScreen extends StatefulWidget {
  const VendorShopsScreen({super.key});

  @override
  State<VendorShopsScreen> createState() => _VendorShopsScreenState();
}

class _VendorShopsScreenState extends State<VendorShopsScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _shops = [];
  List<Map<String, dynamic>> _locations = [];

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _logoController = TextEditingController();
  final _bannerController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _openingTimeController = TextEditingController();
  final _closingTimeController = TextEditingController();
  String? _selectedType;
  String? _selectedLocationId;
  bool _saving = false;

  final List<String> _shopTypes = [
    'grocery',
    'dairy',
    'meat',
    'bakery',
    'fruit',
    'spice',
    'oil',
    'general',
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _logoController.dispose();
    _bannerController.dispose();
    _descriptionController.dispose();
    _openingTimeController.dispose();
    _closingTimeController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => _loading = true);
    try {
      final uid = supabase.auth.currentUser!.id;

      // 1. Fetch locations
      final locsRes = await supabase.from('locations').select('id, name').order('name');
      _locations = List<Map<String, dynamic>>.from(locsRes as List);

      // 2. Fetch owned shops
      final ownersRes = await supabase.from('shop_owners').select('shop_id').eq('user_id', uid);
      final shopIds = List<String>.from((ownersRes as List).map((r) => r['shop_id'] as String));

      if (shopIds.isNotEmpty) {
        final shopsRes = await supabase
            .from('shops')
            .select('*, locations(id, name)')
            .inFilter('id', shopIds)
            .order('created_at', ascending: false);
        _shops = List<Map<String, dynamic>>.from(shopsRes as List);
      } else {
        _shops = [];
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createShop() async {
    final l10n = AppLocalizations.of(context)!;
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    try {
      final uid = supabase.auth.currentUser!.id;
      final res = await http.post(
        Uri.parse('http://localhost:3000/api/vendor/shop'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': uid,
          'name': _nameController.text.trim(),
          'type': _selectedType,
          'locationId': _selectedLocationId,
          'logoUrl': _logoController.text.trim().isEmpty ? null : _logoController.text.trim(),
          'bannerUrl': _bannerController.text.trim().isEmpty ? null : _bannerController.text.trim(),
          'description': _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
          'openingTime': _openingTimeController.text.trim().isEmpty ? null : _openingTimeController.text.trim(),
          'closingTime': _closingTimeController.text.trim().isEmpty ? null : _closingTimeController.text.trim(),
        }),
      );

      final data = jsonDecode(res.body);
      if (res.statusCode != 200 || data['success'] != true) {
        throw Exception(data['error'] ?? 'Failed to create shop');
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.shopCreatedSuccess), backgroundColor: Colors.green),
        );
        _nameController.clear();
        _logoController.clear();
        _bannerController.clear();
        _descriptionController.clear();
        _openingTimeController.clear();
        _closingTimeController.clear();
        setState(() {
          _selectedType = null;
          _selectedLocationId = null;
        });
        _fetchData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.shopCreatedFailed(e.toString())), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length > 2 ? 2 : name.length).toUpperCase();
  }

  Future<void> _selectTime(TextEditingController controller) async {
    TimeOfDay initial = TimeOfDay.now();
    if (controller.text.isNotEmpty) {
      try {
        final parts = controller.text.trim().split(' ');
        final timeParts = parts[0].split(':');
        int hour = int.parse(timeParts[0]);
        int minute = int.parse(timeParts[1]);
        if (parts.length > 1 && parts[1].toUpperCase() == 'PM' && hour < 12) {
          hour += 12;
        } else if (parts.length > 1 && parts[1].toUpperCase() == 'AM' && hour == 12) {
          hour = 0;
        }
        initial = TimeOfDay(hour: hour, minute: minute);
      } catch (_) {}
    }

    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: initial,
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF60A5FA),
              onPrimary: Colors.black,
              surface: Color(0xFF18181B),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final hour = picked.hourOfPeriod == 0 ? 12 : picked.hourOfPeriod;
      final minute = picked.minute.toString().padLeft(2, '0');
      final period = picked.period == DayPeriod.am ? 'AM' : 'PM';
      final formattedHour = hour.toString().padLeft(2, '0');
      setState(() {
        controller.text = '$formattedHour:$minute $period';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: kVendorBg,
      drawer: const VendorDrawer(currentRoute: '/vendor/shop'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: Text(l10n.vendorShopsTitle, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: kVendorText, size: 20),
                onPressed: () => context.pop(),
              )
            : Builder(
                builder: (context) => IconButton(
                  icon: const HugeIcon(icon: HugeIcons.strokeRoundedMenu01, size: 20),
                  onPressed: () => Scaffold.of(context).openDrawer(),
                ),
              ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Page Header
                  Row(
                    children: [
                      const HugeIcon(icon: HugeIcons.strokeRoundedStore01, size: 32, color: Color(0xFF60A5FA)),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.shopProfileSection,
                            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: kVendorText, letterSpacing: -0.5),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _shops.isNotEmpty ? l10n.manageShopSettingsSubtitle : l10n.setupShopSubtitle,
                            style: TextStyle(fontSize: 14, color: kVendorSubText),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Shops List
                  if (_shops.isNotEmpty) ...[
                    Text(
                      l10n.yourShopsTitle,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kVendorText),
                    ),
                    const SizedBox(height: 16),
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _shops.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 16),
                      itemBuilder: (context, idx) {
                        final s = _shops[idx];
                        final name = s['name'] as String? ?? 'Your Shop';
                        final typeStr = s['type'] as String? ?? '';
                        final locName = (s['locations'] as Map?)?['name'] as String?;
                        final isActive = !typeStr.endsWith('_inactive');
                        final initialsStr = _initials(name);

                        return InkWell(
                          borderRadius: BorderRadius.circular(24),
                          onTap: () => context.push('/vendor/shop/${s['id']}').then((_) => _fetchData()),
                          child: Ink(
                            padding: const EdgeInsets.all(20),
                            decoration: vendorCardDecoration(radius: 24),
                            child: Row(
                              children: [
                                Container(
                                  width: 64,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF6366F1).withOpacity(0.4),
                                        blurRadius: 16,
                                        offset: const Offset(0, 6),
                                      ),
                                    ],
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    initialsStr,
                                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 24, color: kVendorText),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        name,
                                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: kVendorText),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          VendorBadge(
                                            label: typeStr.replaceAll('_inactive', ''),
                                            type: VendorBadgeType.info,
                                          ),
                                          if (locName != null) ...[
                                            const SizedBox(width: 8),
                                            Text('•', style: TextStyle(color: kVendorSubText)),
                                            const SizedBox(width: 8),
                                            const HugeIcon(icon: HugeIcons.strokeRoundedLocation01, size: 14, color: Color(0xFF94A3B8)),
                                            const SizedBox(width: 4),
                                            Text(
                                              locName,
                                              style: TextStyle(fontSize: 13, color: kVendorSubText, fontWeight: FontWeight.w500),
                                            ),
                                          ]
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                VendorBadge(
                                  label: isActive ? 'Active' : 'Inactive',
                                  type: isActive ? VendorBadgeType.success : VendorBadgeType.danger,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 32),
                  ],

                  // Create Shop Form
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: vendorCardDecoration(radius: 24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Create a New Shop',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kVendorText),
                          ),
                          const SizedBox(height: 20),

                          // Name
                          Text('Shop Name *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText)),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _nameController,
                            style: TextStyle(color: kVendorText, fontSize: 15, fontWeight: FontWeight.w500),
                            validator: (val) => val == null || val.trim().isEmpty ? 'Shop name is required' : null,
                            decoration: vendorInputDecoration(
                              hintText: 'e.g. Krishna General Store',
                              prefixIcon: Icon(Icons.store, color: kVendorSubText, size: 20),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Type Dropdown
                          Text('Shop Type', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText)),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedType,
                            dropdownColor: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(16),
                            style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
                            icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF60A5FA), size: 22),
                            decoration: vendorInputDecoration(
                              hintText: '-- Select a type --',
                              prefixIcon: Icon(Icons.tag, color: kVendorSubText, size: 20),
                            ),
                            items: _shopTypes.map((t) {
                              return DropdownMenuItem<String>(
                                value: t,
                                child: Text(
                                  t[0].toUpperCase() + t.substring(1),
                                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) => setState(() => _selectedType = val),
                          ),
                          const SizedBox(height: 20),

                          // Location Dropdown
                          Text('Location', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText)),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedLocationId,
                            dropdownColor: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(16),
                            style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
                            icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF60A5FA), size: 22),
                            decoration: vendorInputDecoration(
                              hintText: '-- No location --',
                              prefixIcon: Icon(Icons.location_on, color: kVendorSubText, size: 20),
                            ),
                            items: _locations.map((loc) {
                              return DropdownMenuItem<String>(
                                value: loc['id'] as String,
                                child: Text(
                                  loc['name'] as String,
                                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) => setState(() => _selectedLocationId = val),
                          ),
                          if (_locations.isEmpty) ...[
                            const SizedBox(height: 8),
                            Text(
                              'No locations available yet. Ask an admin to add locations first.',
                              style: TextStyle(fontSize: 12, color: kVendorSubText),
                            ),
                          ],
                          const SizedBox(height: 20),

                          // Logo / Shop Photo
                          VendorSingleImageUploader(
                            label: 'Logo / Shop Photo',
                            initialUrl: _logoController.text,
                            helperText: 'Optional - 🔥 More Important',
                            onUrlChanged: (url) => setState(() => _logoController.text = url),
                          ),
                          const SizedBox(height: 20),

                          // Banner Image
                          VendorSingleImageUploader(
                            label: 'Banner Image',
                            initialUrl: _bannerController.text,
                            isBanner: true,
                            helperText: 'Optional - 🔥 More Important',
                            onUrlChanged: (url) => setState(() => _bannerController.text = url),
                          ),
                          const SizedBox(height: 20),

                          // Description
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Description', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
                                ),
                                child: const Text(
                                  'Optional - 🔥 More Important',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFFBBF24)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _descriptionController,
                            maxLines: 3,
                            style: TextStyle(color: kVendorText, fontSize: 15, fontWeight: FontWeight.w500),
                            decoration: vendorInputDecoration(
                              hintText: 'Brief description about your shop...',
                              prefixIcon: Icon(Icons.description, color: kVendorSubText, size: 20),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Opening Hours (2 Inputs)
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Opening Time', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText)),
                                    const SizedBox(height: 2),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
                                      ),
                                      child: const Text(
                                        'Optional - 🔥 More Important',
                                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFFBBF24)),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextFormField(
                                      controller: _openingTimeController,
                                      readOnly: true,
                                      onTap: () => _selectTime(_openingTimeController),
                                      style: TextStyle(color: kVendorText, fontSize: 15, fontWeight: FontWeight.w500),
                                      decoration: vendorInputDecoration(
                                        hintText: 'Select opening time',
                                        prefixIcon: Icon(Icons.access_time, color: kVendorSubText, size: 18),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Closing Time', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText)),
                                    const SizedBox(height: 2),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
                                      ),
                                      child: const Text(
                                        'Optional - 🔥 More Important',
                                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFFBBF24)),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextFormField(
                                      controller: _closingTimeController,
                                      readOnly: true,
                                      onTap: () => _selectTime(_closingTimeController),
                                      style: TextStyle(color: kVendorText, fontSize: 15, fontWeight: FontWeight.w500),
                                      decoration: vendorInputDecoration(
                                        hintText: 'Select closing time',
                                        prefixIcon: Icon(Icons.access_time_filled, color: kVendorSubText, size: 18),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 28),

                          // Submit Button
                          VendorGradientButton(
                            width: double.infinity,
                            loading: _saving,
                            onPressed: _createShop,
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                HugeIcon(icon: HugeIcons.strokeRoundedRocket, color: Colors.white, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Create Shop',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
