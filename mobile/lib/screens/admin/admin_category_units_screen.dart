import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import 'admin_drawer.dart';

class AdminCategoryUnitsScreen extends StatefulWidget {
  const AdminCategoryUnitsScreen({super.key});
  @override
  State<AdminCategoryUnitsScreen> createState() => _AdminCategoryUnitsScreenState();
}

class _AdminCategoryUnitsScreenState extends State<AdminCategoryUnitsScreen> {
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _unitGroups = [];
  List<Map<String, dynamic>> _mappings = [];
  bool _loading = true;
  bool _saving = false;
  String? _selectedCategoryId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await Future.wait([
        supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
        supabase.from('unit_groups').select('id, name').order('name'),
        supabase.from('category_unit_groups').select('id, category_id, unit_group_id'),
      ]);

      if (mounted) {
        setState(() {
          _categories = (res[0] as List).cast<Map<String, dynamic>>();
          _unitGroups = (res[1] as List).cast<Map<String, dynamic>>();
          _mappings = (res[2] as List).cast<Map<String, dynamic>>();
          if (_categories.isNotEmpty) {
            _selectedCategoryId = _categories[0]['id'];
          }
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading category unit mapping: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleMapping(String ugId) async {
    if (_selectedCategoryId == null || _saving) return;

    setState(() => _saving = true);
    final categoryId = _selectedCategoryId!;
    final existing = _mappings.firstWhere(
      (m) => m['category_id'] == categoryId && m['unit_group_id'] == ugId,
      orElse: () => <String, dynamic>{},
    );

    try {
      if (existing.isNotEmpty) {
        // Delete mapping
        await supabase.from('category_unit_groups').delete().eq('id', existing['id']);
        if (mounted) {
          setState(() {
            _mappings.removeWhere((m) => m['id'] == existing['id']);
            _saving = false;
          });
        }
      } else {
        // Insert mapping
        final res = await supabase.from('category_unit_groups').insert({
          'category_id': categoryId,
          'unit_group_id': ugId,
        }).select('*').single();
        if (mounted) {
          setState(() {
            _mappings.add(res);
            _saving = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error updating mapping: $e');
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update mapping: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final catMappings = _mappings.where((m) => m['category_id'] == _selectedCategoryId).toList();
    final mappedUgIds = catMappings.map((m) => m['unit_group_id'] as String).toSet();

    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/category-units'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Category-Unit Map'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth > 600;
                final listContent = ListView.builder(
                  itemCount: _unitGroups.length,
                  itemBuilder: (context, i) {
                    final ug = _unitGroups[i];
                    final isMapped = mappedUgIds.contains(ug['id']);
                    return CheckboxListTile(
                      activeColor: kWaTeal,
                      title: Text(
                        ug['name'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      value: isMapped,
                      onChanged: _saving ? null : (_) => _toggleMapping(ug['id']),
                    );
                  },
                );

                if (isWide) {
                  return Row(
                    children: [
                      // Category Sidebar
                      Container(
                        width: 250,
                        decoration: const BoxDecoration(
                          border: Border(right: BorderSide(color: Color(0xFFE2E8F0))),
                        ),
                        child: ListView.builder(
                          itemCount: _categories.length,
                          itemBuilder: (context, i) {
                            final cat = _categories[i];
                            final isSelected = cat['id'] == _selectedCategoryId;
                            final count = _mappings.where((m) => m['category_id'] == cat['id']).length;
                            return ListTile(
                              selected: isSelected,
                              selectedTileColor: const Color(0xFFE8F5E9),
                              selectedColor: kWaTeal,
                              title: Text(cat['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                              trailing: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: isSelected ? kWaTeal : Colors.grey,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  count.toString(),
                                  style: const TextStyle(color: Colors.white, fontSize: 11),
                                ),
                              ),
                              onTap: () {
                                setState(() => _selectedCategoryId = cat['id']);
                              },
                            );
                          },
                        ),
                      ),
                      // Unit Groups List
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Text(
                                'Allowed Unit Groups ${_saving ? "(saving...)" : ""}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                            ),
                            const Divider(height: 1),
                            Expanded(child: listContent),
                          ],
                        ),
                      ),
                    ],
                  );
                } else {
                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: DropdownButtonFormField<String>(
                          value: _selectedCategoryId,
                          decoration: const InputDecoration(
                            labelText: 'Select Category',
                            border: OutlineInputBorder(),
                          ),
                          items: _categories.map((c) {
                            final count = _mappings.where((m) => m['category_id'] == c['id']).length;
                            return DropdownMenuItem<String>(
                              value: c['id'] as String,
                              child: Text('${c['name']} ($count mapping(s))'),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() => _selectedCategoryId = val);
                          },
                        ),
                      ),
                      const Divider(height: 1),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                              child: Text(
                                'Allowed Unit Groups ${_saving ? "(saving...)" : ""}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                            ),
                            const Divider(height: 1),
                            Expanded(child: listContent),
                          ],
                        ),
                      ),
                    ],
                  );
                }
              },
            ),
    );
  }
}
