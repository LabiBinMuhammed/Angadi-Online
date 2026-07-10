import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';
import 'vendor_drawer.dart';

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

      // 1. Insert new shop
      final newShop = await supabase.from('shops').insert({
        'name': _nameController.text.trim(),
        'type': _selectedType,
        'location_id': _selectedLocationId,
      }).select().single();

      // 2. Link shop in shop_owners
      await supabase.from('shop_owners').insert({
        'shop_id': newShop['id'],
        'user_id': uid,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.shopCreatedSuccess), backgroundColor: Colors.green),
        );
        _nameController.clear();
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
                            value: _selectedType,
                            dropdownColor: const Color(0xFF18181B),
                            style: TextStyle(color: kVendorText, fontSize: 15, fontWeight: FontWeight.w500),
                            icon: Icon(Icons.keyboard_arrow_down, color: kVendorSubText),
                            decoration: vendorInputDecoration(
                              hintText: '-- Select a type --',
                              prefixIcon: Icon(Icons.tag, color: kVendorSubText, size: 20),
                            ),
                            items: _shopTypes.map((t) {
                              return DropdownMenuItem<String>(
                                value: t,
                                child: Text(t[0].toUpperCase() + t.substring(1)),
                              );
                            }).toList(),
                            onChanged: (val) => setState(() => _selectedType = val),
                          ),
                          const SizedBox(height: 20),

                          // Location Dropdown
                          Text('Location', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText)),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            value: _selectedLocationId,
                            dropdownColor: const Color(0xFF18181B),
                            style: TextStyle(color: kVendorText, fontSize: 15, fontWeight: FontWeight.w500),
                            icon: Icon(Icons.keyboard_arrow_down, color: kVendorSubText),
                            decoration: vendorInputDecoration(
                              hintText: '-- No location --',
                              prefixIcon: Icon(Icons.location_on, color: kVendorSubText, size: 20),
                            ),
                            items: _locations.map((loc) {
                              return DropdownMenuItem<String>(
                                value: loc['id'] as String,
                                child: Text(loc['name'] as String),
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
