import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import 'admin_drawer.dart';

class AdminUnitsScreen extends StatefulWidget {
  const AdminUnitsScreen({super.key});
  @override
  State<AdminUnitsScreen> createState() => _AdminUnitsScreenState();
}

class _AdminUnitsScreenState extends State<AdminUnitsScreen> {
  List<Map<String, dynamic>> _units = [];
  List<Map<String, dynamic>> _groups = [];
  bool _loading = true;
  bool _saving = false;

  final _nameCtrl = TextEditingController();
  final _symbolCtrl = TextEditingController();
  final _multiplierCtrl = TextEditingController(text: '1.0');
  String? _selectedGroupId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _symbolCtrl.dispose();
    _multiplierCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await Future.wait([
        supabase.from('units').select('*').order('name'),
        supabase.from('unit_groups').select('*').order('name'),
      ]);

      if (mounted) {
        setState(() {
          _units = (res[0] as List).cast<Map<String, dynamic>>();
          _groups = (res[1] as List).cast<Map<String, dynamic>>();
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading units data: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _add() async {
    final name = _nameCtrl.text.trim();
    final symbol = _symbolCtrl.text.trim();
    final multiplier = double.tryParse(_multiplierCtrl.text.trim()) ?? 1.0;

    if (name.isEmpty || symbol.isEmpty || _selectedGroupId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name, symbol, and unit group are required.')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final res = await supabase.from('units').insert({
        'name': name,
        'symbol': symbol,
        'unit_group_id': _selectedGroupId,
        'base_multiplier': multiplier,
      }).select('*').single();

      if (mounted) {
        setState(() {
          _units.add(res);
          _units.sort((a, b) => (a['name'] as String).toLowerCase().compareTo((b['name'] as String).toLowerCase()));
          _saving = false;
        });
        _nameCtrl.clear();
        _symbolCtrl.clear();
        _multiplierCtrl.text = '1.0';
        _selectedGroupId = null;
      }
    } catch (e) {
      debugPrint('Error adding unit: $e');
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding unit: $e')),
        );
      }
    }
  }

  Future<void> _delete(Map<String, dynamic> unit) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Unit'),
          content: Text('Are you sure you want to delete "${unit['name']}"? Any items referencing it may be affected.'),
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
      await supabase.from('units').delete().eq('id', unit['id']);
      if (mounted) {
        setState(() {
          _units.removeWhere((u) => u['id'] == unit['id']);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unit "${unit['name']}" deleted successfully.')),
        );
      }
    } catch (e) {
      debugPrint('Error deleting unit: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cannot delete unit as it is referenced by active items.')),
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
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/units'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Unit Management'),
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
                    'Add New Unit',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _nameCtrl,
                          decoration: _inputDeco('Unit Name (e.g. Kilogram) *'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 110,
                        child: TextField(
                          controller: _symbolCtrl,
                          decoration: _inputDeco('Symbol *'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedGroupId,
                          decoration: _inputDeco('Unit Group *'),
                          items: _groups.map((g) {
                            return DropdownMenuItem<String>(
                              value: g['id'] as String,
                              child: Text(g['name'] ?? ''),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() => _selectedGroupId = val);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 130,
                        child: TextField(
                          controller: _multiplierCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: _inputDeco('Base Multiplier'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kWaTeal,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                        onPressed: _saving ? null : _add,
                        icon: _saving
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.add, size: 16),
                        label: Text(_saving ? 'Adding...' : 'Add Unit'),
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
                    itemCount: _units.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final u = _units[i];
                      final groupName = _groups.firstWhere(
                        (g) => g['id'] == u['unit_group_id'],
                        orElse: () => <String, dynamic>{},
                      )['name'] ?? '—';
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFFF0F2F5),
                          child: Text(u['symbol'] ?? 'u', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF075E54))),
                        ),
                        title: Text(u['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('Group: $groupName · Multiplier: ${u['base_multiplier']}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                          onPressed: () => _delete(u),
                          tooltip: 'Delete Unit',
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
