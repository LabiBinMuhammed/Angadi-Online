import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/supabase_client.dart';
import '../../widgets/directional_huge_icon.dart';
import 'vendor_theme_helper.dart';
import 'vendor_single_image_uploader.dart';

class VendorShopDetailScreen extends StatefulWidget {
  final String shopId;
  const VendorShopDetailScreen({super.key, required this.shopId});

  @override
  State<VendorShopDetailScreen> createState() => _VendorShopDetailScreenState();
}

class _VendorShopDetailScreenState extends State<VendorShopDetailScreen> {
  bool _loading = true;
  bool _saving = false;
  bool _addingOwner = false;
  Map<String, dynamic> _shop = {};
  List<Map<String, dynamic>> _locations = [];
  List<Map<String, dynamic>> _shopOwners = [];
  List<Map<String, dynamic>> _allUsers = [];

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _logoController = TextEditingController();
  final _bannerController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _openingTimeController = TextEditingController();
  final _closingTimeController = TextEditingController();
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

      // 3. Fetch shop owners
      try {
        final ownersRes = await supabase
            .from('shop_owners')
            .select('user_id, users(id, name, phone, email, role)')
            .eq('shop_id', widget.shopId);
        _shopOwners = List<Map<String, dynamic>>.from(ownersRes as List);
      } catch (e) {
        debugPrint('Error fetching shop owners: $e');
      }

      // 4. Fetch all registered users for co-owner selection
      try {
        final usersRes = await supabase
            .from('users')
            .select('id, name, phone, email, role')
            .order('name');
        _allUsers = List<Map<String, dynamic>>.from(usersRes as List);
      } catch (e) {
        debugPrint('Error fetching users: $e');
      }

      _nameController.text = _shop['name'] as String? ?? '';
      _logoController.text = _shop['logo_url'] as String? ?? '';
      _bannerController.text = _shop['banner_url'] as String? ?? '';
      _descriptionController.text = _shop['description'] as String? ?? '';
      _openingTimeController.text = _shop['opening_time'] as String? ?? '';
      _closingTimeController.text = _shop['closing_time'] as String? ?? '';

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

  Future<void> _addCoOwner(String userId) async {
    final l10n = AppLocalizations.of(context)!;
    if (_shopOwners.length >= 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.maxOwnersReached), backgroundColor: Colors.orangeAccent),
      );
      return;
    }

    setState(() => _addingOwner = true);
    try {
      final isAlready = _shopOwners.any((o) => o['user_id'] == userId || (o['users'] != null && o['users']['id'] == userId));
      if (isAlready) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('User is already an owner of this shop.'), backgroundColor: Colors.orangeAccent),
        );
        return;
      }

      await supabase.from('shop_owners').insert({
        'shop_id': widget.shopId,
        'user_id': userId,
      });

      final targetUser = _allUsers.firstWhere((u) => u['id'] == userId, orElse: () => {});
      if (targetUser['role'] == 'customer') {
        await supabase.from('users').update({'role': 'shop_owner'}).eq('id', userId);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.coOwnerAddedSuccess), backgroundColor: Colors.green),
        );
        Navigator.of(context, rootNavigator: true).pop();
        _fetchData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add co-owner: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _addingOwner = false);
    }
  }

  Future<void> _removeCoOwner(String userId, String userName) async {
    final l10n = AppLocalizations.of(context)!;
    if (_shopOwners.length <= 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.cannotRemoveOnlyOwner), backgroundColor: Colors.orangeAccent),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Remove Co-Owner', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to remove $userName as co-owner?', style: const TextStyle(color: Color(0xFF94A3B8))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await supabase
          .from('shop_owners')
          .delete()
          .eq('shop_id', widget.shopId)
          .eq('user_id', userId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.coOwnerRemovedSuccess), backgroundColor: Colors.green),
        );
        _fetchData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to remove co-owner: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  void _showAddCoOwnerDialog() {
    final l10n = AppLocalizations.of(context)!;
    String? selectedUserId;
    String searchFilter = '';

    final currentOwnerIds = _shopOwners.map((o) => o['user_id'] as String?).whereType<String>().toSet();
    final availableUsers = _allUsers.where((u) => !currentOwnerIds.contains(u['id'])).toList();

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filteredList = availableUsers.where((u) {
              final n = (u['name'] ?? '').toString().toLowerCase();
              final p = (u['phone'] ?? '').toString().toLowerCase();
              final e = (u['email'] ?? '').toString().toLowerCase();
              final q = searchFilter.toLowerCase().trim();
              return n.contains(q) || p.contains(q) || e.contains(q);
            }).toList();

            return AlertDialog(
              backgroundColor: const Color(0xFF1E293B),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              title: Row(
                children: [
                  const Icon(Icons.group_add_rounded, color: Color(0xFF60A5FA), size: 24),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      l10n.addCoOwnerModalTitle,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Select a registered user from the platform to grant full co-owner management access to this shop.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8), height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      onChanged: (val) => setModalState(() => searchFilter = val),
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Search by name or phone...',
                        hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                        prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B), size: 18),
                        filled: true,
                        fillColor: const Color(0xFF0F172A),
                        isDense: true,
                        contentPadding: const EdgeInsets.all(12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 220),
                      child: filteredList.isEmpty
                          ? const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(child: Text('No users found', style: TextStyle(color: Color(0xFF64748B)))),
                            )
                          : ListView.builder(
                              shrinkWrap: true,
                              itemCount: filteredList.length,
                              itemBuilder: (context, idx) {
                                final u = filteredList[idx];
                                final isSelected = selectedUserId == u['id'];
                                final uName = u['name'] ?? 'Unnamed User';
                                final uPhone = u['phone'] ?? u['email'] ?? 'No contact';
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFF2563EB).withValues(alpha: 0.2) : const Color(0xFF0F172A),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFF334155),
                                    ),
                                  ),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                                    dense: true,
                                    leading: CircleAvatar(
                                      backgroundColor: const Color(0xFF334155),
                                      radius: 16,
                                      child: Text(
                                        uName.isNotEmpty ? uName[0].toUpperCase() : '?',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                    ),
                                    title: Text(uName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                    subtitle: Text(uPhone, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                                    trailing: isSelected
                                        ? const Icon(Icons.check_circle, color: Color(0xFF3B82F6), size: 20)
                                        : null,
                                    onTap: () => setModalState(() => selectedUserId = u['id'] as String?),
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF22C55E),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: selectedUserId == null || _addingOwner
                      ? null
                      : () {
                          _addCoOwner(selectedUserId!);
                        },
                  child: _addingOwner
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Add Co-Owner', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }


  Future<void> _saveShop() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    try {
      String? finalType = _selectedType;
      if (finalType != null && !_isActive) {
        finalType = '${finalType}_inactive';
      }

      final res = await http.put(
        Uri.parse('http://localhost:3000/api/vendor/shop'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'shopId': widget.shopId,
          'name': _nameController.text.trim(),
          'type': _selectedType,
          'locationId': _selectedLocationId,
          'isActive': _isActive,
          'logoUrl': _logoController.text.trim().isEmpty ? null : _logoController.text.trim(),
          'bannerUrl': _bannerController.text.trim().isEmpty ? null : _bannerController.text.trim(),
          'description': _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
          'openingTime': _openingTimeController.text.trim().isEmpty ? null : _openingTimeController.text.trim(),
          'closingTime': _closingTimeController.text.trim().isEmpty ? null : _closingTimeController.text.trim(),
        }),
      );

      final data = jsonDecode(res.body);
      if (res.statusCode != 200 || data['success'] != true) {
        throw Exception(data['error'] ?? 'Failed to update shop');
      }

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
    final name = _nameController.text.trim();
    final initialsStr = name.isNotEmpty ? _initials(name) : '?';
    final locName = _locations.firstWhere((l) => l['id'] == _selectedLocationId, orElse: () => {'name': ''})['name'] as String?;

    return Scaffold(
      backgroundColor: kVendorBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: Text(l10n.vendorShopsTitle, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
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
                                color: const Color(0xFF6366F1).withValues(alpha: 0.4),
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
                                  hintText: 'Brief description about your shop and offerings...',
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

                        // Shop Owners / Co-Owners Card
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: vendorCardDecoration(radius: 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.group, color: Color(0xFF60A5FA), size: 22),
                                      const SizedBox(width: 10),
                                      Text(
                                        l10n.shopOwnersTitle,
                                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: kVendorText),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.3)),
                                    ),
                                    child: Text(
                                      '${_shopOwners.length}/3 Owners',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF60A5FA)),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                l10n.coOwnersDesc,
                                style: TextStyle(fontSize: 12, color: kVendorSubText, height: 1.4),
                              ),
                              const SizedBox(height: 18),
                              Column(
                                children: _shopOwners.map((ownerRow) {
                                  final uData = ownerRow['users'] as Map<String, dynamic>? ?? {};
                                  final uId = ownerRow['user_id'] as String? ?? uData['id'] as String? ?? '';
                                  final uName = uData['name'] as String? ?? 'Shop Owner';
                                  final uPhone = uData['phone'] as String? ?? uData['email'] as String? ?? 'No contact';
                                  final isCurrentUser = supabase.auth.currentUser?.id == uId;

                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 10),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: kVendorTransparentBg,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: kVendorCardBorder),
                                    ),
                                    child: Row(
                                      children: [
                                        CircleAvatar(
                                          backgroundColor: const Color(0xFF3B82F6).withValues(alpha: 0.2),
                                          radius: 18,
                                          child: Text(
                                            uName.isNotEmpty ? uName[0].toUpperCase() : 'O',
                                            style: const TextStyle(color: Color(0xFF60A5FA), fontWeight: FontWeight.bold, fontSize: 14),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Flexible(
                                                    child: Text(
                                                      uName,
                                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: kVendorText),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  if (isCurrentUser) ...[
                                                    const SizedBox(width: 6),
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                                      decoration: BoxDecoration(
                                                        color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                                                        borderRadius: BorderRadius.circular(6),
                                                      ),
                                                      child: const Text(
                                                        'You',
                                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF22C55E)),
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                uPhone,
                                                style: TextStyle(fontSize: 12, color: kVendorSubText),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (_shopOwners.length > 1)
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                                            tooltip: 'Remove co-owner',
                                            onPressed: () => _removeCoOwner(uId, uName),
                                          ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 12),
                              VendorOutlineButton(
                                width: double.infinity,
                                borderColor: _shopOwners.length >= 3 ? Colors.grey : const Color(0xFF60A5FA),
                                onPressed: _shopOwners.length >= 3 ? null : _showAddCoOwnerDialog,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.person_add_alt_1_rounded, color: _shopOwners.length >= 3 ? Colors.grey : const Color(0xFF60A5FA), size: 18),
                                    const SizedBox(width: 8),
                                    Text(
                                      _shopOwners.length >= 3 ? l10n.maxOwnersReached : l10n.addCoOwnerBtn,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: _shopOwners.length >= 3 ? Colors.grey : const Color(0xFF60A5FA),
                                      ),
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
