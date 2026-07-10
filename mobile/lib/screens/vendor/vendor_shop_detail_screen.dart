import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../widgets/directional_huge_icon.dart';
import 'vendor_theme_helper.dart';

class VendorShopDetailScreen extends StatefulWidget {
  final String shopId;
  const VendorShopDetailScreen({super.key, required this.shopId});

  @override
  State<VendorShopDetailScreen> createState() => _VendorShopDetailScreenState();
}

class _VendorShopDetailScreenState extends State<VendorShopDetailScreen> {
  bool _loading = true;
  bool _saving = false;
  Map<String, dynamic> _shop = {};
  List<Map<String, dynamic>> _locations = [];

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  String? _selectedType;
  String? _selectedLocationId;
  bool _isActive = true;

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
      // 1. Fetch locations
      final locsRes = await supabase.from('locations').select('id, name').order('name');
      _locations = List<Map<String, dynamic>>.from(locsRes as List);

      // 2. Fetch shop details
      final shopRes = await supabase
          .from('shops')
          .select('*, locations(id, name)')
          .eq('id', widget.shopId)
          .single();
      _shop = shopRes;

      _nameController.text = _shop['name'] as String? ?? '';
      final typeStr = _shop['type'] as String? ?? '';
      _selectedType = typeStr.replaceAll('_inactive', '');
      _selectedLocationId = _shop['location_id'] as String?;
      _isActive = !typeStr.endsWith('_inactive');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading shop: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveShop() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    try {
      String? finalType = _selectedType;
      if (finalType != null && !_isActive) {
        finalType = '${finalType}_inactive';
      }

      await supabase.from('shops').update({
        'name': _nameController.text.trim(),
        'type': finalType,
        'location_id': _selectedLocationId,
      }).eq('id', widget.shopId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Shop updated successfully!'), backgroundColor: Colors.green),
        );
        _fetchData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update shop: $e'), backgroundColor: Colors.redAccent),
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
    final name = _nameController.text.trim();
    final initialsStr = name.isNotEmpty ? _initials(name) : '?';
    final locName = _locations.firstWhere((l) => l['id'] == _selectedLocationId, orElse: () => {'name': ''})['name'] as String?;

    return Scaffold(
      backgroundColor: kVendorBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: const Text('Shop Settings', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const DirectionalHugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Shop Preview Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: vendorCardDecoration(radius: 24),
                    child: Row(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
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
                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 32, color: kVendorText),
                          ),
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name.isNotEmpty ? name : 'Your Shop Name',
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 22, color: kVendorText, letterSpacing: -0.5),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  if (_selectedType != null) ...[
                                    VendorBadge(
                                      label: _selectedType!,
                                      type: VendorBadgeType.info,
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  if (locName != null && locName.isNotEmpty) ...[
                                    Text('•', style: TextStyle(color: kVendorSubText)),
                                    const SizedBox(width: 8),
                                    const HugeIcon(icon: HugeIcons.strokeRoundedLocation01, size: 14, color: Color(0xFF94A3B8)),
                                    const SizedBox(width: 4),
                                    Text(
                                      locName,
                                      style: TextStyle(fontSize: 13, color: kVendorSubText, fontWeight: FontWeight.w500),
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  Text('•', style: TextStyle(color: kVendorSubText)),
                                  const SizedBox(width: 8),
                                  VendorBadge(
                                    label: _isActive ? 'Active' : 'Inactive',
                                    type: _isActive ? VendorBadgeType.success : VendorBadgeType.danger,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Form & Actions Layout
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Edit Form
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: vendorCardDecoration(radius: 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Edit Shop Details',
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
                              const SizedBox(height: 24),

                              // Toggle Active Switch Row
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: kVendorTransparentBg,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: kVendorCardBorder),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              HugeIcon(
                                                icon: _isActive ? HugeIcons.strokeRoundedView : HugeIcons.strokeRoundedViewOff,
                                                color: _isActive ? const Color(0xFF4CD964) : const Color(0xFFFF4757),
                                                size: 18,
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                'Shop Status',
                                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: kVendorText),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            _isActive ? 'Your shop is visible and open.' : 'Your shop is offline and hidden.',
                                            style: TextStyle(fontSize: 12, color: kVendorSubText),
                                          ),
                                        ],
                                      ),
                                    ),
                                    VendorOutlineButton(
                                      height: 36,
                                      borderColor: _isActive ? const Color(0xFF4CD964) : const Color(0xFFFF4757),
                                      onPressed: () => setState(() => _isActive = !_isActive),
                                      child: Text(
                                        _isActive ? 'Deactivate' : 'Activate',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: _isActive ? const Color(0xFF4CD964) : const Color(0xFFFF4757),
                                        ),
                                      ),
                                    )
                                  ],
                                ),
                              ),
                              const SizedBox(height: 28),

                              // Submit Button
                              VendorGradientButton(
                                width: double.infinity,
                                loading: _saving,
                                onPressed: _saveShop,
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    HugeIcon(icon: HugeIcons.strokeRoundedRocket, color: Colors.white, size: 20),
                                    SizedBox(width: 8),
                                    Text(
                                      'Save Changes',
                                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Operations Grid
                        Text(
                          'Shop Operations',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kVendorText),
                        ),
                        const SizedBox(height: 16),
                        GridView.count(
                          crossAxisCount: 2,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 1.2,
                          children: [
                            _OpCard(
                              icon: HugeIcons.strokeRoundedAddCircle,
                              iconColor: const Color(0xFF60A5FA),
                              label: 'Add Product',
                              onTap: () => context.push('/vendor/items/new'),
                            ),
                            _OpCard(
                              icon: HugeIcons.strokeRoundedDashboardSquare01,
                              iconColor: const Color(0xFFC084FC),
                              label: 'Manage Catalog',
                              onTap: () => context.push('/vendor/items'),
                            ),
                            _OpCard(
                              icon: HugeIcons.strokeRoundedShoppingBasket01,
                              iconColor: const Color(0xFFFBBF24),
                              label: 'Manage Orders',
                              onTap: () => context.push('/vendor/orders'),
                            ),
                            _OpCard(
                              icon: HugeIcons.strokeRoundedCreditCard,
                              iconColor: const Color(0xFF34D399),
                              label: 'Customer Credit',
                              onTap: () => context.push('/vendor/credit'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _OpCard extends StatelessWidget {
  final List<List<dynamic>> icon;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;
  const _OpCard({required this.icon, required this.iconColor, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: vendorCardDecoration(radius: 20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            HugeIcon(icon: icon, color: iconColor, size: 28),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: kVendorText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
