import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import 'admin_drawer.dart';

class AdminLocationsScreen extends StatefulWidget {
  const AdminLocationsScreen({super.key});
  @override
  State<AdminLocationsScreen> createState() => _AdminLocationsScreenState();
}

class _AdminLocationsScreenState extends State<AdminLocationsScreen> {
  List<Map<String, dynamic>> _locations = [];
  bool _loading = true;
  bool _saving = false;

  final _nameCtrl = TextEditingController();
  final _latCtrl = TextEditingController();
  final _lngCtrl = TextEditingController();
  String _selectedType = 'market';

  static const List<Map<String, String>> _locationTypes = [
    {'value': 'market', 'label': 'Market'},
    {'value': 'town', 'label': 'Town'},
    {'value': 'city', 'label': 'City'},
    {'value': 'village', 'label': 'Village'},
    {'value': 'colony', 'label': 'Colony'},
    {'value': 'block', 'label': 'Block'},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _latCtrl.dispose();
    _lngCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await supabase.from('locations').select('*').order('name');
      if (mounted) {
        setState(() {
          _locations = (res as List).cast<Map<String, dynamic>>();
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading locations data: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _add() async {
    final name = _nameCtrl.text.trim();
    final lat = double.tryParse(_latCtrl.text.trim());
    final lng = double.tryParse(_lngCtrl.text.trim());

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Location Name is required.')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final res = await supabase.from('locations').insert({
        'name': name,
        'type': _selectedType,
        'latitude': lat,
        'longitude': lng,
      }).select('*').single();

      if (mounted) {
        setState(() {
          _locations.add(res);
          _locations.sort((a, b) => (a['name'] as String).toLowerCase().compareTo((b['name'] as String).toLowerCase()));
          _saving = false;
        });
        _nameCtrl.clear();
        _latCtrl.clear();
        _lngCtrl.clear();
        _selectedType = 'market';
      }
    } catch (e) {
      debugPrint('Error adding location: $e');
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding location: $e')),
        );
      }
    }
  }

  Future<void> _delete(Map<String, dynamic> loc) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Location'),
          content: Text('Are you sure you want to delete "${loc['name']}"?'),
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
      await supabase.from('locations').delete().eq('id', loc['id']);
      if (mounted) {
        setState(() {
          _locations.removeWhere((l) => l['id'] == loc['id']);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Location "${loc['name']}" deleted successfully.')),
        );
      }
    } catch (e) {
      debugPrint('Error deleting location: $e');
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
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/locations'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Location Management'),
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
                    'Add New Location',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _nameCtrl,
                          decoration: _inputDeco('Location Name *'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 130,
                        child: DropdownButtonFormField<String>(
                          value: _selectedType,
                          decoration: _inputDeco('Type'),
                          items: _locationTypes.map((t) {
                            return DropdownMenuItem<String>(
                              value: t['value'],
                              child: Text(t['label'] ?? ''),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedType = val);
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
                          controller: _latCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: _inputDeco('Latitude'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _lngCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: _inputDeco('Longitude'),
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
                    itemCount: _locations.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final l = _locations[i];
                      final typeLabel = _locationTypes.firstWhere(
                        (t) => t['value'] == l['type'],
                        orElse: () => {'label': l['type'] ?? '—'},
                      )['label'];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFFE3F2FD),
                          child: const Icon(Icons.location_on, color: Colors.blue),
                        ),
                        title: Text(l['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('Type: $typeLabel · Coordinates: ${l['latitude'] ?? '0.0'}, ${l['longitude'] ?? '0.0'}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                          onPressed: () => _delete(l),
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
