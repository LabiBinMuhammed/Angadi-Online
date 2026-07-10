import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
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
  bool _saving = false;

  final _nameCtrl = TextEditingController();
  final _imageCtrl = TextEditingController();
  String _selectedSellMode = 'Manual';
  String? _selectedCategoryId;
  String? _selectedUnitId;

  static const List<String> _sellModes = ['Manual', 'Fixed', 'Dynamic', 'Portion'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _imageCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await Future.wait([
        supabase.from('demo_items').select('id, name, sell_mode, default_image, category_id, unit_id').order('name'),
        supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
        supabase.from('units').select('id, name, symbol').order('name'),
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

  Future<void> _add() async {
    final name = _nameCtrl.text.trim();
    final image = _imageCtrl.text.trim();

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Item name is required.')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final res = await supabase.from('demo_items').insert({
        'name': name,
        'sell_mode': _selectedSellMode,
        'category_id': _selectedCategoryId,
        'unit_id': _selectedUnitId,
        'default_image': image.isEmpty ? null : image,
      }).select('*').single();

      if (mounted) {
        setState(() {
          _demos.add(res);
          _demos.sort((a, b) => (a['name'] as String).toLowerCase().compareTo((b['name'] as String).toLowerCase()));
          _saving = false;
        });
        _nameCtrl.clear();
        _imageCtrl.clear();
        _selectedSellMode = 'Manual';
        _selectedCategoryId = null;
        _selectedUnitId = null;
      }
    } catch (e) {
      debugPrint('Error adding demo: $e');
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _delete(Map<String, dynamic> demo) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Demo Template'),
          content: Text('Are you sure you want to delete "${demo['name']}"?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    try {
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

  InputDecoration _inputDeco(String label) {
    return InputDecoration(
      labelText: label,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      enabledBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: Color(0xFF333333), width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(color: kWaTeal, width: 2.0),
      ),
      border: const OutlineInputBorder(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final catMap = {for (var c in _categories) c['id'] as String: c['name'] as String};
    final unitMap = {for (var u in _units) u['id'] as String: '${u['name']} (${u['symbol']})'};

    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/demos'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Demo Templates'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: Column(
        children: [
          // Add form card
          Card(
            margin: const EdgeInsets.all(12),
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Add New Demo Template',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _nameCtrl,
                          decoration: _inputDeco('Item Name *'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 140,
                        child: DropdownButtonFormField<String>(
                          value: _selectedSellMode,
                          decoration: _inputDeco('Sell Mode'),
                          items: _sellModes.map((m) {
                            return DropdownMenuItem<String>(
                              value: m,
                              child: Text(m),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedSellMode = val);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedCategoryId,
                          decoration: _inputDeco('Category'),
                          items: _categories.map((c) {
                            return DropdownMenuItem<String>(
                              value: c['id'] as String,
                              child: Text(c['name'] ?? ''),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() => _selectedCategoryId = val);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedUnitId,
                          decoration: _inputDeco('Default Unit'),
                          items: _units.map((u) {
                            return DropdownMenuItem<String>(
                              value: u['id'] as String,
                              child: Text('${u['name']} (${u['symbol']})'),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() => _selectedUnitId = val);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _imageCtrl,
                          decoration: _inputDeco('Default Image URL'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kWaTeal,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                        onPressed: _saving ? null : _add,
                        icon: _saving
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.add, size: 16),
                        label: Text(_saving ? 'Adding...' : 'Add'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : Expanded(
                  child: ListView.separated(
                    itemCount: _demos.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final d = _demos[i];
                      final catName = d['category_id'] != null ? catMap[d['category_id']] ?? '—' : '—';
                      final unitName = d['unit_id'] != null ? unitMap[d['unit_id']] ?? '—' : '—';

                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFFF0FDF4),
                          child: Text(
                            d['name'] != null && (d['name'] as String).isNotEmpty ? (d['name'] as String)[0].toUpperCase() : '?',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
                          ),
                        ),
                        title: Text(d['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('Mode: ${d['sell_mode']} · Cat: $catName · Unit: $unitName'),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                          onPressed: () => _delete(d),
                          tooltip: 'Delete',
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }
}
